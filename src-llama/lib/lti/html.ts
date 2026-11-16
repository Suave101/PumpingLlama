// Tiny HTML pages the LTI endpoints return: an auto-submitting form, or a hand-off into the app

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// JSON that is safe to place inside an inline <script>
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

const page = (body: string) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Pumping Llama</title></head>` +
      `<body style="background:#0e0f12;color:#e9eaec;font-family:sans-serif">${body}</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );

export function autoPostPage(action: string, fields: Record<string, string>): Response {
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join('');
  return page(
    `<form id="f" method="post" action="${escapeHtml(action)}">${inputs}<noscript><button>Continue</button></noscript></form>` +
      `<script>document.getElementById('f').submit()</script>`
  );
}

// Must match LTI_STORAGE_KEY in lib/lti/client.ts
const STORAGE_KEY = 'pumping-llama:lti';

export function handOffPage(clientSession: unknown, path: string): Response {
  return page(
    `<p>Opening Pumping Llama…</p><script>` +
      `try{sessionStorage.setItem(${scriptJson(STORAGE_KEY)},${scriptJson(JSON.stringify(clientSession))})}catch(e){}` +
      `location.replace(${scriptJson(path)})</script>`
  );
}

export function errorPage(status: number, message: string, title = 'Canvas launch failed'): Response {
  const res = page(`<h1 style="font-size:18px">${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>`);
  return new Response(res.body, { status, headers: res.headers });
}
