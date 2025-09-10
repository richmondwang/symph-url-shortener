export function validateSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]{8,32}$/.test(slug);
}
