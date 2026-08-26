/**
 * JSON.stringify does NOT escape `<`, so embedding it verbatim into a
 * `<script type="application/ld+json">` via dangerouslySetInnerHTML is
 * exploitable whenever any field in the payload holds user-controlled
 * text (e.g. a tournament title/description an organizer set): a value
 * containing a literal `</script>` breaks out of the script element —
 * the HTML parser closes it early — and whatever follows in that value
 * (e.g. `<script>...</script>`) becomes a real, executing script tag.
 * This is a stored XSS on every visitor to that page, not just the
 * organizer's own browser.
 *
 * Escaping `<` (and `>`/`&` for the same class of tag-breakout risk in
 * the surrounding HTML) as unicode escapes neutralizes this while
 * producing byte-identical JSON semantics — `<` parses to the same
 * `<` character once the JSON is read back.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
