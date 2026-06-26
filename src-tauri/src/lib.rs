use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_deep_link::DeepLinkExt; // needed for .register()

#[cfg(target_os = "windows")]
mod appbar;

pub struct AppBarHandle {
    pub hwnd: usize,
    pub registered: bool,
    pub current_width: i32,
}

impl Default for AppBarHandle {
    fn default() -> Self {
        AppBarHandle {
            hwnd: 0,
            registered: false,
            current_width: 0,
        }
    }
}

pub struct AppBarMutex(pub Mutex<AppBarHandle>);

/// Stores the full deep-link URL received via single-instance argv.
/// React polls this via `poll_deep_link_url` and clears it after reading.
pub struct PendingDeepLinkMutex(pub Mutex<Option<String>>);

/// Stores the resolved auth payload (set by `store_desktop_auth`).
pub struct DesktopAuthMutex(pub Mutex<Option<serde_json::Value>>);

#[cfg(target_os = "windows")]
fn get_hwnd(window: &tauri::WebviewWindow) -> Result<usize, String> {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    let handle = window
        .window_handle()
        .map_err(|e| format!("window_handle error: {e}"))?;
    match handle.as_raw() {
        RawWindowHandle::Win32(h) => Ok(h.hwnd.get() as usize),
        _ => Err("Not a Win32 window".to_string()),
    }
}

#[tauri::command]
fn register_appbar(
    window: tauri::WebviewWindow,
    state: State<'_, AppBarMutex>,
    width: i32,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let hwnd = get_hwnd(&window)?;
        appbar::subclass::set_current_width(width);
        appbar::registration::register_appbar(hwnd, width);
        window
            .run_on_main_thread(move || {
                appbar::subclass::install_subclass(hwnd);
            })
            .map_err(|e| format!("run_on_main_thread error: {e}"))?;
        let mut guard = state.0.lock().map_err(|e| format!("lock error: {e}"))?;
        guard.hwnd = hwnd;
        guard.registered = true;
        guard.current_width = width;
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, state, width);
        return Err("AppBar is only supported on Windows".to_string());
    }
    Ok(())
}

#[tauri::command]
fn resize_appbar(state: State<'_, AppBarMutex>, width: i32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut guard = state.0.lock().map_err(|e| format!("lock error: {e}"))?;
        if guard.registered && guard.hwnd != 0 {
            appbar::subclass::set_current_width(width);
            appbar::registration::update_appbar_position(guard.hwnd, width);
            guard.current_width = width;
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (state, width);
    }
    Ok(())
}

#[tauri::command]
fn unregister_appbar(state: State<'_, AppBarMutex>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut guard = state.0.lock().map_err(|e| format!("lock error: {e}"))?;
        if guard.registered && guard.hwnd != 0 {
            appbar::registration::unregister_appbar(guard.hwnd);
            guard.registered = false;
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = state;
    }
    Ok(())
}

#[tauri::command]
fn open_hub_login(state_nonce: String) -> Result<(), String> {
    let hub_url = env!("HUB_URL");
    let url = format!(
        "{}/login?source=desktop&state={}",
        hub_url, state_nonce
    );
    opener::open(url).map_err(|e| e.to_string())
}

/// Returns the pending deep-link URL (if any) and clears it atomically.
/// React polls this every 500ms while isLoggingIn=true.
#[tauri::command]
fn poll_deep_link_url(
    state: State<'_, PendingDeepLinkMutex>,
) -> Result<Option<String>, String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.take())
}

#[tauri::command]
fn store_desktop_auth(
    state: State<'_, DesktopAuthMutex>,
    payload: serde_json::Value,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(payload);
    Ok(())
}

#[tauri::command]
fn get_desktop_auth(
    state: State<'_, DesktopAuthMutex>,
) -> Result<Option<serde_json::Value>, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[tauri::command]
fn clear_desktop_auth(state: State<'_, DesktopAuthMutex>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppBarMutex(Mutex::new(AppBarHandle::default())))
        .manage(PendingDeepLinkMutex(Mutex::new(None)))
        .manage(DesktopAuthMutex(Mutex::new(None)))
        // single-instance MUST come before deep-link
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // Extract rbacdesktop:// URL from argv and store for React polling
            for arg in &argv {
                if arg.starts_with("rbacdesktop://") {
                    if let Some(state) = app.try_state::<PendingDeepLinkMutex>() {
                        if let Ok(mut guard) = state.0.lock() {
                            *guard = Some(arg.clone());
                        }
                    }
                    break;
                }
            }
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            app.deep_link().register("rbacdesktop")?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            register_appbar,
            resize_appbar,
            unregister_appbar,
            open_hub_login,
            poll_deep_link_url,
            store_desktop_auth,
            get_desktop_auth,
            clear_desktop_auth,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                #[cfg(target_os = "windows")]
                {
                    if let Some(state) = window.try_state::<AppBarMutex>() {
                        if let Ok(mut guard) = state.0.lock() {
                            if guard.registered && guard.hwnd != 0 {
                                appbar::registration::unregister_appbar(guard.hwnd);
                                guard.registered = false;
                            }
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
