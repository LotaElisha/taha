import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "../../components/ui/sonner";
import { EmptyState } from "../../components/feedback/EmptyState";
import { cn } from "../../lib/utils";

interface KycFlowProps {
  onDone: () => void;
}

type StepIdx = 0 | 1 | 2 | 3 | 4;
const STEPS = [
  "NIN",
  "Front of ID",
  "Back of ID",
  "Selfie",
  "Review",
] as const;

/**
 * KycFlow — 5-step in-app KYC. Per DESIGN_SPEC §9.2.3 / KYC mockup.
 * One question per screen, sticky CTA, progress bar.
 */
export function KycFlow({ onDone }: KycFlowProps) {
  const navigate = useNavigate();
  const { user, updateUserAuthData } = useAuth();

  const [step, setStep] = React.useState<StepIdx>(0);
  const [nin, setNin] = React.useState(user?.nin ?? "");
  const [idFront, setIdFront] = React.useState<File | null>(null);
  const [idBack, setIdBack] = React.useState<File | null>(null);
  const [selfie, setSelfie] = React.useState<File | null>(null);
  const [consent, setConsent] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  if (!user) {
    return (
      <EmptyState
        title="Sign in to verify your ID"
        body="You need an account before we can verify you."
        action={
          <Button variant="primary" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        }
      />
    );
  }

  if (user.kycStatus === "Verified") {
    return (
      <EmptyState
        title="You're verified"
        body="Your identity is on file. Financial services and payouts are unlocked."
        action={
          <Button variant="primary" onClick={onDone}>
            Done
          </Button>
        }
      />
    );
  }

  if (submitted || user.kycStatus === "Pending") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <ShieldCheckIcon />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-fg">
          We're verifying your ID
        </h1>
        <p className="mt-2 text-sm text-muted">
          Most reviews take less than 24 hours. We'll notify you on your phone.
        </p>
        <Button variant="primary" onClick={onDone} className="mt-6 w-full">
          Back to profile
        </Button>
      </div>
    );
  }

  const canAdvance =
    (step === 0 && nin.replace(/\D/g, "").length >= 10) ||
    (step === 1 && !!idFront) ||
    (step === 2 && !!idBack) ||
    (step === 3 && !!selfie) ||
    (step === 4 && consent);

  const onPrimary = () => {
    if (step < 4) {
      setStep(((step + 1) as StepIdx));
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      console.log("KYC submitted", {
        nin,
        idFront: idFront?.name,
        idBack: idBack?.name,
        selfie: selfie?.name,
      });
      updateUserAuthData({ kycStatus: "Pending", nin });
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("KYC submitted for review.");
    }, 1200);
  };

  const onBack = () => {
    if (step === 0) onDone();
    else setStep(((step - 1) as StepIdx));
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col px-4 py-4">
      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg"
        >
          <ArrowLeftIcon />
        </button>
        <h1 className="text-sm font-medium text-fg">KYC verification</h1>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          Step {step + 1} of 5
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full bg-brand-600 transition-all"
          style={{ width: `${((step + 1) / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1">
        {step === 0 && (
          <NinStep nin={nin} setNin={setNin} />
        )}
        {step === 1 && (
          <CaptureStep
            label="Front of ID"
            hint="Place your NIDA card inside the frame. All 4 corners must be visible."
            file={idFront}
            onChange={setIdFront}
          />
        )}
        {step === 2 && (
          <CaptureStep
            label="Back of ID"
            hint="Flip the card over and capture the back."
            file={idBack}
            onChange={setIdBack}
          />
        )}
        {step === 3 && (
          <CaptureStep
            label="Selfie"
            hint="Hold the phone at arm's length in good light. No hats, no sunglasses."
            file={selfie}
            onChange={setSelfie}
            isSelfie
          />
        )}
        {step === 4 && (
          <ReviewStep
            nin={nin}
            idFront={idFront}
            idBack={idBack}
            selfie={selfie}
            onEdit={(i) => setStep(i)}
            consent={consent}
            setConsent={setConsent}
          />
        )}
      </div>

      <div className="sticky bottom-0 mt-4 pb-[env(safe-area-inset-bottom)]">
        <Button
          size="lg"
          className="w-full"
          disabled={!canAdvance || isSubmitting}
          onClick={onPrimary}
        >
          {step < 4 ? (
            <>
              Continue <ArrowRightIcon />
            </>
          ) : isSubmitting ? (
            <>Submitting…</>
          ) : (
            <>
              <ShieldCheckIcon /> Submit for verification
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function NinStep({ nin, setNin }: { nin: string; setNin: (v: string) => void }) {
  const valid = nin.replace(/\D/g, "").length >= 10;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-fg">
        What's your National ID number?
      </h2>
      <p className="text-sm text-muted">
        Your NIN appears on the front of your NIDA card.
      </p>
      <div>
        <Label htmlFor="nin">NIN</Label>
        <Input
          id="nin"
          inputMode="numeric"
          className="mt-1 tabular"
          placeholder="19850601-12345-67890-12"
          value={nin}
          onChange={(e) => setNin(e.target.value)}
        />
        {nin.length > 0 ? (
          <p className={cn("mt-1 text-xs", valid ? "text-success" : "text-muted")}>
            {valid ? "Format looks correct" : "Keep typing — at least 10 digits."}
          </p>
        ) : null}
      </div>
      <div className="rounded-md bg-info/10 p-3">
        <p className="text-xs font-medium text-info">Why we need this</p>
        <p className="mt-0.5 text-xs leading-relaxed text-info/90">
          Required by Tanzanian law to verify your identity before financial
          transactions. Encrypted and never shared with vendors.
        </p>
      </div>
    </div>
  );
}

function CaptureStep({
  label,
  hint,
  file,
  onChange,
  isSelfie,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File) => void;
  isSelfie?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-fg">{label}</h2>
      <p className="text-sm text-muted">{hint}</p>

      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-md border border-dashed border-border bg-surface-2",
          preview && "border-solid border-brand-600"
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt={`${label} preview`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted">
            <CameraIcon />
            <p className="text-sm">Tap to capture or upload an image</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={isSelfie ? "user" : "environment"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={() => inputRef.current?.click()}
        >
          <CameraIcon />
          {file ? "Retake" : "Open camera"}
        </Button>
        {!file ? null : (
          <Button
            variant="outline"
            size="md"
            onClick={() => inputRef.current?.click()}
          >
            Use a different photo
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewStep({
  nin,
  idFront,
  idBack,
  selfie,
  onEdit,
  consent,
  setConsent,
}: {
  nin: string;
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;
  onEdit: (i: StepIdx) => void;
  consent: boolean;
  setConsent: (b: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-fg">Looks good?</h2>
      <p className="text-sm text-muted">
        Verification usually takes less than 24 hours. We'll notify you on the
        phone linked to your account.
      </p>

      <ReviewRow
        label="NIN"
        value={nin || "—"}
        onEdit={() => onEdit(0)}
      />
      <ReviewRow
        label="ID — Front"
        value={idFront ? `${(idFront.size / 1024).toFixed(0)} KB · ${idFront.name}` : "Not provided"}
        onEdit={() => onEdit(1)}
      />
      <ReviewRow
        label="ID — Back"
        value={idBack ? `${(idBack.size / 1024).toFixed(0)} KB · ${idBack.name}` : "Not provided"}
        onEdit={() => onEdit(2)}
      />
      <ReviewRow
        label="Selfie"
        value={selfie ? `${(selfie.size / 1024).toFixed(0)} KB · ${selfie.name}` : "Not provided"}
        onEdit={() => onEdit(3)}
      />

      <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-md border border-border bg-surface p-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand-600"
        />
        <span className="text-xs leading-relaxed text-muted">
          I confirm these documents are mine, accurate, and Mkulima may share
          them with NIDA for verification.
        </span>
      </label>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-fg">{value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-medium text-brand-600"
      >
        Edit
      </button>
    </div>
  );
}

/* --------------------------------- icons --------------------------------- */
function ArrowLeftIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M12 19l-7-7 7-7" /></svg>); }
function ArrowRightIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7" /></svg>); }
function CameraIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="4" /></svg>); }
function ShieldCheckIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>); }
