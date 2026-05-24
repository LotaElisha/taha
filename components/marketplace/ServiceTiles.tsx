import * as React from "react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../context/LanguageContext";

interface ServiceTilesProps {
  onScan?: () => void;
  onSoilTest?: () => void;
  onAgronomist?: () => void;
  onVet?: () => void;
  onLogistics?: () => void;
  onWarehouse?: () => void;
}

interface Tile {
  id: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

/**
 * ServiceTiles — 2-col grid of clickable cards on mobile, 3-col on tablet+.
 * Features premium card elevations and icon gradients.
 */
export function ServiceTiles(props: ServiceTilesProps) {
  const { locale } = useLanguage();
  const isSw = locale === "sw";

  const tiles: Tile[] = [
    {
      id: "scan",
      title: isSw ? "Vipimo vya Mimea" : "Plant scanner",
      body: isSw ? "Tambua magonjwa kwa picha" : "Diagnose disease from a photo",
      icon: <LeafIcon />,
      onClick: props.onScan,
    },
    {
      id: "soil",
      title: isSw ? "Pima Udongo" : "Soil testing",
      body: isSw ? "Uchambuzi na mpango wa mbolea" : "Lab analysis + fertilizer plan",
      icon: <TestTubeIcon />,
      onClick: props.onSoilTest,
    },
    {
      id: "agronomist",
      title: isSw ? "Mtaalamu wa Kilimo" : "Agronomist",
      body: isSw ? "Ushauri mtandaoni au shambani" : "Virtual or field visit",
      icon: <UserCheckIcon />,
      onClick: props.onAgronomist,
    },
    {
      id: "vet",
      title: isSw ? "Msaada wa Mifugo" : "Veterinary help",
      body: isSw ? "Ushauri wa afya ya wanyama" : "Consultation for livestock",
      icon: <PawIcon />,
      onClick: props.onVet,
    },
    {
      id: "logistics",
      title: isSw ? "Usafirishaji" : "Logistics",
      body: isSw ? "Mabehewa na magari ya soko" : "Book transport to market",
      icon: <TruckIcon />,
      onClick: props.onLogistics,
    },
    {
      id: "warehouse",
      title: isSw ? "Ghala la Mazao" : "Warehouse",
      body: isSw ? "Hifadhi mavuno salama" : "Store harvest near you",
      icon: <BuildingIcon />,
      onClick: props.onWarehouse,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-6">
      <div className="mb-4 flex flex-col gap-0.5">
        <h2 className="text-lg font-bold tracking-tight text-fg">
          {isSw ? "Huduma za Kilimo na Mifugo" : "Farming & Livestock Services"}
        </h2>
        <p className="text-xs text-muted">
          {isSw ? "Huduma za kitaalamu na ushauri wa haraka wa AI" : "Professional diagnostics, consultations & logistics tools"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={t.onClick}
            className={cn(
              "group flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-surface p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            )}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-50 to-brand-100 text-brand-700 dark:from-brand-950/40 dark:to-brand-800/20 dark:text-brand-200 transition-transform duration-300 group-hover:scale-110 shadow-sm shrink-0">
              {t.icon}
            </span>
            <div className="space-y-1">
              <span className="block text-sm font-semibold text-fg group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {t.title}
              </span>
              <span className="block text-xs leading-snug text-muted line-clamp-2">
                {t.body}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// Compact local icons so we don't pull lucide-react into the marketplace bundle.
function LeafIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 11-11-1 5-1 9-3 12s-5 4-7 4Z" /><path d="M2 22c2-3 5-6 9-9" /></svg>); }
function TestTubeIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2v17a3 3 0 0 1-6 0V2" /><path d="M8 13h6" /></svg>); }
function UserCheckIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="8" r="4" /><path d="M2 20a7 7 0 0 1 14 0" /><path d="m17 11 2 2 4-4" /></svg>); }
function PawIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="4" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><circle cx="4" cy="16" r="2" /><path d="M8 22a4 4 0 1 1 8 0" /></svg>); }
function TruckIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 18V6h7l3 5v7h-3" /><path d="M14 18H3V6h11Z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>); }
function BuildingIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="6" width="18" height="14" rx="1" /><path d="M8 6V2h8v4" /><path d="M9 11h6M9 15h6" /></svg>); }
