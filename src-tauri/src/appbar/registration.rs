use windows_sys::Win32::Foundation::{HWND, RECT};
use windows_sys::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
};
use windows_sys::Win32::UI::Shell::{
    SHAppBarMessage, APPBARDATA, ABE_RIGHT, ABM_ACTIVATE, ABM_NEW, ABM_QUERYPOS, ABM_REMOVE,
    ABM_SETPOS, ABM_WINDOWPOSCHANGED,
};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetSystemMetrics, MoveWindow, SM_CXSCREEN, SM_CYSCREEN, WM_USER,
};

pub const APPBAR_CALLBACK: u32 = WM_USER + 1;

/// Cast a stored usize handle back to the HWND pointer type.
#[inline]
fn as_hwnd(h: usize) -> HWND {
    h as HWND
}

/// Return the bounds of the monitor the window currently lives on (physical
/// pixels). This is DPI/multi-monitor safe, unlike `GetSystemMetrics(SM_CXSCREEN)`
/// which only reports the primary monitor in primary-DPI pixels. Falls back to
/// the primary-screen metrics if the monitor query fails.
fn monitor_rect(hwnd: usize) -> RECT {
    unsafe {
        let hmonitor = MonitorFromWindow(as_hwnd(hwnd), MONITOR_DEFAULTTONEAREST);
        let mut info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            rcMonitor: RECT { left: 0, top: 0, right: 0, bottom: 0 },
            rcWork: RECT { left: 0, top: 0, right: 0, bottom: 0 },
            dwFlags: 0,
        };
        if !hmonitor.is_null() && GetMonitorInfoW(hmonitor, &mut info) != 0 {
            info.rcMonitor
        } else {
            RECT {
                left: 0,
                top: 0,
                right: GetSystemMetrics(SM_CXSCREEN),
                bottom: GetSystemMetrics(SM_CYSCREEN),
            }
        }
    }
}

fn make_empty_data(hwnd: usize) -> APPBARDATA {
    APPBARDATA {
        cbSize: std::mem::size_of::<APPBARDATA>() as u32,
        hWnd: as_hwnd(hwnd),
        uCallbackMessage: APPBAR_CALLBACK,
        uEdge: ABE_RIGHT,
        rc: RECT {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        },
        lParam: 0,
    }
}

/// Register the window as an appbar with the shell. `ABM_NEW` is a no-op if it
/// is already registered, so this is safe to call repeatedly.
pub fn ensure_registered(hwnd: usize) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        SHAppBarMessage(ABM_NEW, &mut data);
    }
}

/// Reserve the work-area band with the shell and return the **deterministic**
/// target window rect: `width` px anchored to the shell-approved right edge.
///
/// Important: the returned rect is derived from the monitor + requested `width`,
/// NOT from the rect that `ABM_SETPOS` writes back. After resume-from-suspend
/// the shell sometimes returns a shrunken rect from `ABM_SETPOS`; trusting it
/// made the panel window only widen a sliver instead of the full panel width.
/// We keep the shell edges from `ABM_QUERYPOS` (so we respect the taskbar) but
/// force the width ourselves.
pub fn reserve_band(hwnd: usize, width: i32) -> RECT {
    unsafe {
        let mon = monitor_rect(hwnd);

        let mut data = make_empty_data(hwnd);
        data.rc = RECT {
            left: mon.right - width,
            top: mon.top,
            right: mon.right,
            bottom: mon.bottom,
        };

        // Ask the shell for the approved edges (it may pull `right` in for a
        // right-docked taskbar, or adjust top/bottom).
        SHAppBarMessage(ABM_QUERYPOS, &mut data);
        let right = data.rc.right;
        let top = data.rc.top;
        let bottom = data.rc.bottom;

        // Reserve the band on the shell-approved right edge.
        data.rc.left = right - width;
        SHAppBarMessage(ABM_SETPOS, &mut data);

        eprintln!(
            "[appbar] reserve width={width} mon=({},{},{},{}) approved right={right} top={top} bottom={bottom}",
            mon.left, mon.top, mon.right, mon.bottom
        );

        RECT {
            left: right - width,
            top,
            right,
            bottom,
        }
    }
}

/// Reserve the band and move the window with raw Win32. Only used from the
/// native subclass proc (no `WebviewWindow` available there); the Tauri commands
/// instead apply the rect via `set_size`/`set_position` so tao's internal window
/// state stays in sync (see `apply_window_rect` in lib.rs).
unsafe fn commit_position(hwnd: usize, width: i32) {
    let rc = reserve_band(hwnd, width);
    MoveWindow(
        as_hwnd(hwnd),
        rc.left,
        rc.top,
        rc.right - rc.left,
        rc.bottom - rc.top,
        1, // bRepaint = TRUE
    );
}

pub fn update_appbar_position(hwnd: usize, width: i32) {
    unsafe {
        commit_position(hwnd, width);
    }
}

/// Idempotent, self-healing re-registration used after events that can drop the
/// reserved work-area or reset display metrics (resume from suspend, display
/// change, DPI change). `ABM_NEW` is a no-op if the appbar is still registered
/// and re-registers it if the shell dropped it while suspended; then we re-query
/// and re-commit the position on the window's *current* monitor so the window
/// stops "sinking" off-screen and other windows respect the reserved space again.
///
/// Note: recovering the blank/unresponsive WebView2 after resume is handled on
/// the React side (wake detector → `window.location.reload()`), which also
/// re-runs `register_appbar` on mount for a clean re-registration. We deliberately
/// do NOT hide/show the window here — that recreated the visual host but raced
/// with the resize and left the panel window short.
pub fn reassert_appbar(hwnd: usize, width: i32) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        SHAppBarMessage(ABM_NEW, &mut data);

        commit_position(hwnd, width);
    }
}

pub fn unregister_appbar(hwnd: usize) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        data.uCallbackMessage = 0;
        SHAppBarMessage(ABM_REMOVE, &mut data);
    }
}

pub fn notify_activate(hwnd: usize, active: bool) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        data.lParam = if active { 1 } else { 0 };
        SHAppBarMessage(ABM_ACTIVATE, &mut data);
    }
}

pub fn notify_windowposchanged(hwnd: usize) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        SHAppBarMessage(ABM_WINDOWPOSCHANGED, &mut data);
    }
}
