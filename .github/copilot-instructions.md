# Copilot instructions for `analytics-mfe`

## Build, lint, and test commands

| Task | Command | Notes |
| --- | --- | --- |
| Install dependencies | `yarn install` | Use Yarn; the repo includes `yarn.lock` and the deploy workflow installs with Yarn. |
| Start local dev server | `yarn dev` | Runs Vite's dev server. |
| Build production assets | `yarn build` | Outputs the standalone app plus module-federation assets into `dist/`. |
| Lint the repository | `yarn lint` | Runs the flat ESLint config over the repo. |
| Preview the built micro-frontend | `yarn serve:federated` | Builds first, then serves the preview on port `5174`. |

There is currently no automated test script or test framework configured in this repository, so there is no single-test command to run.

## High-level architecture

- This repository is a small React + TypeScript + Vite micro-frontend. The main app component lives in `src/App.tsx`.
- `src/main.tsx` is the standalone browser entrypoint used by `index.html`; it mounts `App` into `#root` for local development and GitHub Pages output.
- `vite.config.ts` configures module federation with `@originjs/vite-plugin-federation`. The remote is named `analytics`, emits `remoteEntry.js`, and exposes `./AnalyticsApp` from `./src/App.tsx`.
- `bootstrap.ts` defines an imperative `mount(el: HTMLElement)` helper, but the current federation exposure points at `src/App.tsx`, not `bootstrap.ts`.
- The app is deployed as static assets via `.github/workflows/deploy.yml`, and Vite's `base` is pinned to `/analytics-mfe/` for GitHub Pages hosting.

## Key conventions

- Keep the GitHub Pages pathing intact unless deployment changes intentionally: `vite.config.ts` depends on `base: '/analytics-mfe/'`.
- Keep the federated dev and preview port aligned at `5174`; `serve:federated`, `server.port`, and `preview.port` all assume that port.
- Preserve the federation contract when changing host integration points: remote name `analytics`, exposed module key `./AnalyticsApp`, and singleton sharing for `react` and `react-dom`.
- TypeScript is configured in bundler mode with `allowImportingTsExtensions: true`, so explicit `.ts`/`.tsx` import paths are acceptable in this codebase.
- Styling is plain CSS, centered around shared custom properties in `src/index.css`, with component-specific nested rules in `src/App.css`.
