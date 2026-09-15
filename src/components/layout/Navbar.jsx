import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../brand/Logo";
import Button from "../ui/Button";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import PageContainer from "./PageContainer";
import CommandPalette from "./CommandPalette";
import ProfileMenu from "./ProfileMenu";
import { NAV_LINKS, ROUTES } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";

// A short underline slides in under the active link rather than a
// filled pill — a subtler, more "instrument panel" active indicator.
const linkClasses = ({ isActive }) =>
  `relative py-1 text-sm font-medium transition-colors after:absolute after:-bottom-5 after:left-0 after:h-px after:w-full after:transition-opacity ${
    isActive
      ? "text-text-primary after:bg-accent after:opacity-100"
      : "text-text-secondary after:opacity-0 hover:text-text-primary"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { currentUser, isAuthenticated, loading, logout } = useAuth();

  // Close the mobile menu whenever the viewport grows back to desktop,
  // so it can't be left open-but-hidden behind a resize.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <PageContainer>
        <nav
          className="flex h-16 items-center justify-between"
          aria-label="Primary"
        >
          <Logo />

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClasses}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <CommandPalette />
            <ThemeSwitcher variant="compact" />

            {!loading && isAuthenticated && <ProfileMenu name={currentUser.name} onLogout={logout} />}

            {!loading && !isAuthenticated && (
              <>
                <Button to={ROUTES.login} variant="ghost" size="md">
                  Log in
                </Button>
                <Button to={ROUTES.register} variant="secondary" size="md">
                  Create account
                </Button>
              </>
            )}

            <Button to={ROUTES.test} variant="primary" size="md">
              Start typing
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-strong text-text-primary md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </PageContainer>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-border bg-bg md:hidden"
        >
          <PageContainer className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-3 text-[15px] font-medium ${
                    isActive
                      ? "bg-surface text-text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to={ROUTES.settings}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-md px-3 py-3 text-[15px] font-medium ${
                  isActive
                    ? "bg-surface text-text-primary"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`
              }
            >
              Settings
            </NavLink>
            {!loading && isAuthenticated && (
              <>
                <NavLink
                  to={ROUTES.profile}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-3 text-[15px] font-medium ${
                      isActive
                        ? "bg-surface text-text-primary"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    }`
                  }
                >
                  Profile ({currentUser.name})
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="rounded-md px-3 py-3 text-left text-[15px] font-medium text-text-secondary hover:bg-surface hover:text-text-primary"
                >
                  Log out
                </button>
              </>
            )}
            {!loading && !isAuthenticated && (
              <>
                <NavLink
                  to={ROUTES.login}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-3 text-[15px] font-medium ${
                      isActive
                        ? "bg-surface text-text-primary"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    }`
                  }
                >
                  Log in
                </NavLink>
                <NavLink
                  to={ROUTES.register}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-3 text-[15px] font-medium ${
                      isActive
                        ? "bg-surface text-text-primary"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    }`
                  }
                >
                  Create account
                </NavLink>
              </>
            )}
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-3">
              <span className="text-[15px] font-medium text-text-secondary">Theme</span>
              <ThemeSwitcher variant="compact" />
            </div>
            <Button to={ROUTES.test} variant="primary" size="lg" className="mt-3 w-full">
              Start typing
            </Button>
          </PageContainer>
        </div>
      )}
    </header>
  );
}
