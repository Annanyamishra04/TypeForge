import { Link } from "react-router-dom";
import { ROUTES, PRODUCT_NAME } from "../../config/constants";

/**
 * TYPEFORGE brand mark.
 *
 * Built entirely from UI/code elements: a terminal-style prompt
 * bracket paired with a blinking cursor, echoing the product itself
 * (typed input, monospace grid, an active cursor). No image assets.
 */
export default function Logo({ className = "", showWordmark = true }) {
  return (
    <Link
      to={ROUTES.home}
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label={`${PRODUCT_NAME} home`}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border-strong bg-surface font-mono text-[15px] font-semibold text-accent transition-colors group-hover:border-accent/60"
        aria-hidden="true"
      >
        <span>&gt;</span>
        <span className="ml-px inline-block h-[13px] w-[2.5px] animate-blink bg-accent" />
      </span>
      {showWordmark && (
        <span className="font-mono text-[15px] font-semibold tracking-tight text-text-primary">
          TYPE<span className="text-accent">FORGE</span>
        </span>
      )}
    </Link>
  );
}
