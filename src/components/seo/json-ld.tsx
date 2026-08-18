/**
 * Renders a JSON-LD block. The payload is built server-side from our own
 * database, and JSON.stringify escaping is hardened against a `</script>`
 * sequence sneaking out of any free-text field.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
