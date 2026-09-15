import { ArrowUpRight } from "lucide-react";
import Logo from "../brand/Logo";
import PageContainer from "./PageContainer";
import { NAV_LINKS } from "../../config/constants";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <PageContainer className="flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
            A precision typing practice platform, built to measure real
            progress instead of guessing at it.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Navigate
          </span>
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <a
                  href={link.to}
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Connect
          </span>
          <div className="flex flex-col gap-2">
            <a
              href="https://github.com/Annanyamishra04"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              GitHub <ArrowUpRight size={13} />
            </a>
            <a
              href="https://www.linkedin.com/in/annanya-mishra-370405295/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              LinkedIn <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </PageContainer>

      <PageContainer className="flex flex-col gap-2 border-t border-border py-5 text-xs text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} TYPEFORGE. All rights reserved.</span>
        <span>Designed &amp; developed by Annanya Mishra</span>
      </PageContainer>
    </footer>
  );
}
