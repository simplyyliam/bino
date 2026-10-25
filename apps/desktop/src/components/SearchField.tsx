import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@bino/ui";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
};

export function SearchField({ value, onChange, placeholder, className, autoFocus }: SearchFieldProps) {
  return (
    <div className={cn("relative w-64", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && value && (e.stopPropagation(), onChange(""))}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-card pr-8 pl-9 text-[13px] shadow-[0_1px_2px_oklch(0_0_0/0.03)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 focus:border-primary focus:ring-3 focus:ring-ring/40 dark:bg-input/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
