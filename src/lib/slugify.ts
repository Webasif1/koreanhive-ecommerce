/** Product and category URL keys. Shared by the admin form and the importer so
 *  the two can never disagree about what a given name slugifies to. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
