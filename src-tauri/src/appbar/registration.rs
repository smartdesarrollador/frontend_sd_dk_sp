use windows_sys::Win32::Foundation::{HWND, RECT};
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

pub fn register_appbar(hwnd: usize, width: i32) {
    unsafe {
        let screen_width = GetSystemMetrics(SM_CXSCREEN);
        let screen_height = GetSystemMetrics(SM_CYSCREEN);

        let mut data = make_empty_data(hwnd);

        // Step 1: Register the appbar with the shell
        SHAppBarMessage(ABM_NEW, &mut data);

        // Step 2: Set desired position rect
        data.rc = RECT {
            left: screen_width - width,
            top: 0,
            right: screen_width,
            bottom: screen_height,
        };

        // Step 3: Query — shell may adjust the rect
        SHAppBarMessage(ABM_QUERYPOS, &mut data);

        // Step 4: Recalculate left edge based on shell-adjusted right
        data.rc.left = data.rc.right - width;

        // Step 5: Commit position
        SHAppBarMessage(ABM_SETPOS, &mut data);

        // Step 6: Move the window to match the registered position
        MoveWindow(
            as_hwnd(hwnd),
            data.rc.left,
            data.rc.top,
            data.rc.right - data.rc.left,
            data.rc.bottom - data.rc.top,
            1, // bRepaint = TRUE
        );
    }
}

pub fn update_appbar_position(hwnd: usize, width: i32) {
    unsafe {
        let screen_width = GetSystemMetrics(SM_CXSCREEN);
        let screen_height = GetSystemMetrics(SM_CYSCREEN);

        let mut data = APPBARDATA {
            cbSize: std::mem::size_of::<APPBARDATA>() as u32,
            hWnd: as_hwnd(hwnd),
            uCallbackMessage: APPBAR_CALLBACK,
            uEdge: ABE_RIGHT,
            rc: RECT {
                left: screen_width - width,
                top: 0,
                right: screen_width,
                bottom: screen_height,
            },
            lParam: 0,
        };

        SHAppBarMessage(ABM_QUERYPOS, &mut data);
        data.rc.left = data.rc.right - width;
        SHAppBarMessage(ABM_SETPOS, &mut data);

        MoveWindow(
            as_hwnd(hwnd),
            data.rc.left,
            data.rc.top,
            data.rc.right - data.rc.left,
            data.rc.bottom - data.rc.top,
            1,
        );
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
