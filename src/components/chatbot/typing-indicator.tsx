/** Three dots while the round trip is in flight. Rules answer in milliseconds,
 *  so this is usually one frame — it exists for a slow connection, not a slow
 *  model. */
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 border border-hairline bg-cream px-3.5 py-3"
        role="status"
        aria-label="Assistant is typing"
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-pulse rounded-full bg-faint"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
