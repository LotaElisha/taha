import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Override the breakpoint at which Dialog replaces Drawer. */
  desktopBreakpointPx?: number;
  /** Width of the desktop dialog (e.g. "max-w-md", "max-w-2xl"). */
  desktopMaxWidthClass?: string;
}

/**
 * useMediaQuery — small hook to swap mobile <Drawer> for desktop <Dialog>.
 * No SSR concern in this Vite SPA.
 */
function useIsDesktop(thresholdPx: number) {
  const [isDesktop, setIsDesktop] = React.useState(() =>
    typeof window === "undefined" ? false : window.innerWidth >= thresholdPx
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${thresholdPx}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [thresholdPx]);
  return isDesktop;
}

/**
 * ResponsiveDialog — drawer-on-mobile, dialog-on-desktop, same children.
 * Per DESIGN_SPEC §6.2, modal-style surfaces should become bottom drawers
 * on small screens for thumb reach.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  desktopBreakpointPx = 768,
  desktopMaxWidthClass = "max-w-lg",
}: ResponsiveDialogProps) {
  const isDesktop = useIsDesktop(desktopBreakpointPx);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={desktopMaxWidthClass}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="px-4 pb-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
