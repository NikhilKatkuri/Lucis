# Lucis Web

Real-time disaster intelligence front end for citizens. Next.js 16 (App Router),
React 19, TypeScript, Tailwind CSS v4, shadcn/ui.

## Running

The API must be running first — this app has no mock layer.

```bash
# 1. Backend
cd ../server
pnpm install
pnpm dev            # http://localhost:4000

# 2. Front end
cd ../web
pnpm install
pnpm dev            # http://localhost:3000
```

Copy `.env.example` to `.env.local` to point at a different API host.

### Scripts

| Script          | Purpose                                                |
| --------------- | ------------------------------------------------------ |
| `pnpm dev`      | Dev server (also stages the MapLibre worker)            |
| `pnpm build`    | Production build (also stages the MapLibre worker)     |
| `pnpm start`    | Serve the production build                              |
| `pnpm lint`     | ESLint (flat config, zero warnings enforced)            |
| `pnpm typecheck`| `tsc --noEmit`                                          |

## Architecture

```
src/
  app/          Routes. Each page is a Server Component that renders a
                static shell and hands live data to a *-view.tsx client
                component behind <ClientOnly>.
  components/
    ai/         Assistant panel
    alerts/     Alert card, severity chip, incident timeline
    analytics/  Recharts wrappers
    layout/     App shell, page shell, header
    map/        MapLibre map, controls, lazy wrapper
    navigation/ Sidebar, mobile bar, brand, socket badge
    reports/    Community report cards
    resources/  Resource cards
    shared/     Design-system primitives and states
    ui/         shadcn/ui components
    weather/    Weather card, risk indicator
  constants/    Nav model, severities, hazards, API config
  hooks/        Data hooks, geolocation, preferences, theme colours
  lib/          Formatting, geo maths, colour conversion, query keys
  providers/    Theme → Query → Socket provider stack
  services/     Typed API clients over a shared axios instance
  types/        Wire types mirroring the backend contract
```

### Rendering model

Pages are Server Components so structure, headings and metadata stream as HTML.
Live data is inherently browser-only — it arrives over WebSocket and depends on
the user's position — so it renders inside `<ClientOnly>`, which shows a skeleton
until hydration. This is deliberate: rendering live numbers on the server and
re-rendering them on the client is a guaranteed hydration mismatch, because the
values change between the two.

### Data flow

`SocketProvider` owns the socket and writes every event **straight into the
TanStack Query cache**, so all pages update without issuing a request:

| Socket event                     | Effect on the cache                                       |
| -------------------------------- | --------------------------------------------------------- |
| `risk`                           | replaces `risk.live`                                      |
| `alert`                          | upserts into `alerts.live`; drops the entry when `EXPIRED` |
| `weather`                        | updates every `weather.current`; invalidates `weather.forecast` |
| `simulation` (state)             | replaces `simulation.state`                               |
| `simulation` (tick)              | patches scenario + tick onto the cached snapshot          |
| `safe`                           | invalidates `risk`                                        |
| connect / reconnect              | invalidates everything, to catch silent server mutations   |

Polling remains only as a safety net, for state the backend changes **without**
emitting an event:

- `PATCH /api/alerts/resolve/:id` — silent, so alerts poll every 30s.
- `POST /api/simulation/reset` — silent, but reconnect always invalidates.
- `resource` and `report` events do not exist on the backend at all, so those
  queries poll. Handlers for `resource:update` and `report:new` are registered
  anyway, so the UI starts working the moment the backend emits them.

### Socket contract notes

The backend namespace is `/live` (not a path). It emits `risk`, `alert`,
`weather`, `simulation` and `safe`. Two details that are easy to get wrong:

- `simulation` carries **two** different payload shapes. The connect snapshot is
  `{ status, scenario, tick, updatedAt }`; the per-tick event is
  `{ scenario, eventType: "TICK", payload: { tick }, timestamp }`. They are told
  apart by the presence of `eventType`.
- `GeoPoint.coordinates` is GeoJSON-ordered `[longitude, latitude]`, the reverse
  of the `{ latitude, longitude }` the client sends. `lib/format.ts` converts.

## Design system

Tokens live in `src/app/globals.css` in three layers: raw `oklch()` values on
`:root`/`.dark`, colour utilities mapped in `@theme inline`, and radii, elevation
and motion in `@theme`. Components reference tokens only — no hardcoded colours,
no inline styles.

Two consequences worth knowing:

- MapLibre paint properties are set imperatively, and browsers serialise the
  `oklch()` tokens as `lab()`, which MapLibre cannot parse. `lib/color.ts`
  converts Lab (D65) → sRGB hex.
- MapLibre loads its tile worker from a module with a relative sibling import
  that Turbopack does not rewrite. `scripts/copy-maplibre-worker.mjs` stages both
  files into `public/maplibre/` on every dev and build.

## Icons

Phosphor only (`@phosphor-icons/react`), regular weight by default and `fill` for
active navigation. shadcn/ui is configured with `"iconLibrary": "phosphor"` so
generated components match. Use the `/ssr` entry point in Server Components.

## Known backend limitations

- `/api/bootstrap` and `/api/geo/safe-zone` accept `radiusKm`/`type` and ignore
  them (fixed 10 km / 25 km internally).
- `/api/analytics/live` reports `affectedDevices` and `averageLatency` as `0`, and
  its `updatedAt` is fixed at boot — it is not a sync heartbeat.
- `/api/ai/chat` returns prose in `content`, not JSON. The current provider
  echoes the request payload, so treat the text as untrusted.
- `Alert.type` and `SimulationState.scenario` are unvalidated free strings.
- The `/api/resources/nearby` `type` filter is unvalidated; an unknown value
  returns `[]` rather than a 400.

## Map tiles

Basemaps use CARTO and Esri raster endpoints, so no API key is required. For
production traffic, point the URLs in `src/lib/map-style.ts` at your own tile
server and review each provider's terms.
