# Lucis backend

Real-time, anonymous, location-based disaster alerts built with Express, TypeScript, MongoDB/Mongoose, and Socket.IO.

## Run locally

```bash
pnpm install
cp .env.example .env
pnpm seed
pnpm dev
```

MongoDB is optional for a quick local run: when it is unavailable, Lucis keeps a typed in-memory runtime store and logs the fallback. Use `docker compose up --build` for the complete Mongo-backed stack.

The API is available at `http://localhost:4000`, Swagger UI at `/api/docs`, and the Socket.IO namespace is `/live`.

### Live events

Clients emit `device:register`, `device:location`, and `device:heartbeat`. The server emits `alert`, `weather`, `risk`, `resource`, `safe`, `report`, and `simulation`.

### Example location update

```bash
curl -X PATCH http://localhost:4000/api/device/location \
  -H 'content-type: application/json' \
  -d '{"deviceId":"demo-1","latitude":17.385,"longitude":78.4867,"accuracy":8,"timestamp":"2026-09-26T00:00:00.000Z"}'
```
