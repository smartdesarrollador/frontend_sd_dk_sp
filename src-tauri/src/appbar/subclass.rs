use std::sync::atomic::{AtomicUsize, Ordering};

use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass};
use windows_sys::Win32::UI::Shell::ABN_POSCHANGED;
use windows_sys::Win32::UI::WindowsAndMessaging::{WM_ACTIVATE, WM_DESTROY, WM_WINDOWPOSCHANGED};

use super::registration::{
    notify_activate, notify_windowposchanged, update_appbar_position, APPBAR_CALLBACK,
};

const SUBCLASS_ID: usize = 1;

/// Global atomic storing the current appbar width so the subclass proc can
/// re-assert it when ABN_POSCHANGED is received.
static CURRENT_WIDTH: AtomicUsize = AtomicUsize::new(60);

pub fn set_current_width(width: i32) {
    CURRENT_WIDTH.store(width as usize, Ordering::Relaxed);
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
