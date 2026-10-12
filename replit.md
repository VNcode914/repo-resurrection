# Running CreatorHub on Replit

CreatorHub is a client-side TanStack Start app. It stores content and tasks in this browser's local storage; it does not require an external database, API key, or authentication service.

## Install and run

```sh
bun install --frozen-lockfile
bun run dev -- --host 0.0.0.0 --port 5000
```

The Replit preview workflow runs the development server on port `5000`.

## Checks

```sh
bun run test
bun run lint
bun run build
```

Use **Settings → Download backup (JSON)** to export saved content and tasks before clearing browser data.
