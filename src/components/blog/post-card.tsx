import Image from "next/image";
import Link from "next/link";

import type { Post } from "@/data/blog";

/**
 * One journal card, shared by the home page and /blog so the two cannot drift.
 *
 * Titles are Bangla, so the heading carries lang="bn" and picks up Hind
 * Siliguri from globals.css. Without it the Latin face renders the Bangla
 * glyphs from a system fallback and the conjuncts break.
 */
export function PostCard({
  post,
  priority,
  showSummary = true,
}: {
  post: Post;
  priority?: boolean;
  /** The home page grid is tight; /blog has room for the description. */
  showSummary?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col border border-border bg-card"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-blush">
        <Image
          src={post.cover}
          alt={post.coverAlt}
          fill
          priority={priority}
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{post.category}</p>
        <h3
          lang="bn"
          className="mt-2 font-display text-lg leading-snug group-hover:text-primary"
        >
          {post.title}
        </h3>

        {showSummary ? (
          <p
            lang="bn"
            className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground"
          >
            {post.description}
          </p>
        ) : null}

        <p className="mt-auto pt-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {post.readingMinutes} min read
        </p>
      </div>
    </Link>
  );
}
