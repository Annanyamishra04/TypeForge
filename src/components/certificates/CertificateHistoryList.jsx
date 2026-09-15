import { Link } from "react-router-dom";
import { Award } from "lucide-react";
import { certificatePath } from "../../config/constants";

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "";
  }
}

/**
 * Real certificate history only — every entry comes straight from
 * GET /api/certificates/me. Row-list pattern (not a card grid),
 * matching AchievementsGrid elsewhere on this page.
 */
export default function CertificateHistoryList({ certificates }) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
      {certificates.map((cert) => (
        <Link
          key={cert.certificateId}
          to={certificatePath(cert.certificateId)}
          className="group flex items-center gap-4 px-4 py-4 transition-colors duration-150 hover:bg-surface-hover sm:px-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
            <Award size={17} strokeWidth={1.75} />
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate font-mono text-sm font-semibold text-text-primary">
                {cert.wpm} wpm · {cert.accuracy}% accuracy
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-text-tertiary">
                {formatDate(cert.issuedAt)}
              </span>
            </div>
            <span className="truncate font-mono text-xs text-text-tertiary">{cert.certificateId}</span>
          </div>

          <span className="shrink-0 font-mono text-xs text-text-secondary opacity-0 transition-opacity group-hover:opacity-100">
            View →
          </span>
        </Link>
      ))}
    </div>
  );
}
