import { cn } from "@/lib/utils";

/**
 * One bubble.
 *
 * The text is passed as a React child, never as HTML — `whitespace-pre-line`
 * is what turns the engine's paragraph breaks into line breaks, so nothing has
 * to be parsed or sanitised. A shopper who types `<script>` sees `<script>`.
 */
export function ChatMessage({
  role,
  children,
}: {
  role: "user" | "bot";
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-[13px] leading-relaxed",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "border border-hairline bg-cream text-ink",
        )}
      >
        {children}
      </div>
    </div>
  );
}
