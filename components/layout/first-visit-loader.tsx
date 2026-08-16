"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

const SEEN_KEY = "kh-welcomed";
/** Below this, the page was never actually slow — showing a loader would be
 *  theatre, and a flash of one is worse than none. */
const SHOW_AFTER_MS = 150;
/** Once it is on screen it stays long enough to read, then fades. */
const MIN_VISIBLE_MS = 600;

/**
 * Branded welcome, shown once per browser session.
 *
 * Mounted client-side only and never rendered into the server HTML, so it
 * cannot become the LCP element or delay first paint — the real page is
 * already painted underneath it. It is a greeting laid over ready content,
 * not a gate in front of pending content.
 */
export function FirstVisitLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem(SEEN_KEY, "1");
      return;
    }

    sessionStorage.setItem(SEEN_KEY, "1");

    const show = window.setTimeout(() => {
      setVisible(true);
      window.setTimeout(() => setVisible(false), MIN_VISIBLE_MS);
    }, SHOW_AFTER_MS);

    return () => window.clearTimeout(show);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          // aria-hidden and non-interactive: a screen reader should hear the
          // page, which is already there, not this
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-100 flex items-center justify-center bg-cream"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <Image
              src="/brand/logo.webp"
              alt=""
              width={220}
              height={42}
              priority
              className="h-10 w-auto"
            />

            {/* a filling bar rather than a spinner — it reads as progress
                towards something rather than an open-ended wait */}
            <span className="block h-[2px] w-40 overflow-hidden bg-rose-border">
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.75, ease: "easeInOut" }}
                className="block h-full w-full origin-left bg-primary"
              />
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
