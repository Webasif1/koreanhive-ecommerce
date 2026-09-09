import type { Metadata } from "next";

import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { POSTS } from "@/data/blog";
import { breadcrumbJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Beauty Journal",
  description:
    "Korean skincare routines, ingredient guides and beginner advice written for Bangladesh's weather — by Korean Hive.",
  alternates: { canonical: "/blog" },
  // This used to be noindex, because the page had no articles on it and an
  // empty section a crawler can reach is a thin page. It has three now.
};

export default function BlogPage() {
  return (
    <div className="container-page py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Beauty Journal", path: "/blog" },
        ])}
      />

      <p className="eyebrow">The Hive Journal</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Routines, ingredients and honest advice
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Written in Bangla, for skin that has to survive Dhaka humidity — what to
        use, in what order, and what to leave on the shelf.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((post, index) => (
          <PostCard key={post.slug} post={post} priority={index === 0} />
        ))}
      </div>
    </div>
  );
}
