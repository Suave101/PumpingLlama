// Template tag for section text: keeps backslashes for KaTeX (like String.raw)
// and turns \` into a plain backtick so Markdown inline code still works
export const md = (strings: TemplateStringsArray, ...values: unknown[]) =>
  String.raw(strings, ...values).replace(/\\`/g, '`');
