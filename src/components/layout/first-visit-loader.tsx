import Image from "next/image";

/**
 * The welcome screen, shown once per browser session.
 *
 * Three things about it are deliberate.
 *
 * **It is server-rendered and CSS-driven.** The previous version was a client
 * component built on `motion/react`, which pulled framer-motion into the
 * bundle of *every* page — 835 KB unminified, the single largest avoidable
 * dependency in the app — so that a greeting could play for 600 ms once a
 * session. Nothing here needs a JavaScript animation library: it is keyframes
 * in globals.css, and removing the import removes the library.
 *
 * **It cannot flash content-then-splash.** The old one mounted in `useEffect`,
 * so on a fast connection the real page painted first and the loader appeared
 * *over* ready content 150 ms later — the opposite of what a loading screen is
 * for. The markup is now in the server HTML, hidden by default, and revealed
 * by the inline script below, which runs before the body paints.
 *
 * **It never gates anything.** The overlay removes itself on `load`, after a
 * short minimum so it cannot strobe, and a hard cap so a slow image or a
 * failed request can never leave a visitor staring at it. If JavaScript never
 * runs, the CSS animation ends on `forwards` with the overlay transparent and
 * `pointer-events: none`, so the page underneath is fully usable regardless.
 *
 * The honeycomb is drawn from six hexagons settling around a seventh — the
 * hive filling. It is our own mark, not a spinner.
 */

const MIN_VISIBLE_MS = 900;
const MAX_VISIBLE_MS = 2200;
const SESSION_KEY = "kh-welcomed";

/**
 * Runs synchronously, before the body renders.
 *
 * Skips the whole thing for a repeat view in the same session, for anyone who
 * has asked for reduced motion, and for a browser where sessionStorage throws
 * (private mode in some engines) — in that last case the greeting is simply
 * not shown rather than shown on every navigation.
 */
const GATE_SCRIPT = `
(function () {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem(${JSON.stringify(SESSION_KEY)})) return;
    sessionStorage.setItem(${JSON.stringify(SESSION_KEY)}, "1");
  } catch (e) { return; }

  var root = document.documentElement;
  root.classList.add("kh-welcome");

  var started = Date.now();
  var done = false;

  function dismiss() {
    if (done) return;
    done = true;
    var wait = Math.max(0, ${MIN_VISIBLE_MS} - (Date.now() - started));
    setTimeout(function () {
      root.classList.add("kh-welcome-out");
      setTimeout(function () { root.classList.remove("kh-welcome", "kh-welcome-out"); }, 420);
    }, wait);
  }

  if (document.readyState === "complete") dismiss();
  else window.addEventListener("load", dismiss, { once: true });

  // never let a stalled asset hold the greeting open
  setTimeout(dismiss, ${MAX_VISIBLE_MS});
})();
`;

export function FirstVisitLoader() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }} />

      {/* aria-hidden: a screen reader should hear the page, which is already
          in the DOM underneath, not this */}
      <div className="kh-welcome-screen" aria-hidden>
        <div className="kh-welcome-inner">
          <svg
            className="kh-hive"
            viewBox="0 0 120 108"
            width="112"
            height="101"
            focusable="false"
            aria-hidden
          >
            {/* one flat-top hexagon, reused seven times */}
            <defs>
              <polygon
                id="kh-hex"
                points="18,0 36,10.4 36,31.2 18,41.6 0,31.2 0,10.4"
              />
            </defs>

            <g className="kh-hex-ring">
              <use href="#kh-hex" x="42" y="0" style={{ "--i": 1 } as never} />
              <use href="#kh-hex" x="78" y="21" style={{ "--i": 2 } as never} />
              <use href="#kh-hex" x="78" y="62" style={{ "--i": 3 } as never} />
              <use href="#kh-hex" x="42" y="83" style={{ "--i": 4 } as never} />
              <use href="#kh-hex" x="6" y="62" style={{ "--i": 5 } as never} />
              <use href="#kh-hex" x="6" y="21" style={{ "--i": 6 } as never} />
            </g>

            <use className="kh-hex-core" href="#kh-hex" x="42" y="41" />
          </svg>

          <Image
            className="kh-welcome-mark"
            src="/brand/logo.webp"
            alt=""
            width={220}
            height={42}
            priority
            fetchPriority="high"
          />

          <span className="kh-welcome-bar">
            <span />
          </span>
        </div>
      </div>
    </>
  );
}
