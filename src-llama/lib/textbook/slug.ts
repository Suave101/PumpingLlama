// Anchor id for a definition or theorem title, e.g. "Context-free grammar" -> "context-free-grammar"
export const termSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
