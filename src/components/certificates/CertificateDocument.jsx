import { forwardRef } from "react";
import { ShieldCheck } from "lucide-react";
import { MODE_OPTIONS } from "../../config/typingModes";

function modeLabel(mode) {
  return MODE_OPTIONS.find((m) => m.value === mode)?.label || mode;
}

function formatIssuedDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-1 text-center">
      <span className="font-mono text-2xl font-semibold tabular-nums text-[#1E1C19] sm:text-[2rem]">{value}</span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-[#8C857A] sm:text-[10px]">{label}</span>
    </div>
  );
}

/**
 * The certificate artifact itself — the only thing that ends up in the
 * exported PDF / printed page. Intentionally uses a fixed, hardcoded
 * light palette (lifted from TYPEFORGE's own Paper theme values)
 * rather than the `--tf-*` theme tokens: a certificate is a print
 * artifact first, so it must stay legible and premium on paper and in
 * a PDF regardless of whether the person was viewing it in Midnight,
 * Emerald, or Paper at the time.
 *
 * Every value rendered here comes directly from the `certificate` prop
 * — the safe, backend-verified shape returned by GET
 * /api/certificates/:certificateId (see certificateService.toPublicCertificate
 * on the server). Nothing is computed or guessed client-side.
 */
const CertificateDocument = forwardRef(function CertificateDocument({ certificate }, ref) {
  const { certificateId, name, wpm, accuracy, errors, durationSeconds, mode, issuedAt } = certificate;

  return (
    <div
      ref={ref}
      className="tf-certificate-print-area mx-auto w-full max-w-[880px] bg-[#F7F5F1] p-1.5"
      style={{ border: "1px solid #CDC8BD" }}
    >
      <div className="relative border border-[#CDC8BD] px-6 py-10 sm:px-14 sm:py-14">
        {/* Corner ticks — a restrained technical motif, not decoration for its own sake. */}
        {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map(
          (pos) => (
            <span
              key={pos}
              aria-hidden="true"
              className={`absolute h-3 w-3 ${pos}`}
              style={{ borderColor: "#C46C2E", borderStyle: "solid", margin: "6px" }}
            />
          )
        )}

        <div className="flex items-center justify-between gap-4 border-b pb-6" style={{ borderColor: "#E1DDD5" }}>
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-sm font-mono text-sm font-semibold"
              style={{ border: "1px solid rgba(30,28,25,0.25)", color: "#C46C2E" }}
              aria-hidden="true"
            >
              &gt;
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight text-[#1E1C19]">
              TYPE<span style={{ color: "#C46C2E" }}>FORGE</span>
            </span>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[#5E5850] sm:inline">
            Precision typing environment
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#5E5850]">
            Certificate of performance
          </span>
          <p className="text-sm text-[#5E5850]">This certifies that</p>
          <h1 className="text-balance px-2 text-3xl font-semibold leading-tight tracking-tight text-[#1E1C19] sm:text-[2.75rem]">
            {name}
          </h1>
          <p className="max-w-md text-[13px] leading-relaxed text-[#5E5850]">
            completed a verified TYPEFORGE typing performance, measured to the keystroke.
          </p>
        </div>

        <div
          className="grid grid-cols-3 gap-y-6 border-y py-8 sm:grid-cols-5"
          style={{ borderColor: "#E1DDD5" }}
        >
          <Stat label="WPM" value={wpm} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Errors" value={errors} />
          <Stat label="Duration" value={`${durationSeconds}s`} />
          <Stat label="Mode" value={modeLabel(mode)} />
        </div>

        <div className="flex flex-col gap-6 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#8C857A]">Certificate ID</span>
            <span className="font-mono text-sm font-semibold text-[#1E1C19]">{certificateId}</span>
          </div>
          <div className="flex flex-col gap-1 sm:text-right">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#8C857A]">Issued</span>
            <span className="font-mono text-sm text-[#1E1C19]">{formatIssuedDate(issuedAt)}</span>
          </div>
          <div
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ border: "1px solid rgba(58,133,96,0.4)", backgroundColor: "rgba(58,133,96,0.1)" }}
          >
            <ShieldCheck size={13} style={{ color: "#3A8560" }} aria-hidden="true" />
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#3A8560" }}>
              Verified certificate
            </span>
          </div>
        </div>

        <div className="mt-10 border-t pt-4 text-center" style={{ borderColor: "#E1DDD5" }}>
          <span className="font-mono text-[9px] text-[#8C857A]">Designed &amp; developed by Annanya Mishra</span>
        </div>
      </div>
    </div>
  );
});

export default CertificateDocument;
