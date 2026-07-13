import { useEffect } from "react";

/**
 * Detects resume-from-suspend and reloads the WebView.
 *
 * After the laptop sleeps and wakes, WebView2 loses its render surface: the
 * sidebar comes back blank/frozen and the AppBar geometry is stale. Nudging the
 * native window (hide/show/resize) proved unreliable, so instead we detect the
 * wake and do a clean reload — this re-renders the DOM (fixes the blank) and
 * re-runs `register_appbar` on mount (fresh AppBar position/width). Auth survives
 * because `authStore` rehydrates from localStorage.
 *
 * Detection: a timer that should tick every `POLL_MS` freezes while the machine
 * is suspended, so a gap larger than `GAP_THRESHOLD_MS` between ticks means we
 * just woke up.
 *
 * Important: right after resume the network stack is still coming back, so an
 * immediate reload fails to fetch assets (`ERR_NETWORK_CHANGED`) — very visible
 * in `tauri dev` where the frontend is served by the Vite dev server, but also a
 * risk for any post-wake network. So we wait until the current origin actually
 * responds before reloading.
 */
const POLL_MS = 2000;
const GAP_THRESHOLD_MS = 5000;
const READY_RETRY_MS = 700;
const READY_MAX_PROBES = 40; // ~28s worst case
// The network flaps several times right after resume (a single successful probe
// then ERR_NETWORK_CHANGED on the very next requests was observed), so require
// this many consecutive successes before trusting it.
const READY_STABLE_COUNT = 3;

let reloading = false;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function probeOrigin(): Promise<boolean> {
  try {
    // Cache-busting HEAD to our own origin. Succeeds once the dev server
    // (dev) or embedded protocol (prod) is reachable again after resume.
    await fetch(`${window.location.href}?wake=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  }
}

async function reloadWhenReady(): Promise<void> {
  if (reloading) return;
  reloading = true;

  let consecutive = 0;
  for (let i = 0; i < READY_MAX_PROBES; i++) {
    consecutive = (await probeOrigin()) ? consecutive + 1 : 0;
    if (consecutive >= READY_STABLE_COUNT) {
      console.log(`[wake] red estable (${consecutive} probes) → recargando`);
      window.location.reload();
      return;
    }
    await sleep(READY_RETRY_MS);
  }

  // Network never confirmed stable — reload anyway; the index.html boot-retry
  // script will keep retrying if the app fails to mount.
  console.log("[wake] red no confirmada → recargando igual");
  window.location.reload();
}

export function useWakeReload(): void {
  useEffect(() => {
    let last = Date.now();
    console.log("[wake] detector armado");

    const id = window.setInterval(() => {
      const now = Date.now();
      const gap = now - last;
      last = now;

      if (gap > GAP_THRESHOLD_MS) {
        console.log(`[wake] gap ${gap}ms → esperando red`);
        void reloadWhenReady();
      }
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, []);
}
