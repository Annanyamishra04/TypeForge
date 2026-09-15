import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Printer, Link2, Check, ShieldAlert, RefreshCw } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import CertificateDocument from "../components/certificates/CertificateDocument";
import { getCertificate, ApiError } from "../services/api";

function CertificateSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-10 w-full max-w-2xl rounded bg-surface" />
      <div className="h-[420px] w-full rounded-lg border border-border bg-surface/40" />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-secondary">
        <ShieldAlert size={20} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">Certificate not found</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          This certificate ID doesn't match any issued TYPEFORGE certificate. Double-check the link and try again.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-16 text-center sm:py-20">
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-lg font-semibold text-text-primary">Could not load this certificate</h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {message || "Something went wrong reaching the server."}
        </p>
      </div>
      <Button variant="secondary" size="md" icon={RefreshCw} iconPosition="leading" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/**
 * Public route: /certificate/:certificateId — viewable without login,
 * per the Phase 10 spec. Every value on the certificate comes from
 * GET /api/certificates/:certificateId (public, certificate-safe
 * fields only); nothing here is computed or invented on the client.
 */
export default function CertificatePage() {
  const { certificateId } = useParams();
  const [state, setState] = useState("loading"); // loading | ready | notfound | error
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);

  const [pdfStatus, setPdfStatus] = useState("idle"); // idle | generating | error
  const [copyStatus, setCopyStatus] = useState("idle"); // idle | copied | error

  const certRef = useRef(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await getCertificate(certificateId);
      setCertificate(data.certificate);
      setState("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setState("notfound");
      } else {
        setError(err?.message || "Could not load this certificate.");
        setState("error");
      }
    }
  }, [certificateId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownloadPdf() {
    if (!certRef.current || pdfStatus === "generating") return;
    setPdfStatus("generating");
    try {
      // Loaded on demand — most visits to this page will print or
      // just look at the certificate, so the ~200kb of PDF-rendering
      // code is only fetched when someone actually clicks Download.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        backgroundColor: "#F7F5F1",
        useCORS: true,
      });

      const orientation = canvas.width >= canvas.height ? "l" : "p";
      const pdf = new jsPDF({ orientation, unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL("image/png", 1.0), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`typeforge-certificate-${certificate.certificateId}.pdf`);
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/certificate/${certificateId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  }

  return (
    <PageContainer className="flex flex-col gap-8 py-14 sm:py-16">
      <div className="tf-no-print flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">Certificate / Verification</span>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Performance certificate</h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-text-secondary">
          A real, verified TYPEFORGE test result — this page confirms it independently of who's viewing it.
        </p>
      </div>

      {state === "loading" && <CertificateSkeleton />}
      {state === "notfound" && <NotFoundState />}
      {state === "error" && <ErrorState message={error} onRetry={load} />}

      {state === "ready" && certificate && (
        <>
          <div className="tf-no-print flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDownloadPdf}
              icon={Download}
              iconPosition="leading"
              disabled={pdfStatus === "generating"}
              className={pdfStatus === "generating" ? "opacity-70" : ""}
            >
              {pdfStatus === "generating" ? "Preparing PDF…" : "Download PDF"}
            </Button>
            <Button variant="secondary" icon={Printer} iconPosition="leading" onClick={handlePrint}>
              Print
            </Button>
            <Button
              variant="secondary"
              icon={copyStatus === "copied" ? Check : Link2}
              iconPosition="leading"
              onClick={handleCopyLink}
            >
              {copyStatus === "copied" ? "Link copied" : "Copy verification link"}
            </Button>
            {pdfStatus === "error" && (
              <span className="font-mono text-xs text-text-tertiary">
                Could not generate the PDF — try Print instead and save as PDF from there.
              </span>
            )}
            {copyStatus === "error" && (
              <span className="font-mono text-xs text-text-tertiary">Could not copy — copy the page URL manually.</span>
            )}
          </div>

          <CertificateDocument ref={certRef} certificate={certificate} />
        </>
      )}
    </PageContainer>
  );
}
