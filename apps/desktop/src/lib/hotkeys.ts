import { useEffect, useRef } from "react";

// True when a key press belongs to something else: a text field, or an open
// dialog/menu (they handle their own keys).
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("input, textarea, select, [contenteditable=true]")) return true;
  return !!document.querySelector("[role=dialog][data-open], [role=alertdialog][data-open], [role=menu]");
}

type Options = { enabled?: boolean; meta?: boolean };

// Single-key shortcuts like "c", or "mod+\" with { meta: true }.
export function useHotkey(key: string, handler: (e: KeyboardEvent) => void, { enabled = true, meta = false }: Options = {}) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (meta !== mod || e.altKey) return;
      if (e.key.toLowerCase() !== key) return;
      if (!meta && isTypingTarget(e.target)) return;
      e.preventDefault();
      ref.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, enabled, meta]);
}

// Two-key "go to" sequences, Linear style: press g, then a letter.
export function useGoToShortcuts(routes: Record<string, string>, navigate: (to: string) => void) {
  const routesRef = useRef(routes);
  useEffect(() => {
    routesRef.current = routes;
  });

  useEffect(() => {
    let armed = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "g") {
        armed = Date.now();
        return;
      }
      if (armed && Date.now() - armed < 1200 && routesRef.current[key]) {
        e.preventDefault();
        navigate(routesRef.current[key]);
      }
      armed = 0;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}
