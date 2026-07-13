use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::OnceLock;
use std::time::Instant;

use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass};
use windows_sys::Win32::UI::Shell::ABN_POSCHANGED;
use windows_sys::Win32::UI::WindowsAndMessaging::{
    PostMessageW, WM_ACTIVATE, WM_DESTROY, WM_DISPLAYCHANGE, WM_DPICHANGED, WM_POWERBROADCAST,
    WM_SETTINGCHANGE, WM_USER, WM_WINDOWPOSCHANGED,
};

use super::registration::{
    notify_activate, notify_windowposchanged, reassert_appbar, update_appbar_position,
    APPBAR_CALLBACK,
};

const SUBCLASS_ID: usize = 1;

/// Private message used to run a reassert *outside* broadcast delivery.
/// `WM_SETTINGCHANGE`/`WM_DISPLAYCHANGE` are broadcasts delivered synchronously
/// (explorer may be blocked waiting on our handler); calling `SHAppBarMessage`
/// from inside that context sends a message *back* to explorer → potential
/// cross-deadlock/timeout that intermittently froze the UI thread for seconds
/// and swallowed IPC commands. So the broadcast handler only posts this message
/// and returns immediately; the actual reassert runs when the queue drains.
const REASSERT_MSG: u32 = WM_USER + 2;

/// Global atomic storing the current appbar width so the subclass proc can
/// re-assert it when ABN_POSCHANGED is received.
static CURRENT_WIDTH: AtomicUsize = AtomicUsize::new(60);

pub fn set_current_width(width: i32) {
    CURRENT_WIDTH.store(width as usize, Ordering::Relaxed);
}

/// Rate limiter for reasserts triggered by broadcast messages.
///
/// Our own `ABM_SETPOS` changes the work area, which makes Windows broadcast
/// `WM_SETTINGCHANGE` back at us; replying to every one with another SETPOS
/// created an infinite feedback loop that saturated the UI thread (observed as
/// an endless `reserve width=60` storm — IPC commands like `resize_appbar`
/// never got to run, so the panel stayed a sliver). Reasserting at most once
/// per interval lets the first post-resume message do its job and starves the
/// loop of its echo.
static CLOCK: OnceLock<Instant> = OnceLock::new();
static LAST_REASSERT_MS: AtomicU64 = AtomicU64::new(0);
const REASSERT_MIN_INTERVAL_MS: u64 = 1000;

fn now_ms() -> u64 {
    CLOCK.get_or_init(Instant::now).elapsed().as_millis() as u64
}

fn should_reassert() -> bool {
    let now = now_ms();
    let last = LAST_REASSERT_MS.load(Ordering::Relaxed);
    if last != 0 && now.saturating_sub(last) < REASSERT_MIN_INTERVAL_MS {
        return false;
    }
    LAST_REASSERT_MS.store(now.max(1), Ordering::Relaxed);
    true
}

unsafe extern "system" fn appbar_subclass_proc(
    hwnd: HWND,
    umsg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _uid_subclass: usize,
    _dw_ref_data: usize,
) -> LRESULT {
    // Represent the HWND as usize for passing to our helper functions
    let hwnd_usize = hwnd as usize;

    match umsg {
        WM_ACTIVATE => {
            // low-word of wparam: 0 = deactivated, 1/2 = activated
            let active = (wparam & 0xffff) != 0;
            notify_activate(hwnd_usize, active);
        }
        WM_WINDOWPOSCHANGED => {
            notify_windowposchanged(hwnd_usize);
        }
        // Events that can drop the reserved work-area or reset display metrics —
        // none of these deliver ABN_POSCHANGED, so we re-register + reposition
        // the appbar to survive resume-from-suspend, resolution/monitor changes
        // and DPI/scaling changes. (The blank-WebView recovery after resume is
        // handled on the React side via a wake detector + reload.)
        //
        // Rate-limited: our own SETPOS re-triggers WM_SETTINGCHANGE, and
        // reasserting on every echo looped forever and starved the UI thread.
        // Deferred via PostMessage: never call SHAppBarMessage from inside a
        // broadcast (see REASSERT_MSG).
        WM_DISPLAYCHANGE | WM_SETTINGCHANGE | WM_DPICHANGED => {
            if should_reassert() {
                PostMessageW(hwnd, REASSERT_MSG, 0, 0);
            }
        }
        // Resume from suspend: recreate the whole webview window (lib.rs).
        // After resume the WebView2 IPC channel sometimes dies silently —
        // invoke() never reaches Rust — so no JS-side recovery is possible;
        // only the native side can rebuild. Values are the stable PBT_* ABI
        // (Win32_System_Power feature not enabled for just two constants).
        WM_POWERBROADCAST => {
            const PBT_APMRESUMESUSPEND: WPARAM = 0x0007;
            const PBT_APMRESUMEAUTOMATIC: WPARAM = 0x0012;
            if wparam == PBT_APMRESUMESUSPEND || wparam == PBT_APMRESUMEAUTOMATIC {
                crate::recreate_window_on_resume();
            }
            if should_reassert() {
                PostMessageW(hwnd, REASSERT_MSG, 0, 0);
            }
        }
        msg if msg == REASSERT_MSG => {
            let width = CURRENT_WIDTH.load(Ordering::Relaxed) as i32;
            eprintln!("[appbar] deferred reassert width={width}");
            reassert_appbar(hwnd_usize, width);
        }
        msg if msg == APPBAR_CALLBACK => {
            if wparam as u32 == ABN_POSCHANGED {
                let width = CURRENT_WIDTH.load(Ordering::Relaxed) as i32;
                update_appbar_position(hwnd_usize, width);
            }
        }
        WM_DESTROY => {
            RemoveWindowSubclass(hwnd, Some(appbar_subclass_proc), SUBCLASS_ID);
        }
        _ => {}
    }
    DefSubclassProc(hwnd, umsg, wparam, lparam)
}

pub fn install_subclass(hwnd: usize) {
    unsafe {
        SetWindowSubclass(hwnd as HWND, Some(appbar_subclass_proc), SUBCLASS_ID, 0);
    }
}
