import { acneProneSkin } from "./acne-prone-skin";
import { beginnerEssentials } from "./beginner-essentials";
import { routineGuide } from "./routine-guide";
import type { Post } from "./types";

export type { Block, Post } from "./types";

/** Newest first — the order the listing and the home page render in. */
export const POSTS: Post[] = [routineGuide, acneProneSkin, beginnerEssentials];

/** Lookup for /blog/[slug], its metadata and the sitemap. */
export function findPost(slug: string): Post | null {
  return POSTS.find((post) => post.slug === slug) ?? null;
}
