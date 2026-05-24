import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/ui/sonner";
import { requestOtp, requestVoiceOtp } from "../../services/mockOtp";
import { UserRole } from "../../types";
import { cn } from "../../lib/utils";

type Step = "phone" | "otp" | "role";
type Region = "TZ" | "KE";

const DIAL: Record<Region, { code: string; flag: string; label: string }> = {
  TZ: { code: "+255", flag: "🇹🇿", label: "Tanzania" },
  KE: { code: "+254", flag: "🇰🇪", label: "Kenya" },
};

const ROLES: { value: UserRole; title: string; body: string; emoji: string; color: string }[] = [
  { value: "Farmer",           title: "Farmer",            body: "I grow crops and need quality inputs",   emoji: "🌾", color: "from-green-500/20 to-emerald-600/20 border-green-500/40"  },
  { value: "Agrodealer",       title: "Agrodealer",        body: "I sell seeds, fertilizer and tools",     emoji: "🏪", color: "from-blue-500/20 to-cyan-600/20 border-blue-500/40"     },
  { value: "Agrovet",          title: "Agrovet",           body: "I sell veterinary supplies",             emoji: "🐄", color: "from-orange-500/20 to-amber-600/20 border-orange-500/40" },
  { value: "Agronomist",       title: "Agronomist",        body: "I give expert farming advice",           emoji: "🔬", color: "from-purple-500/20 to-violet-600/20 border-purple-500/40" },
  { value: "LogisticsProvider",title: "Logistics Provider",body: "I transport cargo to and from farms",    emoji: "🚛", color: "from-red-500/20 to-rose-600/20 border-red-500/40"        },
];

const STEP_LABELS: Record<Step, { num: number; label: string }> = {
  phone: { num: 1, label: "Phone" },
  otp:   { num: 2, label: "Verify" },
  role:  { num: 3, label: "Role"  },
};

/**
 * AuthFlow — premium full-page redesign: phone + OTP + role picker.
 * Replaces the legacy email/password LoginPage on `/login`.
 * Implements DESIGN_SPEC §9.2.1–9.2.3 with glassmorphic aesthetics.
 */
