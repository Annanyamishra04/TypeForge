/**
 * Centered card shell shared by the login and register pages, so
 * both present as one consistent "premium TYPEFORGE" auth surface.
 */
export default function AuthCard({ title, description, children, footer }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-14 sm:py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface/40 p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
          {description && (
            <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
          )}
        </div>

        <div className="mt-8">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-text-secondary">{footer}</div>}
      </div>
    </div>
  );
}
