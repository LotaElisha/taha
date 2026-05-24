import * as React from "react";
import { Button } from "../ui/button";
import { useLanguage } from "../../context/LanguageContext";

interface HeroBannerProps {
  onShop?: () => void;
  onScan?: () => void;
}

/**
 * HeroBanner — highly premium, vibrant, agronomic dark-green gradient hero.
 * Features a glowing interactive digital telemetry widget on desktop.
 */
export function HeroBanner({ onShop, onScan }: HeroBannerProps) {
  const { locale } = useLanguage();
  const isSw = locale === "sw";

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-950 to-emerald-950 p-6 shadow-xl sm:p-12">
        {/* Background Grid & Ambient Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Column 1: Copy and Actions */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              {isSw ? "Soko la Mkulima la PWA" : "Mkulima Premium PWA"}
            </div>

            <h1 className="max-w-2xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              {isSw ? (
                <>
                  Mbegu, zana na ushauri wa <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">karibu na shamba lako.</span>
                </>
              ) : (
                <>
                  Quality seeds, tools and trusted advice — <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">close to your farm.</span>
                </>
              )}
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-emerald-100/75 sm:text-base">
              {isSw
                ? "Boresha kilimo chako kwa kutumia teknolojia ya kisasa ya kupima mimea, kupata taarifa za hali ya hewa na kununua pembejeo bora kutoka kwa wauzaji wanaoaminika karibu nawe."
                : "Empower your farm with high-tech satellite alerts, instant AI plant disease detection, and direct marketplace access to verified agrodealers and vetted agrovets."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:max-w-md pt-2">
              <Button
                variant="primary"
                onClick={onShop}
                className="w-full sm:flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold transition-all hover:scale-[1.02] shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
              >
                <ShoppingBagIcon />
                {isSw ? "Nunua sasa" : "Shop now"}
              </Button>
              <Button
                variant="outline"
                onClick={onScan}
                className="w-full sm:flex-1 h-12 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 active:bg-white/20 text-white font-semibold transition-all hover:scale-[1.02] backdrop-blur-md flex items-center justify-center gap-2"
              >
                <CameraIcon />
                {isSw ? "Pima mmea" : "Scan plant"}
              </Button>
            </div>
          </div>

          {/* Column 2: Interactive Telemetry UI Widget (Desktop / lg-only) */}
          <div className="hidden lg:block lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
              {/* Subtle top decoration */}
              <div className="absolute -top-3 right-4 bg-emerald-500 text-[10px] font-black text-emerald-950 px-3 py-1 rounded-full shadow-lg tracking-wider uppercase">
                {isSw ? "UCHUNGUZI WA AI" : "AI TELEMETRY"}
              </div>

              {/* Weather & Location Widget */}
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                    Tanzania / Arusha
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">24°C</span>
                    <span className="text-3xl text-emerald-300">🌤️</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-100/70 mt-1">
                    {isSw ? "Hali ya hewa nzuri kwa upandaji" : "Optimal soil humidity & sunshine"}
                  </p>
                </div>
              </div>

              {/* Dynamic Health Metric Visual */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                  <p className="text-[10px] text-emerald-200/50 uppercase font-black mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {isSw ? "Unyevu wa Udongo" : "Soil Moisture"}
                  </p>
                  <p className="text-xl font-bold text-white">82%</p>
                  <span className="text-[9px] text-emerald-400 font-medium">{isSw ? "Kiwango thabiti" : "Stable level"}</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                  <p className="text-[10px] text-emerald-200/50 uppercase font-black mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    {isSw ? "Ubora wa Mazao" : "Crop Health"}
                  </p>
                  <p className="text-xl font-bold text-white">96%</p>
                  <span className="text-[9px] text-teal-400 font-medium">{isSw ? "Hakuna magonjwa" : "Healthy condition"}</span>
                </div>
              </div>

              {/* Live Disease Diagnosis Monitor */}
              <div className="rounded-2xl border border-white/10 bg-emerald-950/40 p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                    {isSw ? "Uchunguzi wa Haraka" : "Live Scan Feed"}
                  </p>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex gap-3 items-center">
                  <div className="relative h-11 w-11 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center text-xl overflow-hidden shrink-0">
                    🌿
                    <div className="absolute inset-x-0 top-0 h-[1.5px] bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[scan-line_2s_infinite]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {isSw ? "Mmea wa Mahindi" : "Maize Leaf Scanner"}
                    </p>
                    <p className="text-[10px] text-emerald-200/60 mt-0.5">
                      {isSw ? "Tayari kwa uchambuzi wa picha" : "Awaiting scan input — Camera ready"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </section>
  );
}

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
