import Image from "next/image";
import Link from "next/link";
import { Banknote, ShieldCheck, Truck } from "lucide-react";

import { footerNav } from "@/lib/navigation";

/* lucide-react v1 no longer ships brand icons, so these are inlined. */
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.46.66.26 1.22.6 1.77 1.16.56.55.9 1.11 1.16 1.77.24.63.41 1.36.46 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.46 2.43a4.9 4.9 0 0 1-1.16 1.77c-.55.56-1.11.9-1.77 1.16-.63.24-1.36.41-2.43.46-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.46a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.24-.63-.41-1.36-.46-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.46-2.43.26-.66.6-1.22 1.16-1.77.55-.56 1.11-.9 1.77-1.16.63-.24 1.36-.41 2.43-.46C8.94 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.98.04-1.5.2-1.86.34-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.36-.3.88-.34 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.98.2 1.5.34 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.36.14.88.3 1.86.34 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.98-.04 1.5-.2 1.86-.34.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.36.3-.88.34-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.98-.2-1.5-.34-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.36-.14-.88-.3-1.86-.34-1.05-.05-1.37-.06-4.04-.06Zm0 3.07a5.13 5.13 0 1 1 0 10.26 5.13 5.13 0 0 1 0-10.26Zm0 1.8a3.33 3.33 0 1 0 0 6.66 3.33 3.33 0 0 0 0-6.66Zm5.34-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
    </svg>
  );
}

const trust = [
  { icon: ShieldCheck, label: "100% authentic, imported from Korea" },
  { icon: Banknote, label: "Cash on delivery nationwide" },
  { icon: Truck, label: "Delivered to all 64 districts" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink text-blush">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href="/" className="block">
            {/* Rendered as-is, like the header. It was previously filtered
                with brightness-0 invert, which flattens every opaque pixel to
                white — on artwork with real transparency that turns the
                wordmark into a featureless block. The logo's own colour is a
                light mulberry, so it already reads on the ink background. */}
            <Image
              src="/brand/logo.webp"
              alt="Korean Hive — authentic Korean skincare in Bangladesh"
              width={220}
              height={42}
              className="h-9 w-auto"
            />
          </Link>
          <p className="text-sm leading-relaxed text-light">
            Authentic Korean beauty and skincare, sourced in Seoul and
            delivered across Bangladesh.
          </p>
          <p lang="bn" className="text-sm leading-relaxed text-light">
            ৳২৫০০+ অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি।
          </p>
          <div className="flex gap-3 pt-1">
            <Link
              href="https://facebook.com"
              aria-label="Korean Hive on Facebook"
              className="text-light transition-colors hover:text-white"
            >
              <FacebookIcon className="size-5" />
            </Link>
            <Link
              href="https://instagram.com"
              aria-label="Korean Hive on Instagram"
              className="text-light transition-colors hover:text-white"
            >
              <InstagramIcon className="size-5" />
            </Link>
          </div>
        </div>

        {footerNav.map((group) => (
          <div key={group.title}>
            <h2 className="font-display text-base text-white">{group.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-light transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {trust.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-[11.5px] text-light"
              >
                <Icon className="size-3.5" />
                {label}
              </span>
            ))}
          </div>
          <p className="text-[11.5px] text-light">
            © {new Date().getFullYear()} Korean Hive
          </p>
        </div>
      </div>
    </footer>
  );
}
