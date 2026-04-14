# analytics-mfe

A small React + Vite micro-frontend test app for exploring Titanic survival data.
It can run standalone in the browser and can also be exposed as a federated remote.

## Purpose

- test a simple micro-frontend setup
- expose `./AnalyticsApp` from the `analytics` remote
- provide a lightweight UI for local integration and demo work

## Install

```bash
yarn install
```

## Run

```bash
yarn dev
```

Runs the app locally on port `5174`.

## Build

```bash
yarn build
```

## Preview federated build

```bash
yarn serve:federated
```

## Notes

- Vite base path is `/analytics-mfe/` for GitHub Pages
- federation remote name is `analytics`
- exposed module is `./AnalyticsApp`



## Tipps for MFE 

Design the remote as content inside an existing product frame, not as a full
standalone app. The shell should own the global chrome, and the example app should
feel like a workspace panel dropped into it.

 1. Avoid duplicate layout chrome. Don’t render a second sidebar, top nav, or app 
shell inside the remote unless it is truly local navigation.
 2. Assume constrained space. The remote should stretch to the container 
width/height, handle smaller viewports gracefully, and avoid fixed page-level spacing
 that fights the shell.
 3. Match visual language. Reuse the shell’s spacing, typography, border radius, 
shadows, and color tokens so the transition feels native.
 4. Design for loading and failure states. The shell already has app-loading 
behavior, so the remote should also have clear empty, loading, and error states for 
its own internal data.
 5. Keep context obvious. A strong page title, short summary, and clear primary 
action help the user know what the remote is for as soon as it opens.
 6. Prefer self-contained surfaces. Cards, tables, filters, and detail panels work 
well; full-screen marketing-style layouts usually do not.
 7. Be careful with navigation. Let the shell own app switching. Inside the remote, 
keep navigation local and lightweight.
 8. Plan for isolation. CSS should not leak into the shell, and the remote should not
 assume global styles beyond the shared baseline.
 9. Keep first render fast. A shell-loaded remote feels slow quickly, so favor a 
small initial screen with progressive disclosure over a dense dashboard dump.

A good default for an example is: header + KPI row + one main table/list + one
side/detail panel or action area. That usually fits naturally inside a host shell