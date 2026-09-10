import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/blog/article-body";
import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { findPost, POSTS } from "@/data/blog";
import { pickSlugs } from "@/lib/blog-picks";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { withSiteSuffix } from "@/lib/site";
import { getProductsBySlugs } from "@/server/queries/catalog";

/**
 * A journal article.
 *
 * Three posts, all known at build time, so these prerender like the concern
 * pages. Any other slug still 404s — that was true when the journal was empty
 * and stays true now, so a crawler cannot mint indexable URLs by guessing.
 */

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);

  if (!post) return { title: "Article Not Found" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: withSiteSuffix(post.title),
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      // the document's own 1200×630 feature card
      images: [{ url: post.cover, width: 1200, height: 630, alt: post.coverAlt }],
    },
  };
}

/** Date-only string, so format it in UTC or it slides a day in some zones. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = findPost(slug);

  if (!post) notFound();

  const more = POSTS.filter((other) => other.slug !== post.slug);

  // One query for every product the article recommends. getProductsBySlugs
  // returns only what is active, so a delisted pick simply falls out of the
  // set and renders as plain text — the article keeps its recommendation and
  // loses only the link.
  const stocked = await getProductsBySlugs(pickSlugs(post.body));
  const linkable = new Set(stocked.map((product) => product.slug));

  return (
    <div className="container-page py-10 md:py-14">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Beauty Journal", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <article className="mx-auto max-w-3xl">
        <header>
          <p className="eyebrow">{post.category}</p>
          <h1
            lang="bn"
            className="mt-3 font-display text-[28px] leading-tight tracking-[-0.01em] md:text-[38px]"
          >
            {post.title}
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {DATE_FORMAT.format(new Date(post.publishedAt))} ·{" "}
            {post.readingMinutes} min read
          </p>
        </header>

        <div className="relative mt-6 aspect-[1200/630] overflow-hidden border border-border bg-blush">
          <Image
            src={post.cover}
            alt={post.coverAlt}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>

        <ArticleBody blocks={post.body} linkable={linkable} />

        <div className="mt-12 flex flex-col items-start gap-4 border border-border bg-blush p-6">
          <p className="font-display text-lg">
            Everything named above is in the shop
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            100% authentic Korean skincare, cash on delivery, delivered to all
            64 districts.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/shop">Browse all products</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/concerns">Shop by skin concern</Link>
            </Button>
          </div>
        </div>
      </article>

      {more.length > 0 ? (
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-display text-[22px] tracking-[-0.01em]">
            More from the journal
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {more.map((other) => (
              <PostCard key={other.slug} post={other} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
