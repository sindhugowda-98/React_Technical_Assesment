# SignalWatch Live Operations Dashboard

SignalWatch is a responsive React dashboard for monitoring a continuous stream of infrastructure events. It summarizes event volume and service health, plots a selected metric over time, and provides searchable status context through a filterable and sortable event table.

The project uses a simulated stream so it runs locally without a backend or credentials. Stream handling is isolated in a service and hook, incoming payloads are validated, updates are batched, and the in-memory event buffer is capped at 200 entries.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Useful commands

```bash
npm run build    # Type-check and create a production build
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint
```

## Dashboard features

- Live, paused, reconnecting, and error feed states with pause, resume, and retry controls.
- KPI cards for received events, recent event rate, warnings, and critical events.
- A live time-series chart with a metric selector and time-window filter.
- A health summary, active alerts, and a virtualized recent-events table.
- Event filtering by source, metric, and status, plus sorting by time, source, metric, value, or status.
- Validated stream data, batched UI updates, a bounded event buffer, and reconnect backoff.

## Project structure

```text
src/
  features/dashboard/       Dashboard page and dashboard-specific views
  hooks/useLiveStream.ts    Stream lifecycle, buffering, pause/resume, reconnection
  services/streamClient.ts  Simulated stream transport
  shared/errors/            Reusable error state
  shared/layout/            Header, sidebar, footer, and app shell
  shared/ui/                Reusable button, select, option, dropdown, and table
  shared/styles/            Styles grouped by shared component and feature
  types/                    Stream and connection types
  utils/                    Incoming event validation
```

The primary data source is the simulated client in `src/services/streamClient.ts`. A real WebSocket or Server-Sent Events transport can implement the same `StreamClient` interface without moving connection logic into dashboard components.
