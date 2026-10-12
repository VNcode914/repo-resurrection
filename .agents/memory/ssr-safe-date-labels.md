---
name: SSR-safe date labels
description: Keep server-rendered date text and date-based accessible names stable across server and browser locales.
---

Avoid locale-dependent formatting for date text rendered by the server and then hydrated in the browser. The server and browser produced different punctuation for the same `en-GB` date, causing hydration mismatches in visible text and calendar `aria-label` values.

**Why:** Hydration requires the server and client to produce the same initial markup, including accessible names. A browser-only header date is safe after mount; shared date labels should remain deterministic.

**How to apply:** Use a deterministic formatter for SSR-visible calendar and dashboard labels, while computing persisted schedule values from local `YYYY-MM-DD` helpers.
