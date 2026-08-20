"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ChatMessage } from "@/components/chatbot/chat-message";
import { ChatProductCard } from "@/components/chatbot/chat-product-card";
import { QuickReplies } from "@/components/chatbot/quick-replies";
import { TypingIndicator } from "@/components/chatbot/typing-indicator";
import type { ChatLink, ChatProductCard as ProductCardData } from "@/lib/chatbot/types";

export type ChatTurn = {
  id: number;
  role: "user" | "bot";
  text: string;
  products?: ProductCardData[];
  quickReplies?: string[];
  links?: ChatLink[];
};

const MAX_INPUT = 500;

export function ChatPanel({
  turns,
  pending,
  error,
  onSend,
  onClose,
}: {
  turns: ChatTurn[];
  pending: boolean;
  error: string | null;
  onSend: (message: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // the newest turn is the one worth reading, so the log stays pinned to the
  // bottom as it grows
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (message: string) => {
    const trimmed = message.trim();
    if (trimmed.length === 0 || pending) return;
    setValue("");
    onSend(trimmed);
  };

  // only the last bot turn offers chips — older ones have been answered
  const lastBotIndex = turns.map((turn) => turn.role).lastIndexOf("bot");

  return (
    <div className="flex h-full flex-col border border-border bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-border bg-cream px-4 py-3">
        <div>
          <p className="text-[13px] font-bold text-ink">Korean Hive assistant</p>
          <p className="text-[11px] text-faint">
            Product help, delivery and returns
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex size-8 items-center justify-center text-faint transition-colors hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
            className="size-4"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {turns.map((turn, index) => (
          <div key={turn.id} className="space-y-2">
            <ChatMessage role={turn.role}>{turn.text}</ChatMessage>

            {turn.products && turn.products.length > 0 && (
              <div className="space-y-2">
                {turn.products.map((product) => (
                  <ChatProductCard key={product.slug} product={product} />
                ))}
              </div>
            )}

            {turn.links && turn.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {turn.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[11.5px] font-semibold text-primary underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {index === lastBotIndex && turn.quickReplies && (
              <QuickReplies
                options={turn.quickReplies}
                disabled={pending}
                onPick={submit}
              />
            )}
          </div>
        ))}

        {pending && <TypingIndicator />}

        {error && (
          <p role="alert" className="text-[12px] text-destructive">
            {error}
          </p>
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t border-border px-3 py-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, MAX_INPUT))}
          maxLength={MAX_INPUT}
          placeholder="Ask about a product, delivery, returns…"
          aria-label="Message"
          autoComplete="off"
          className="h-10 w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
        />

        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          className="shrink-0 bg-primary px-4 py-2 text-[11px] font-bold tracking-[0.06em] text-primary-foreground transition-colors hover:bg-mulberry-hover disabled:bg-hairline disabled:text-faint"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
