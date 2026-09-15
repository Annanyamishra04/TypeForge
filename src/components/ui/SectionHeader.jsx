export default function SectionHeader({ title, description, align = "left", className = "" }) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col gap-3 ${alignment} ${className}`}>
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-xl text-[15px] leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
    </div>
  );
}
