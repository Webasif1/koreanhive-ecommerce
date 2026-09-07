import { notFound } from "next/navigation";

/**
 * No posts exist yet, so every slug is a miss.
 *
 * This used to render a placeholder shell and answer 200, which meant a
 * crawler could index an unlimited number of empty URLs. When the journal
 * ships, this becomes a real lookup — the 404 stays for slugs that miss.
 */
export default function BlogPostPage() {
  notFound();
}
