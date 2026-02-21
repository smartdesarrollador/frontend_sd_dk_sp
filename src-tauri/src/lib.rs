use std::sync::Mutex;
use tauri::{Manager, State};

#[cfg(target_os = "windows")]
mod appbar;

pub struct AppBarHandle {
    /// HWND stored as usize for thread-safe sharing across Mutex boundaries.
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

        // Update global width for the subclass proc
        appbar::subclass::set_current_width(width);

        // Register the appbar (safe to call from any thread)
        appbar::registration::register_appbar(hwnd, width);

        // Install the window subclass — must run on the UI thread
        window
            .run_on_main_thread(move || {
                appbar::subclass::install_subclass(hwnd);
            })
            .map_err(|e| format!("run_on_main_thread error: {e}"))?;

        let mut guard = state
            .0
            .lock()
            .map_err(|e| format!("lock error: {e}"))?;
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
        let mut guard = state
            .0
            .lock()
            .map_err(|e| format!("lock error: {e}"))?;
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
        let mut guard = state
            .0
            .lock()
            .map_err(|e| format!("lock error: {e}"))?;
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

pub fn run() {
    tauri::Builder::default()
        .manage(AppBarMutex(Mutex::new(AppBarHandle::default())))
        .invoke_handler(tauri::generate_handler![
            register_appbar,
            resize_appbar,
            unregister_appbar,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Fallback cleanup: unregister AppBar if the frontend didn't do it
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
