import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, Sun, LogOut, ArrowRight } from "lucide-react";
import { ROUTES } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

/**
 * Global Cmd/Ctrl+K command palette. Every entry maps to a real route
 * or a real action (theme switch, logout) — nothing here is decorative.
 * Deliberately built without an external command-menu library to keep
 * the bundle small (see performance requirements in the design brief).
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const reduceMotion = useReducedMotion();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const commands = useMemo(() => {
    const themeOrder = Object.keys(themes);
    const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];

    const base = [
      { id: "start-test", label: "Start Test", group: "Navigate", action: () => navigate(ROUTES.test) },
      { id: "analytics", label: "Analytics", group: "Navigate", action: () => navigate(ROUTES.stats) },
      { id: "leaderboard", label: "Leaderboard", group: "Navigate", action: () => navigate(ROUTES.leaderboard) },
      { id: "coach", label: "AI Coach", group: "Navigate", action: () => navigate(ROUTES.coach) },
      { id: "settings", label: "Settings", group: "Navigate", action: () => navigate(ROUTES.settings) },
      {
        id: "switch-theme",
        label: `Switch Theme (${themes[nextTheme].label})`,
        group: "Preferences",
        icon: Sun,
        action: () => setTheme(nextTheme),
      },
    ];

    if (isAuthenticated) {
      base.splice(4, 0, { id: "profile", label: "Profile", group: "Navigate", action: () => navigate(ROUTES.profile) });
      base.push({ id: "logout", label: "Logout", group: "Account", icon: LogOut, action: () => logout() });
    } else {
      base.push({ id: "login", label: "Log in", group: "Account", action: () => navigate(ROUTES.login) });
    }

    return base;
  }, [isAuthenticated, navigate, logout, theme, themes, setTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Reset the highlighted row whenever the search narrows the list or
  // the palette re-opens, so the highlight never points past the end
  // of a shorter, filtered list.
  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const runCommand = useCallback(
    (command) => {
      command.action();
      close();
    },
    [close]
  );

  useEffect(() => {
    function onKeyDown(e) {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isModK) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIndex]) runCommand(filtered[activeIndex]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close, filtered, activeIndex, runCommand]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Focus after mount so the modal is in the DOM first.
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className="hidden items-center gap-2 rounded-md border border-border-strong bg-surface/60 px-3 py-1.5 text-xs text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary md:inline-flex"
      >
        <Search size={13} strokeWidth={2} />
        <span>Search</span>
        <kbd className="ml-2 rounded border border-border-strong bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Command menu"
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border-strong bg-bg-elevated shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search size={16} className="text-text-tertiary" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command…"
                  className="w-full bg-transparent text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  aria-label="Command search"
                />
                <kbd className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
                  ESC
                </kbd>
              </div>

              <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
                {filtered.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-text-tertiary">No matching commands.</li>
                )}
                {filtered.map((command, index) => {
                  const Icon = command.icon || ArrowRight;
                  const isActive = index === activeIndex;
                  return (
                    <li key={command.id} role="option" aria-selected={isActive}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => runCommand(command)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[15px] transition-colors ${
                          isActive ? "bg-surface-hover text-text-primary" : "text-text-secondary"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={15} strokeWidth={1.75} className="text-text-tertiary" />
                          {command.label}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wide text-text-tertiary">
                          {command.group}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
