import { Link } from "react-router-dom";

const VARIANTS = {
  primary:
    "bg-accent text-accent-contrast hover:bg-accent-strong border border-transparent tf-glow-accent",
  secondary:
    "bg-surface text-text-primary hover:bg-surface-hover border border-border-strong",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent",
};

const SIZES = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

/**
 * Shared button/link control. Renders a <Link> when `to` is provided,
 * otherwise a native <button>, so semantics stay correct either way.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  className = "",
  icon: Icon,
  iconPosition = "trailing",
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-md font-medium
    transition-colors duration-150 ease-out
    focus-visible:outline-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const content = (
    <>
      {Icon && iconPosition === "leading" && <Icon size={16} strokeWidth={2} />}
      {children}
      {Icon && iconPosition === "trailing" && <Icon size={16} strokeWidth={2} />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {content}
    </button>
  );
}
