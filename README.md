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
