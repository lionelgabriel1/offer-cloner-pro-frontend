# Frontend/backend integration gaps

This note records gaps visible from the frontend API client. It is not a claim that the backend cannot support these features internally; confirm the current backend contract with the Manus implementation before adding UI controls.

## Existing frontend contract

The frontend currently calls:

- `POST /api/crawl-jobs` with `{ url }`.
- `GET /api/crawl-jobs/:id`.
- `GET /api/crawl-jobs/:id/pages` with pagination and an optional page status.
- `GET /api/crawl-jobs/:id/site-model`.
- `GET /api/crawl-jobs/:id/pages/:pageKey/page-model`.
- `GET /api/crawl-jobs/:id/report`.
- `GET /api/crawl-jobs/:id/artifacts?path=...`.
- `POST /api/crawl-jobs/:id/cancel`.
- `POST /api/crawl-jobs/:id/resume` with crawl option overrides as the request body (do not wrap them in `{ options }`).
- `POST /api/crawl-jobs/:id/editor-project` with `{ pageKey }` to create an owned editor project from a persisted crawl Page Model.
- `GET /api/projects/:id/editor`.
- `PUT /api/projects/:id/editor/model` with `{ model }`.

## Confirmed behaviour and remaining gaps

- Local controlled E2E has verified a real Chromium crawl across two localhost fixture pages, Page Model retrieval, `POST .../editor-project`, editor model update, report/artifact reads and persistence after restarting the API adapters. This does not validate Supabase or a deployed Hetzner API.
- The backend contract accepts crawl option overrides; the frontend currently sends only `{ url }` for new jobs. Keep advanced controls out until their UI/limits are explicitly designed.
- Synthetic quiz/form exploration is covered by backend tests and must never submit to real services. The report should continue to distinguish reached states from blocked/inaccessible steps.
- No confirmed aggregate list endpoint for all jobs/projects is exposed to the frontend; do not fabricate history or metrics.
- JSON and Markdown reports are available, but a generated ZIP/React export endpoint is not confirmed. Do not show export as complete.
- Real Supabase Auth/PostgreSQL/Storage integration and the Hetzner API URL/CORS are still unvalidated in this environment.

## Frontend behaviour

Until a contract is confirmed, the frontend should:

- show only data returned by the API;
- preserve current request and response shapes;
- report unsupported features honestly;
- avoid sending guessed fields or silently simulating success;
- keep external integrations marked as unconfigured unless the backend confirms otherwise.

## Safe interaction exploration

For public pages the user is authorized to reproduce, use only synthetic test values to discover accessible form or quiz states. Do not bypass authentication, CAPTCHA, paywalls, or security controls. Do not perform payments, actual registrations, lead submissions, or other irreversible actions.
