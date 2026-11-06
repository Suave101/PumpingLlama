# Textbook and Canvas (LTI 1.3)

## How the textbook is organized

- `lib/textbook/content/` holds one file per chapter. A chapter has sections, and a section is a list of blocks:
  - `text` and `callout` (Markdown with KaTeX)
  - `choice`, `membership` and `short`: participation activities, 1 point each by default
  - `trace`: step through a DFA, 1 point for watching to the end
  - `lab`: one of the problems in `public/problems`, solved in the full workspace, 5 points by default
- The chapter order follows Jeff Erickson's *Models of Computation* notes (CC BY-NC-SA 4.0), which the book links as
  companion reading. The prose and activities are original. If you paste text from those notes into a section, that
  section has to keep his license: attribution, non-commercial use, and share-alike.
- `lib/textbook/grading.ts` scores a section. The reader uses it for instant feedback, and `/api/lti/score` uses it to
  grade on the server, so the grade Canvas receives always comes from the student's actual answers.
- Progress is stored in `localStorage`, keyed by section.

## LTI flow

| Route | Purpose |
|---|---|
| `GET /api/lti/config` | Canvas developer key JSON (paste this URL into Canvas) |
| `GET/POST /api/lti/login` | OIDC login initiation; redirects to Canvas with a signed `state` and a nonce |
| `POST /api/lti/launch` | Verifies the `id_token` against Canvas's JWKS, then opens the section (resource link) or the section picker (deep linking) |
| `GET /api/lti/jwks` | The tool's public key |
| `POST /api/lti/deep-link` | Returns the instructor's chosen sections to Canvas as graded links (each with a line item) |
| `POST /api/lti/score` | Grades a section's answers and posts the score to its line item (Assignment and Grade Services) |

Canvas shows tools in an iframe, where browsers often block third-party cookies. So the launch hands the browser a
signed session token, which is kept in `sessionStorage` and sent as a bearer token. The OIDC `state` is itself signed.
When the `lti_state` cookie does get through, it is checked as well.

## Running it

1. Copy `.env.example` to `.env.local` and fill it in (see the comments there). Without `LTI_CLIENT_ID` the site runs,
   but the Canvas routes return 503.
2. `npm run build && npm start` on any Node host (Vercel, Render, Fly, a VM). It must be served over HTTPS for Canvas.
3. Follow the steps on `/instructors` to create the developer key and install the app.

## Limits to know about

- Nonce replay protection and the access-token cache are in memory, so they apply per server instance. When you run
  more than one instance, move them to a shared store such as Redis or a KV database.
- `LTI_PRIVATE_KEY` and `LTI_SESSION_SECRET` must be set in production. The temporary values used in development
  change on every restart, which breaks open sessions and score passback.
- One Canvas platform per deployment. Supporting several institutions means keying `lib/lti/config.ts` by issuer and
  client id instead of reading single environment variables.
