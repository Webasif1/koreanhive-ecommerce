/**
 * Suggested phrasings.
 *
 * Load-bearing, not decorative: a rule engine understands the wordings it was
 * given, and these chips are exactly those wordings. Tapping instead of typing
 * is the happy path.
 */
export function QuickReplies({
  options,
  disabled,
  onPick,
}: {
  options: string[];
  disabled: boolean;
  onPick: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onPick(option)}
          className="border border-chip-border bg-blush px-3 py-1.5 text-[11.5px] font-semibold text-primary transition-colors hover:border-primary disabled:opacity-50"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
