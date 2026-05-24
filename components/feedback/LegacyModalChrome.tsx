import * as React from "react";
import { ResponsiveDialog } from "./ResponsiveDialog";

interface LegacyModalChromeProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  desktopMaxWidthClass?: string;
}

/**
 * LegacyModalChrome — a thin wrapper that gives the existing Soil/Vet/
 * Agronomist/Warehouse forms the new drawer-on-mobile behavior without
 * having to rewrite each form. Drop the existing
 *   `if (!isOpen) return null; return <div className="fixed inset-0 ...">...</div>`
 * shell, render the inner form as children of this component instead.
 *
 * Sprint 5 polish task. Sprint 6 redesigns each form from scratch.
 */
export function LegacyModalChrome({
  isOpen,
  onClose,
  title,
  description,
  children,
  desktopMaxWidthClass = "max-w-lg",
}: LegacyModalChromeProps) {
  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(o) => !o && onClose()}
      title={title}
      description={description}
      desktopMaxWidthClass={desktopMaxWidthClass}
    >
      <div className="max-h-[75dvh] overflow-y-auto">{children}</div>
    </ResponsiveDialog>
  );
}
