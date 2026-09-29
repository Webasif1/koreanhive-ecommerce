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
 * The icon is our own mark, breathing gently while the page loads — not a
 * spinner.
 */

const MIN_VISIBLE_MS = 900;
const MAX_VISIBLE_MS = 2200;
const SESSION_KEY = "kh-welcomed";
const WELCOME_MARK = "/brand/logo.webp";
const WELCOME_ICON = "/brand/icon.webp";

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
    // Phones skip it. It waits for \`load\` (GTM plus every image), and on a
    // slow mobile connection that is exactly when it would sit there longest.
    if (window.matchMedia && window.matchMedia("(max-width: 1023.98px)").matches) return;
    if (sessionStorage.getItem(${JSON.stringify(SESSION_KEY)})) return;
    sessionStorage.setItem(${JSON.stringify(SESSION_KEY)}, "1");
  } catch (e) { return; }

  var root = document.documentElement;
  root.classList.add("kh-welcome");

  // the artwork's preloads, issued only when the overlay is really shown
  [${JSON.stringify(WELCOME_ICON)}, ${JSON.stringify(WELCOME_MARK)}].forEach(function (href) {
    var link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
  });

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
          {/* lazy for the same reason as the wordmark below */}
          <Image
            className="kh-welcome-icon"
            src={WELCOME_ICON}
            alt=""
            width={240}
            height={236}
            fetchPriority="high"
          />

          <Image
            className="kh-welcome-mark"
            src={WELCOME_MARK}
            alt=""
            width={220}
            height={42}
            // Lazy, not preloaded: the overlay is display:none unless the gate
            // script reveals it (never on phones), and a lazy image inside a
            // hidden box is not fetched. The preload it had was a second logo
            // download competing with the header's on every page view. When
            // the overlay does show, the gate script preloads it at high
            // priority, exactly as before.
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
