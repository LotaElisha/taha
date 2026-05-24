import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Button } from "../ui/button";

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
}

/**
 * SearchDrawer — mobile-first search bottom sheet.
 * Replaces window.prompt with a proper input field and submit button.
 */
export function SearchDrawer({
  isOpen,
  onClose,
  onSubmit,
  placeholder = "Search products…",
}: SearchDrawerProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      // Focus the input after the drawer animation starts
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query.trim());
      setQuery("");
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[50dvh]">
        <DrawerHeader>
          <DrawerTitle>Search</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={!query.trim()}
            >
              Search
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
