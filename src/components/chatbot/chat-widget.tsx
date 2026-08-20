"use client";

import { useRef, useState } from "react";

import { ChatPanel, type ChatTurn } from "@/components/chatbot/chat-panel";
import { OPENING_QUICK_REPLIES } from "@/data/chatbot/quick-replies";
import { EMPTY_SLOTS, type ChatResponse, type Slots } from "@/lib/chatbot/types";

const GREETING: ChatTurn = {
  id: 0,
  role: "bot",
  text: "Hi! I can help you pick something for your skin, or answer questions about delivery, payment and returns.",
  quickReplies: OPENING_QUICK_REPLIES,
};

/**
 * The shop assistant, mounted once on the storefront.
 *
 * Conversation state lives here and nowhere else — it is sent with each
 * request and never stored on the server, so the transcript dies with the tab
 * and there is no chat history to leak. `slots` is what carries "dry skin"
 * forward into the next message about budget.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([GREETING]);
  const [slots, setSlots] = useState<Slots>(EMPTY_SLOTS);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextId = useRef(1);

  const send = async (message: string) => {
    setError(null);
    setPending(true);

    setTurns((current) => [
      ...current,
      { id: nextId.current++, role: "user", text: message },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, slots }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }

      const body = (await response.json()) as ChatResponse;

      setSlots(body.slots);
      setTurns((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "bot",
          text: body.message,
          products: body.products,
          quickReplies: body.quickReplies,
          links: body.links,
        },
      ]);
    } catch {
      setError("Couldn't reach the assistant. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {open && (
        <div
          // full screen on a phone, a panel on a desktop. bottom-16 clears the
          // mobile bottom nav, which is fixed at the same edge.
          className="fixed inset-x-0 bottom-16 top-0 z-60 p-3 lg:inset-auto lg:bottom-24 lg:right-6 lg:top-auto lg:h-140 lg:w-95 lg:p-0"
        >
          <ChatPanel
            turns={turns}
            pending={pending}
            error={error}
            onSend={send}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Close shop assistant" : "Open shop assistant"}
        className="fixed right-4 bottom-20 z-60 flex size-12 items-center justify-center bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-mulberry-hover lg:right-6 lg:bottom-6 lg:size-14"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className="size-5 lg:size-6"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path
              d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.6 9.6 0 0 1-3.4-.6L3 21l1.6-4.6A8.4 8.4 0 0 1 4 11.5 8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>
    </>
  );
}
