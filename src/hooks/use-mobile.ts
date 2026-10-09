import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

// Cached MediaQueryList — created lazily on the client, never on the server.
let mql: MediaQueryList | null = null;

function subscribe(callback: () => void) {
  const query = window.matchMedia(QUERY);
  mql = query;
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  const query = mql ?? (mql = window.matchMedia(QUERY));
  return query.matches;
}

// Server snapshot: desktop chrome (the sidebar renders inline in SSR and the
// client takes over after hydration — the useSyncExternalStore M-3 idiom,
// no effect-body setState).
function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
