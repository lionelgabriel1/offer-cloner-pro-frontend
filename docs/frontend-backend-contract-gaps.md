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
- `POST /api/crawl-jobs/:id/resume` with an `options` object.
- `GET /api/projects/:id/editor`.
- `PUT /api/projects/:id/editor/model` with `{ model }`.

## Work needed to expose full-site crawl controls

1. Confirm that a new crawl follows eligible same-site internal links and returns per-page status, depth, and discovered-link counts.
2. If configurable, define and document the accepted create-job options (for example, maximum pages and maximum depth) before adding controls to the URL form. The current frontend deliberately sends only `{ url }`.
3. Define how the backend reports interaction exploration, discovered form/quiz steps, and limitations. Automated exploration must use fictitious values and must not submit real leads, make purchases, or trigger irreversible actions.
4. Define how the UI can list all jobs and projects for the current user. The current frontend has no confirmed aggregate list endpoint, so its list pages must not fabricate history or metrics.
5. Confirm export/preview capabilities and their endpoint contracts before presenting them as available actions.
6. Document authentication, authorization, pagination, rate limits, and error response formats for each new endpoint.

## Frontend behaviour

Until a contract is confirmed, the frontend should:

- show only data returned by the API;
- preserve current request and response shapes;
- report unsupported features honestly;
- avoid sending guessed fields or silently simulating success;
- keep external integrations marked as unconfigured unless the backend confirms otherwise.

## Safe interaction exploration

For public pages the user is authorized to reproduce, use only synthetic test values to discover accessible form or quiz states. Do not bypass authentication, CAPTCHA, paywalls, or security controls. Do not perform payments, actual registrations, lead submissions, or other irreversible actions.
