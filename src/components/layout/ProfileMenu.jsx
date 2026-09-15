import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { UserCircle, Settings, LogOut, ChevronDown } from "lucide-react";
import { ROUTES } from "../../config/constants";

/**
 * Consolidates Profile / Settings / Log out into one compact trigger
 * instead of three separate nav buttons — same routes and the same
 * `logout()` action from AuthContext, just less visual clutter.
 */
export default function ProfileMenu({ name, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <UserCircle size={17} strokeWidth={1.75} />
        <span className="max-w-[9rem] truncate">{name}</span>
        <ChevronDown size={13} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border-strong bg-bg-elevated py-1 shadow-xl"
        >
          <NavLink
            to={ROUTES.profile}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <UserCircle size={15} strokeWidth={1.75} /> Profile
          </NavLink>
          <NavLink
            to={ROUTES.settings}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <Settings size={15} strokeWidth={1.75} /> Settings
          </NavLink>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <LogOut size={15} strokeWidth={1.75} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
