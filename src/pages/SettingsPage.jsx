import { Palette, Keyboard, UserCog } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import ThemeSwitcher from "../components/ui/ThemeSwitcher";

function SettingsSection({ icon: Icon, title, children }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-10 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Icon size={15} strokeWidth={1.75} className="text-text-tertiary" />
        <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/**
 * A configuration console rather than a settings "page" of cards.
 * Only shows controls that are genuinely wired up — Appearance is the
 * one live section right now; the rest state plainly that they aren't
 * available yet instead of rendering toggles that don't do anything.
 */
export default function SettingsPage() {
  return (
    <PageContainer className="flex flex-col gap-10 py-14 sm:py-16">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">Settings</span>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Configuration</h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-text-secondary">
          Themes, test defaults, and account preferences.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        <SettingsSection icon={Palette} title="Appearance">
          <ThemeSwitcher variant="full" />
          <p className="text-xs text-text-tertiary">
            Your choice is saved on this device and applied automatically next time you visit.
          </p>
        </SettingsSection>

        <SettingsSection icon={Keyboard} title="Typing">
          <p className="max-w-md text-sm leading-relaxed text-text-tertiary">
            Default mode, duration, and punctuation/number toggles aren't saved as preferences
            yet — set them per test from the Test page for now.
          </p>
        </SettingsSection>

        <SettingsSection icon={UserCog} title="Account">
          <p className="max-w-md text-sm leading-relaxed text-text-tertiary">
            Profile and password management aren't wired up yet. Manage your saved results
            and streak from your Profile page.
          </p>
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