export function AuthFlow() {
  const navigate = useNavigate();
  const { signInWithPhone } = useAuth();
  const [step, setStep] = React.useState<Step>("phone");
  const [region, setRegion] = React.useState<Region>("TZ");
  const [local, setLocal] = React.useState("");
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [isWorking, setIsWorking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resendIn, setResendIn] = React.useState(0);
  const [role, setRole] = React.useState<UserRole>("Farmer");

  const fullPhone = `${DIAL[region].code} ${local}`.trim();
  const phoneE164 = `${DIAL[region].code}${local.replace(/\D/g, "")}`;

  // Countdown timer for resend.
  React.useEffect(() => {
    if (step !== "otp" || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const handleSendCode = async () => {
    setError("");
    setIsWorking(true);
    try {
      await requestOtp(phoneE164, region);
      setStep("otp");
      setResendIn(30);
      toast.success("Code sent.", { description: "Check your SMS." });
    } catch (e) {
      toast.error("Couldn't send the code. Try again.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleVoiceCode = async () => {
    setIsWorking(true);
    try {
      await requestVoiceOtp(phoneE164, region);
      setResendIn(60);
      toast.success("Calling you now.", { description: "Listen for the 6-digit code." });
    } catch {
      toast.error("Couldn't place the voice call.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleVerify = async () => {
    const codeStr = code.join("");
    if (codeStr.length !== 6) { setError("Enter the full 6-digit code."); return; }
    setError("");
    setIsWorking(true);
    try {
      const me = await signInWithPhone({ phone: phoneE164, code: codeStr, region });
      const looksNew = !me.name && me.role === "Farmer";
      if (looksNew) { setIsWorking(false); setStep("role"); return; }
      setIsWorking(false);
      navigate("/", { replace: true });
    } catch (e: any) {
      setIsWorking(false);
      setError(e?.message || "Incorrect code. Try again.");
      setCode(["", "", "", "", "", ""]);
    }
  };

  const handlePickRole = async () => {
    setIsWorking(true);
    try {
      const { apiFetch } = await import("../../lib/apiClient");
      await apiFetch("/api/v1/me/role", { method: "PATCH", body: { role } });
      navigate("/", { replace: true });
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't finish sign-up. Try again.");
    } finally {
      setIsWorking(false);
    }
  };

  const stepNum = STEP_LABELS[step].num;

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* ── Animated mesh background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#0a1a0f] to-zinc-950" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large ambient blobs */}
        <div
          className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #15803d 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #4ade80 0%, transparent 65%)" }}
        />
        {/* Fine noise grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="auth-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
        {/* Floating particle dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-400/30"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        {/* Glow ring around card */}
        <div
          className="absolute -inset-px rounded-[28px] opacity-60 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.35) 0%, transparent 50%, rgba(22,163,74,0.2) 100%)" }}
        />
        <div className="relative rounded-[26px] border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] overflow-hidden p-8">

          {/* Inner subtle top highlight */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* ── Logo + brand ── */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-emerald-500/40 blur-md group-hover:blur-xl transition-all duration-500" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-brand-600 shadow-lg shadow-emerald-900/40">
                <LeafSvg />
              </div>
            </div>
            <div>
              <span className="block text-white font-bold text-lg leading-tight tracking-tight">Mkulima</span>
              <span className="block text-emerald-400/80 text-xs font-medium">Agricultural Platform</span>
            </div>

            {/* Step indicator — right side */}
            <div className="ml-auto flex items-center gap-1.5">
              {(["phone", "otp", "role"] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    s === step ? "w-6 bg-emerald-400" :
                    stepNum > i + 1 ? "w-3 bg-emerald-600/70" :
                    "w-3 bg-white/15"
                  )}
                />
              ))}
            </div>
          </div>

          {/* ── Step content ── */}
          <div key={step} className="animate-fade-in">
            {step === "phone" && (
              <PhoneStep
                local={local}
                setLocal={setLocal}
                region={region}
                setRegion={setRegion}
                isWorking={isWorking}
                error={error}
                onSubmit={handleSendCode}
                onBack={() => navigate("/")}
                onUseEmail={() => navigate("/admin/login")}
              />
            )}
            {step === "otp" && (
              <OtpStep
                phone={fullPhone}
                code={code}
                setCode={setCode}
                onEditNumber={() => setStep("phone")}
                onResend={handleSendCode}
                onVoice={handleVoiceCode}
                onSubmit={handleVerify}
                resendIn={resendIn}
                isWorking={isWorking}
                error={error}
              />
            )}
            {step === "role" && (
              <RoleStep
                value={role}
                onChange={setRole}
                onSubmit={handlePickRole}
                isWorking={isWorking}
              />
            )}
          </div>

          {/* ── Bottom bar ── */}
          <p className="mt-8 text-center text-[11px] text-white/30">
            By continuing you agree to our{" "}
            <span className="text-emerald-400/70 hover:text-emerald-400 cursor-pointer transition-colors">Terms</span>
            {" & "}
            <span className="text-emerald-400/70 hover:text-emerald-400 cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Step 1: Phone ─────────────────────────────── */
function PhoneStep({
  local, setLocal, region, setRegion, isWorking, error, onSubmit, onBack, onUseEmail,
}: {
  local: string; setLocal: (v: string) => void; region: Region; setRegion: (r: Region) => void;
  isWorking: boolean; error: string; onSubmit: () => void; onBack: () => void; onUseEmail: () => void;
}) {
  const validLength = local.replace(/\D/g, "").length >= 9;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (validLength) onSubmit(); }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white leading-tight mb-1.5">
          Karibu! 👋
        </h1>
        <p className="text-sm text-white/50 leading-relaxed">
          Enter your phone number to sign in or create your account automatically.
        </p>
      </div>

      {/* Phone input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">
          Phone Number
        </label>
        <div className="flex gap-2">
          {/* Country selector */}
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              aria-label="Country"
              className="appearance-none h-12 pl-3 pr-8 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              <option value="TZ" className="bg-zinc-900">🇹🇿 +255</option>
              <option value="KE" className="bg-zinc-900">🇰🇪 +254</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
          {/* Number input */}
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="712 345 678"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="flex-1 h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/25 text-sm tabular-nums focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <p className="text-xs text-white/30">{DIAL[region].label} · We never share your number with vendors.</p>
      </div>

      {/* SMS info pill */}
      <div className="flex items-start gap-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15 px-4 py-3">
        <span className="text-emerald-400 mt-0.5 flex-shrink-0">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
        </span>
        <p className="text-xs text-white/50 leading-relaxed">
          <span className="font-semibold text-white/70">Standard SMS rates may apply.</span>{" "}
          On low signal, you can request a voice call after the first try.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <svg className="h-4 w-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="submit"
          disabled={!validLength || isWorking}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
            validLength && !isWorking
              ? "bg-gradient-to-r from-emerald-500 to-brand-600 text-white shadow-[0_4px_20px_rgba(22,163,74,0.4)] hover:shadow-[0_6px_28px_rgba(22,163,74,0.55)] hover:scale-[1.01] active:scale-[0.99]"
              : "bg-white/8 text-white/30 cursor-not-allowed"
          )}
        >
          {isWorking ? (
            <><SpinnerIcon /><span>Sending code…</span></>
          ) : (
            <><span>Send verification code</span><ArrowRightSm /></>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full h-10 rounded-xl text-white/40 hover:text-white/70 text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </button>
      </div>

      <div className="relative flex items-center gap-3 pt-1">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-xs text-white/25">or</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      <button
        type="button"
        onClick={onUseEmail}
        className="w-full h-10 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 text-sm transition-all flex items-center justify-center gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        Sign in with email (admin)
      </button>
    </form>
  );
}

/* ─────────────────────────────── Step 2: OTP ─────────────────────────────── */
function OtpStep({
  phone, code, setCode, onEditNumber, onResend, onVoice, onSubmit, resendIn, isWorking, error,
}: {
  phone: string; code: string[]; setCode: (next: string[]) => void;
  onEditNumber: () => void; onResend: () => void; onVoice: () => void; onSubmit: () => void;
  resendIn: number; isWorking: boolean; error: string;
}) {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  React.useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  // Web OTP API for Android Chrome auto-fill.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const otpCtor = (window as any).OTPCredential;
    if (!otpCtor || !("credentials" in navigator)) return;
    const ac = new AbortController();
    (navigator as any).credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((cred: { code?: string } | null) => {
        if (!cred?.code) return;
        const next = cred.code.slice(0, 6).split("");
        while (next.length < 6) next.push("");
        setCode(next);
        setTimeout(onSubmit, 50);
      })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const writeAt = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputsRef.current[i + 1]?.focus();
    if (next.every((c) => c.length === 1)) setTimeout(onSubmit, 50);
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 0) return;
    e.preventDefault();
    const next = text.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
    if (next.every((c) => c.length === 1)) setTimeout(onSubmit, 50);
  };

  const complete = code.every((c) => c.length === 1);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (complete) onSubmit(); }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white leading-tight mb-1.5">
          Enter your code
        </h1>
        <p className="text-sm text-white/50">6-digit code sent to:</p>
      </div>

      {/* Phone pill */}
      <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        <span className="text-emerald-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
        </span>
        <span className="flex-1 text-sm font-medium text-white tabular-nums">{phone}</span>
        <button type="button" onClick={onEditNumber} className="text-emerald-400 hover:text-emerald-300 transition-colors" aria-label="Edit number">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>
        </button>
      </div>

      {/* OTP boxes */}
      <div className="grid grid-cols-6 gap-2" role="group" aria-label="One-time password">
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={c}
            onChange={(e) => writeAt(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              "h-14 w-full rounded-xl border text-center text-xl font-bold tabular-nums transition-all duration-150",
              "bg-white/5 text-white placeholder-white/20 focus:outline-none",
              c
                ? "border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            )}
          />
        ))}
      </div>

      {/* Resend / voice */}
      <div className="text-center space-y-2">
        {resendIn > 0 ? (
          <p className="text-sm text-white/40">
            Resend in <span className="tabular-nums font-semibold text-white/60">0:{resendIn.toString().padStart(2, "0")}</span>
          </p>
        ) : (
          <button type="button" onClick={onResend} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Resend code
          </button>
        )}
        <button
          type="button"
          onClick={onVoice}
          className="flex items-center gap-1.5 mx-auto text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
          Get code by voice call
        </button>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-xl bg-white/4 border border-white/8 px-4 py-3">
        <span className="text-white/30 mt-0.5 flex-shrink-0">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
        </span>
        <p className="text-xs text-white/35 leading-relaxed">
          <span className="font-semibold text-white/50">Mkulima will never ask you to share this code</span> — not with us, not with anyone.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <svg className="h-4 w-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!complete || isWorking}
        className={cn(
          "w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
          complete && !isWorking
            ? "bg-gradient-to-r from-emerald-500 to-brand-600 text-white shadow-[0_4px_20px_rgba(22,163,74,0.4)] hover:shadow-[0_6px_28px_rgba(22,163,74,0.55)] hover:scale-[1.01] active:scale-[0.99]"
            : "bg-white/8 text-white/30 cursor-not-allowed"
        )}
      >
        {isWorking ? <><SpinnerIcon /><span>Verifying…</span></> : <><span>Verify &amp; continue</span><ArrowRightSm /></>}
      </button>
    </form>
  );
}

