import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/ui/sonner";
import { cn } from "../../lib/utils";

/**
 * AdminLoginPage — `/admin/login`.
 *
 * Email + password path for staff roles (Admin, SuperAdmin, KYCOfficer,
 * CatalogManager, SupportAgent, FinancialAuditor, Agronomist). The server
 * enforces the role allowlist; clients can't bypass by hand-crafting a
 * request. Farmers / vendors / logistics providers use phone+OTP at /login.
 */
export function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, user } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isWorking, setIsWorking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [focused, setFocused] = React.useState<"email" | "password" | null>(null);

  // If a session already exists, push to the right surface.
  React.useEffect(() => {
    if (user) {
      const target =
        user.role === "Farmer"
          ? "/farmer"
          : user.role === "Agrodealer" || user.role === "Agrovet"
            ? "/dealer"
            : user.role === "Agronomist"
              ? "/agronomist"
              : user.role === "LogisticsProvider"
                ? "/logistics"
                : "/admin";
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setIsWorking(true);
    try {
      await loginWithEmail(email.trim(), password);
      toast.success("Signed in.");
      navigate("/admin", { replace: true });
    } catch (e: any) {
      const errs = e?.errors as Record<string, string[]> | undefined;
      const first = errs?.email?.[0] ?? errs?.password?.[0];
      setError(first || e?.message || "Invalid credentials.");
    } finally {
      setIsWorking(false);
    }
  };

  const isValid = email.includes("@") && password.length >= 6;

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">

      {/* ── Animated mesh background — deep charcoal with red/amber accents ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#130a0a] to-zinc-950" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ambient blobs */}
        <div
          className="absolute -top-48 -right-32 w-[38rem] h-[38rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #dc2626 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[34rem] h-[34rem] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #b45309 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[50rem] h-[50rem] rounded-full opacity-[0.05] blur-3xl"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 65%)" }}
        />

        {/* Fine grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="admin-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-grid)" />
        </svg>

        {/* Diagonal scanline accent */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
          }}
        />

        {/* Floating dots — amber/red tones */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 2}px`,
              height: `${Math.random() * 3 + 2}px`,
              backgroundColor: i % 2 === 0 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)",
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
        {/* Glow ring — red/amber */}
        <div
          className="absolute -inset-px rounded-[28px] opacity-50 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.3) 0%, transparent 50%, rgba(180,83,9,0.25) 100%)",
          }}
        />

        <div className="relative rounded-[26px] border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_32px_64px_rgba(0,0,0,0.65)] overflow-hidden p-8">

          {/* Inner top highlight */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              {/* Shield badge */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-xl bg-red-600/40 blur-md group-hover:blur-xl transition-all duration-500" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-700 shadow-lg shadow-red-900/50">
                  <ShieldCheckSvg />
                </div>
              </div>
              <div>
                <span className="block text-white font-bold text-lg leading-tight tracking-tight">Mkulima</span>
                <span className="block text-red-400/80 text-xs font-medium">Staff Portal</span>
              </div>
            </div>

            {/* Access-restricted badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Restricted</span>
            </div>
          </div>

          {/* ── Heading ── */}
          <div className="mb-7 space-y-1.5">
            <h1 className="text-2xl font-bold text-white leading-tight">
              Staff sign-in
            </h1>
            <p className="text-sm text-white/45 leading-relaxed">
              For admin, agronomist and support accounts only.{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-amber-400/80 hover:text-amber-400 underline underline-offset-2 transition-colors"
              >
                Farmers and vendors →
              </button>
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Demo credentials hint */}
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
              <span className="text-amber-400 flex-shrink-0">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </span>
              <p className="text-xs text-white/50 leading-relaxed">
                Demo: use{" "}
                <button
                  type="button"
                  onClick={() => { setEmail("admin@mkulima.com"); setPassword("password"); }}
                  className="font-semibold text-amber-400/90 hover:text-amber-300 transition-colors"
                >
                  admin@mkulima.com
                </button>
                {" "}/ <span className="font-semibold text-white/60">password</span>
              </p>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-widest text-white/40"
              >
                Email address
              </label>
              <div className="relative">
                <div className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200",
                  focused === "email" ? "text-red-400" : "text-white/25"
                )}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@mkulima.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  required
                  className={cn(
                    "w-full h-12 pl-10 pr-4 rounded-xl border text-white text-sm placeholder-white/20 bg-white/5 transition-all duration-200 focus:outline-none",
                    focused === "email"
                      ? "border-red-500/50 ring-2 ring-red-500/15 bg-white/8"
                      : "border-white/10 hover:border-white/15"
                  )}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-widest text-white/40"
              >
                Password
              </label>
              <div className="relative">
                <div className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200",
                  focused === "password" ? "text-red-400" : "text-white/25"
                )}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  required
                  className={cn(
                    "w-full h-12 pl-10 pr-12 rounded-xl border text-white text-sm placeholder-white/20 bg-white/5 transition-all duration-200 focus:outline-none",
                    focused === "password"
                      ? "border-red-500/50 ring-2 ring-red-500/15 bg-white/8"
                      : "border-white/10 hover:border-white/15"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOffSvg /> : <EyeSvg />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 animate-fade-in">
                <svg className="h-4 w-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isWorking}
                className={cn(
                  "w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2",
                  isValid && !isWorking
                    ? "bg-gradient-to-r from-red-600 to-orange-700 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35)] hover:shadow-[0_6px_28px_rgba(220,38,38,0.5)] hover:scale-[1.01] active:scale-[0.99]"
                    : "bg-white/8 text-white/30 cursor-not-allowed"
                )}
              >
                {isWorking ? (
                  <><SpinnerIcon /><span>Signing in…</span></>
                ) : (
                  <>
                    <ShieldCheckSmall />
                    <span>Sign in to Admin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full h-10 rounded-xl text-white/35 hover:text-white/65 text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to phone sign-in
              </button>
            </div>
          </form>

          {/* ── Footer ── */}
          <div className="mt-6 pt-5 border-t border-white/6 flex items-start gap-3">
            <svg className="h-4 w-4 text-white/20 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
            </svg>
            <p className="text-[11px] text-white/25 leading-relaxed">
              Lost your password? Contact your SuperAdmin — staff resets are handled out-of-band. All sign-in attempts are logged.
            </p>
          </div>

          {/* Inner bottom highlight */}
          <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ── */
function ShieldCheckSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
function ShieldCheckSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
function EyeSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOffSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <path d="M2 2l20 20"/>
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
