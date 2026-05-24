import { Toaster as Sonner } from "sonner";
import { useTheme } from "../../context/ThemeContext";

/**
 * App-wide toast host. Mount once near the root.
 * Inherits dark/light from the existing ThemeContext.
 */
export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme as "light" | "dark"}
      position="top-center"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-fg group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted",
          actionButton:
            "group-[.toast]:bg-brand-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-surface-2 group-[.toast]:text-fg",
        },
      }}
    />
  );
}

export { toast } from "sonner";