/* ─────────────────────────────── Step 3: Role ─────────────────────────────── */
function RoleStep({
  value, onChange, onSubmit, isWorking,
}: {
  value: UserRole; onChange: (r: UserRole) => void; onSubmit: () => void; isWorking: boolean;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-3">
          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}><path d="M20 6 9 17l-5-5"/></svg>
          <span className="text-xs font-semibold text-emerald-400">Phone verified</span>
        </div>
        <h1 className="text-2xl font-bold text-white leading-tight mb-1.5">Which one are you?</h1>
        <p className="text-sm text-white/50">We'll tailor your experience. You can change this later.</p>
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {ROLES.map((r) => {
          const active = r.value === value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange(r.value)}
              aria-pressed={active}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 group",
                active
                  ? `bg-gradient-to-r ${r.color} border-opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)]`
                  : "bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/15"
              )}
            >
              {/* Emoji badge */}
              <span className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-200",
                active ? "scale-110" : "group-hover:scale-105",
                "bg-white/10"
              )}>
                {r.emoji}
              </span>

              <span className="flex-1 min-w-0">
                <span className={cn("block text-sm font-semibold transition-colors", active ? "text-white" : "text-white/75")}>{r.title}</span>
                <span className="block text-xs text-white/40 mt-0.5 truncate">{r.body}</span>
              </span>

              {/* Radio indicator */}
              <span className={cn(
                "flex-shrink-0 h-5 w-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                active
                  ? "border-emerald-400 bg-emerald-400"
                  : "border-white/20 group-hover:border-white/40"
              )}>
                {active && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={isWorking}
        className="w-full h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-brand-600 text-white shadow-[0_4px_20px_rgba(22,163,74,0.4)] hover:shadow-[0_6px_28px_rgba(22,163,74,0.55)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isWorking ? <><SpinnerIcon /><span>Finishing up…</span></> : <><span>Continue</span><ArrowRightSm /></>}
      </button>
    </form>
  );
}

/* ──────────────────── Shared micro-icons ──────────────────── */
function LeafSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 11-11-1 5-1 9-3 12s-5 4-7 4Z"/>
      <path d="M2 22c2-3 5-6 9-9"/>
    </svg>
  );
}
function ArrowRightSm() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );
}
