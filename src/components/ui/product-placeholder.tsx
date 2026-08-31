import { cn } from "@/lib/utils";

/**
 * Stands in for a product with no photograph.
 *
 * Drawn rather than shipped as a file: it is a few hundred bytes of markup, it
 * scales to any tile without a second asset, and it recolours with the theme.
 *
 * It deliberately does not look like a product. Inventing imagery for a
 * product whose photo we do not have would misrepresent what is being sold —
 * this reads as "no picture yet", which is the truth.
 */
export function ProductPlaceholder({
  className,
  label = "Photo coming soon",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-blush",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="size-8 text-primary/40"
      >
        {/* a bottle: the one shape the whole catalogue has in common */}
        <path d="M20 6h8v6l4 6v20a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V18l4-6V6Z" />
        <path d="M16 26h16" />
      </svg>
      <span className="px-2 text-center text-[10px] uppercase tracking-[0.12em] text-faint">
        {label}
      </span>
    </div>
  );
}
