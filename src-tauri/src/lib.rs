use std::sync::{Mutex, OnceLock};
use tauri::{Manager, State};
use tauri_plugin_deep_link::DeepLinkExt; // needed for .register()

#[cfg(target_os = "windows")]
mod appbar;

/// Global handle so native code (the appbar subclass proc) can reach the app.
static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

/// True while the webview window is being torn down and rebuilt after resume.
/// Destroying the (only) window fires `RunEvent::ExitRequested`; the run-loop
/// callback checks this flag and prevents the exit so the app survives the gap.
#[cfg(target_os = "windows")]
static REBUILDING: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

/// Recreate the webview window after resume-from-suspend.
///
/// Observed: after some suspend/resume cycles the WebView2 IPC channel dies
/// silently — JS keeps running and rendering, but `invoke()` calls never reach
/// Rust (no `register_appbar`/`resize_appbar` ever logged again). No JS-side
/// recovery (reload included) can fix that, because nothing JS sends arrives.
/// The native side stays healthy, so we detect the resume via
/// `WM_POWERBROADCAST` in the subclass proc and rebuild the whole window:
/// fresh WebView2 → fresh IPC → React remounts → `register_appbar` re-runs.
#[cfg(target_os = "windows")]
pub(crate) fn recreate_window_on_resume() {
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::Instant;

    // Debounce: PBT_APMRESUMEAUTOMATIC and PBT_APMRESUMESUSPEND can both fire
    // for one resume; only rebuild once per window.
    static CLOCK: OnceLock<Instant> = OnceLock::new();
    static LAST_MS: AtomicU64 = AtomicU64::new(0);
    const DEBOUNCE_MS: u64 = 15_000;

    let now = CLOCK.get_or_init(Instant::now).elapsed().as_millis() as u64;
    let last = LAST_MS.load(Ordering::SeqCst);
    if last != 0 && now.saturating_sub(last) < DEBOUNCE_MS {
        return;
    }
    LAST_MS.store(now.max(1), Ordering::SeqCst);

    let Some(handle) = APP_HANDLE.get().cloned() else {
        return;
    };
    REBUILDING.store(true, Ordering::SeqCst);
    std::thread::spawn(move || {
        // Let the resume storm (display/work-area churn) settle first.
        std::thread::sleep(std::time::Duration::from_millis(1200));

        let h = handle.clone();
        let _ = handle.run_on_main_thread(move || {
            eprintln!("[appbar] resume detected → destroying webview window");
            if let Some(win) = h.get_webview_window("main") {
                // destroy() — fires our Destroyed handler, which unregisters
                // the appbar band.
                let _ = win.destroy();
            }
        });

        // destroy() completes asynchronously: rebuilding immediately failed
        // with "a webview with label `main` already exists". Poll until the
        // label is actually freed (up to ~5s).
        for _ in 0..50 {
            std::thread::sleep(std::time::Duration::from_millis(100));
            if handle.get_webview_window("main").is_none() {
                break;
            }
        }

        let h = handle.clone();
        let _ = handle.run_on_main_thread(move || {
            if let Some(cfg) = h.config().app.windows.first().cloned() {
                match tauri::WebviewWindowBuilder::from_config(&h, &cfg) {
                    Ok(builder) => match builder.build() {
                        Ok(_) => eprintln!("[appbar] webview window recreated"),
                        Err(e) => eprintln!("[appbar] window rebuild failed: {e}"),
                    },
                    Err(e) => eprintln!("[appbar] builder from_config failed: {e}"),
                }
            }
            REBUILDING.store(false, Ordering::SeqCst);
        });
    });
}

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

/// Apply the shell-approved rect through the Tauri window API instead of raw
/// `MoveWindow`. This keeps tao's internal window state in sync — the window is
/// `resizable: false`, and after resume-from-suspend tao re-asserts the size it
/// *thinks* the window has (60px), which snapped the panel back to a sliver
/// whenever we had resized behind its back with Win32 calls.
#[cfg(target_os = "windows")]
fn apply_window_rect(
    window: &tauri::WebviewWindow,
    rc: &windows_sys::Win32::Foundation::RECT,
) -> Result<(), String> {
    use tauri::{PhysicalPosition, PhysicalSize};
    let w = (rc.right - rc.left).max(1) as u32;
    let h = (rc.bottom - rc.top).max(1) as u32;
    let (left, top) = (rc.left, rc.top);

    window
        .set_size(PhysicalSize::new(w, h))
        .map_err(|e| format!("set_size error: {e}"))?;
    window
        .set_position(PhysicalPosition::new(left, top))
        .map_err(|e| format!("set_position error: {e}"))?;

    // Double-tap: right after resume something can re-assert the stale size
    // asynchronously (tao DPI handling / Windows window-position restore),
    // shrinking the window back moments after we set it. Re-apply once shortly
    // after; harmless when nothing interfered.
    let win = window.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(250));
        let _ = win.set_size(PhysicalSize::new(w, h));
        let _ = win.set_position(PhysicalPosition::new(left, top));
    });
    Ok(())
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
        // Fresh registration: drop any stale shell-side registration first
        // (after resume-from-suspend the shell can carry a ghost band that
        // corrupts subsequent QUERYPOS/SETPOS results). ABM_REMOVE when not
        // registered is harmless.
        appbar::registration::unregister_appbar(hwnd);
        appbar::registration::ensure_registered(hwnd);
        let rc = appbar::registration::reserve_band(hwnd, width);
        apply_window_rect(&window, &rc)?;
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
fn resize_appbar(
    window: tauri::WebviewWindow,
    state: State<'_, AppBarMutex>,
    width: i32,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut guard = state.0.lock().map_err(|e| format!("lock error: {e}"))?;
        if guard.registered && guard.hwnd != 0 {
            appbar::subclass::set_current_width(width);
            let rc = appbar::registration::reserve_band(guard.hwnd, width);
            apply_window_rect(&window, &rc)?;
            guard.current_width = width;
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, state, width);
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
fn open_url(url: String) -> Result<(), String> {
    opener::open(url).map_err(|e| e.to_string())
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
            let _ = APP_HANDLE.set(app.handle().clone());
            app.deep_link().register("rbacdesktop")?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            register_appbar,
            resize_appbar,
            unregister_appbar,
            open_url,
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
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {
            // Destroying the only window (resume-driven rebuild) requests an
            // app exit; keep the process alive while the rebuild is pending.
            #[cfg(target_os = "windows")]
            if let tauri::RunEvent::ExitRequested { api, .. } = _event {
                if REBUILDING.load(std::sync::atomic::Ordering::SeqCst) {
                    api.prevent_exit();
                }
            }
        })
}
