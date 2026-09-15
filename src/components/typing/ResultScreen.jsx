import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw, SlidersHorizontal, BarChart2, Loader2, Check, CloudOff, Share2, Award, AlertTriangle } from "lucide-react";
import Button from "../ui/Button";
import { ROUTES, certificatePath } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";
import { generateCertificate } from "../../services/api";

/**
 * Small, honest persistence status line. Never claims "saved" unless
 * the backend actually confirmed it, and never blocks or clutters the
 * rest of the result screen — the test result itself is always shown
 * regardless of sync outcome.
 */
function SaveStatus({ saveStatus, saveError }) {
  if (saveStatus === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-tertiary">
        <Loader2 size={12} className="animate-spin" /> Saving result…
      </span>
    );
  }
  if (saveStatus === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-accent">
        <Check size={12} /> Result saved
      </span>
    );
  }
  if (saveStatus === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-tertiary">
        <CloudOff size={12} /> {saveError || "Could not sync — result remains available locally."}
      </span>
    );
  }
  return null;
}

/** A single labeled 0-100 measurement rail — the shared visual for the "performance profile" block. */
function ProfileBar({ label, value, hint, delay }) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-text-secondary">{label}</span>
        <span className="font-mono text-xs tabular-nums text-text-tertiary">{hint}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={reduceMotion ? { width: `${clamped}%` } : { width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: reduceMotion ? 0 : delay }}
        />
      </div>
    </div>
  );
}

/**
 * A real (not fake) share action: uses the Web Share API where the
 * browser supports it, and falls back to copying a plain-text summary
 * to the clipboard. Never claims a share happened if both paths fail.
 */
function ShareButton({ metrics }) {
  const [state, setState] = useState("idle"); // idle | copied | unsupported

  async function handleShare() {
    const text = `TYPEFORGE — ${metrics.wpm} WPM at ${metrics.accuracy}% accuracy (${metrics.durationSeconds}s test).`;

    if (navigator.share) {
      try {
        await navigator.share({ text, title: "TYPEFORGE result" });
        return;
      } catch {
        // User cancelled the native share sheet, or it failed — fall
        // through to the clipboard path rather than treating it as an
        // error worth surfacing.
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
        return;
      } catch {
        setState("unsupported");
      }
    } else {
      setState("unsupported");
    }
  }

  return (
    <Button variant="ghost" size="md" icon={Share2} iconPosition="leading" onClick={handleShare}>
      {state === "copied" ? "Copied to clipboard" : state === "unsupported" ? "Sharing unavailable" : "Share result"}
    </Button>
  );
}

/**
 * "Generate certificate" / "View certificate" action.
 *
 * Only appears once there is a real, persisted result to certify
 * (`resultId` — the saved TypingResult's own database id, never
 * fabricated client-side) and the person is authenticated, since an
 * anonymous result has no account to attach a certificate to.
 * Certificate generation happens exactly once per click; after it
 * succeeds the button becomes "View certificate" instead of allowing
 * repeated generation — the backend would return the same certificate
 * either way (see server/services/certificateService.js), but there's
 * no reason to invite the extra round trip.
 */
function CertificateAction({ resultId }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState("idle"); // idle | generating | ready | error
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);

  if (!isAuthenticated || !resultId) return null;

  async function handleGenerate() {
    setState("generating");
    setError(null);
    try {
      const data = await generateCertificate(resultId);
      setCertificate(data.certificate);
      setState("ready");
    } catch (err) {
      setError(err?.message || "Could not generate a certificate right now.");
      setState("error");
    }
  }

  if (state === "ready" && certificate) {
    return (
      <Button
        to={certificatePath(certificate.certificateId)}
        variant="secondary"
        icon={Award}
        iconPosition="leading"
      >
        View certificate
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={handleGenerate}
        variant="secondary"
        icon={Award}
        iconPosition="leading"
        disabled={state === "generating"}
        className={state === "generating" ? "opacity-70" : ""}
      >
        {state === "generating" ? "Generating certificate…" : "Generate certificate"}
      </Button>
      {state === "error" && (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-tertiary">
          <AlertTriangle size={12} /> {error}
        </span>
      )}
    </div>
  );
}

/**
 * The post-test performance report. Displays only values measured
 * from the test that just finished — no rankings, streaks, or
 * historical/global data belongs here (that's Analytics/Leaderboard).
 */
export default function ResultScreen({
  metrics,
  finishedAt,
  onRestart,
  onChangeDuration,
  saveStatus,
  saveError,
  resultId,
}) {
  const reduceMotion = useReducedMotion();
  if (!metrics) return null;

  const { wpm, accuracy, errors, correctChars, totalChars, durationSeconds, consistency = 100 } = metrics;

  // Speed is normalized against a generous ceiling purely for the bar
  // fill — the number shown alongside it is always the real WPM.
  const speedScore = Math.max(0, Math.min(100, Math.round((wpm / 140) * 100)));

  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut", delay: reduceMotion ? 0 : delay },
  });

  return (
    <div className="flex flex-col gap-10 rounded-lg border border-border bg-surface p-6 sm:p-10">
      <motion.div {...fadeUp(0)} className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
          Result / {durationSeconds} sec
        </span>
        {finishedAt && (
          <span className="font-mono text-[11px] text-text-tertiary">
            {finishedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
        <SaveStatus saveStatus={saveStatus} saveError={saveError} />
      </motion.div>

      <motion.div {...fadeUp(0.05)} className="flex flex-wrap items-end gap-x-14 gap-y-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-6xl font-semibold tabular-nums leading-none text-text-primary sm:text-7xl">
            {wpm}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">WPM</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-4xl font-semibold tabular-nums leading-none text-text-primary sm:text-5xl">
            {accuracy}%
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">Precision</span>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="flex flex-col gap-5 border-t border-border pt-8">
        <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          Performance profile
        </h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <ProfileBar label="Speed" value={speedScore} hint={`${wpm} wpm`} delay={0.15} />
          <ProfileBar label="Precision" value={accuracy} hint={`${accuracy}%`} delay={0.2} />
          <ProfileBar label="Consistency" value={consistency} hint={`${consistency}/100`} delay={0.25} />
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.15)} className="grid grid-cols-3 gap-4 border-t border-border pt-8 sm:w-fit sm:grid-cols-3">
        <RawStat label="Errors" value={errors} />
        <RawStat label="Correct chars" value={correctChars} />
        <RawStat label="Total chars" value={totalChars} />
      </motion.div>

      <motion.div {...fadeUp(0.2)} className="flex flex-wrap gap-3 border-t border-border pt-8">
        <Button onClick={onRestart} icon={RotateCcw} iconPosition="leading">
          Try again
        </Button>
        <Button
          onClick={onChangeDuration}
          variant="secondary"
          icon={SlidersHorizontal}
          iconPosition="leading"
        >
          Change duration
        </Button>
        <Button to={ROUTES.stats} variant="secondary" icon={BarChart2} iconPosition="leading">
          View full analytics
        </Button>
        <ShareButton metrics={metrics} />
        <CertificateAction resultId={resultId} />
      </motion.div>
    </div>
  );
}

function RawStat({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-lg font-semibold tabular-nums text-text-primary">{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-tertiary">{label}</span>
    </div>
  );
}
