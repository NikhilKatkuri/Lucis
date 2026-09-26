import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttpModule from "pino-http";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
import { validate } from "./middleware/validate.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { logger } from "./utils/logger.js";
import { ensureDemoData, state } from "./modules/state.js";
import {
  registerDevice,
  setPreferences,
  updateLocation,
} from "./modules/device/device.service.js";
import {
  activeAlerts,
  resolveAlert,
  testAlert,
} from "./modules/alerts/alerts.service.js";
import {
  nearbyReports,
  nearbyRisk,
  safeZone,
} from "./modules/geo/geo.service.js";
import {
  nearbyResources,
  resourceCategories,
} from "./modules/resources/resources.service.js";
import {
  createReport,
  liveReports,
} from "./modules/reports/reports.service.js";
import { calculateRisk, liveRisk } from "./modules/risk/risk.service.js";
import {
  forecastWeather,
  nearestWeather,
} from "./modules/weather/weather.service.js";
import { analytics } from "./modules/analytics/analytics.service.js";
import { bootstrap } from "./modules/bootstrap/bootstrap.service.js";
import {
  resetSimulation,
  setSimulationStatus,
  simulationState,
  startSimulation,
} from "./modules/simulation/simulation.service.js";
import { buildContext } from "./modules/ai/context.service.js";
import { providerManager } from "./modules/ai/provider.manager.js";
import { env } from "./config/env.js";
import type { Coordinates, ResourceType } from "./types/index.js";

const coordinates = z.object({
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
});
const coordinateQuery = z.object({
  query: coordinates.extend({
    radiusKm: z.coerce
      .number()
      .positive()
      .max(100)
      .default(env.DEFAULT_RADIUS_KM),
    type: z.string().optional(),
  }),
  body: z.unknown().optional(),
  params: z.unknown().optional(),
});
const body = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    body: schema,
    query: z.unknown().optional(),
    params: z.unknown().optional(),
  });
const deviceLocation = z.object({
  deviceId: z.string().min(1),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  accuracy: z.number().nonnegative(),
  speed: z.number().nonnegative().optional(),
  heading: z.number().gte(0).lte(360).optional(),
  battery: z.number().gte(0).lte(100).optional(),
  timestamp: z.coerce.date(),
});

export function createApp() {
  ensureDemoData();
  const app = express();
  const pinoHttp = pinoHttpModule as unknown as (options: {
    logger: typeof logger;
  }) => express.RequestHandler;
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "64kb" }));
  app.use(pinoHttp({ logger }));
  app.get("/health", (_request, response) =>
    response.json({ ok: true, service: "lucis-api", time: new Date() }),
  );

  app.post(
    "/api/device/register",
    validate(
      body(
        z.object({
          deviceId: z.string().min(1),
          language: z.string().min(2).default("en"),
          appVersion: z.string().optional(),
        }),
      ),
    ),
    (request, response) =>
      response.status(201).json(registerDevice(request.body)),
  );
  app.patch(
    "/api/device/location",
    validate(body(deviceLocation)),
    (request, response) => response.json(updateLocation(request.body)),
  );
  app.patch(
    "/api/device/preferences",
    validate(
      body(
        z.object({
          deviceId: z.string().min(1),
          notificationEnabled: z.boolean().optional(),
          language: z.string().optional(),
        }),
      ),
    ),
    (request, response) => {
      const { deviceId, ...preferences } = request.body;
      response.json(setPreferences(deviceId, preferences));
    },
  );
  app.get(
    "/api/device/bootstrap",
    validate(coordinateQuery),
    (request, response) =>
      response.json(bootstrap(request.query as unknown as Coordinates)),
  );
  app.get("/api/bootstrap", validate(coordinateQuery), (request, response) =>
    response.json(bootstrap(request.query as unknown as Coordinates)),
  );

  app.get("/api/risk/live", (_request, response) => response.json(liveRisk()));
  app.get("/api/risk/zones", (_request, response) => response.json(liveRisk()));
  app.get("/api/alerts/live", (_request, response) =>
    response.json(activeAlerts()),
  );
  app.get("/api/alerts/history", (_request, response) =>
    response.json([...state.alerts.values()]),
  );
  app.post("/api/alerts/test", (_request, response) =>
    response.status(201).json(testAlert()),
  );
  app.patch("/api/alerts/resolve/:id", (request, response) => {
    const alert = resolveAlert(request.params.id);
    if (!alert) return response.status(404).json({ error: "Alert not found" });
    return response.json(alert);
  });

  app.get(
    "/api/weather/current",
    validate(coordinateQuery),
    (request, response) =>
      response.json(
        nearestWeather(request.query as unknown as Coordinates) ?? null,
      ),
  );
  app.get(
    "/api/weather/forecast",
    validate(coordinateQuery),
    (request, response) =>
      response.json(forecastWeather(request.query as unknown as Coordinates)),
  );
  app.get("/api/resources/categories", (_request, response) =>
    response.json(resourceCategories()),
  );
  app.get(
    "/api/resources/nearby",
    validate(coordinateQuery),
    (request, response) => {
      const query = request.query as unknown as Coordinates & {
        radiusKm: number;
        type?: string;
      };
      response.json(
        nearbyResources(
          query,
          query.radiusKm,
          query.type as ResourceType | undefined,
        ),
      );
    },
  );
  app.get(
    "/api/geo/nearby-resources",
    validate(coordinateQuery),
    (request, response) => {
      const query = request.query as unknown as Coordinates & {
        radiusKm: number;
        type?: string;
      };
      response.json(
        nearbyResources(
          query,
          query.radiusKm,
          query.type as ResourceType | undefined,
        ),
      );
    },
  );
  app.get(
    "/api/geo/nearby-risk",
    validate(coordinateQuery),
    (request, response) => {
      const query = request.query as unknown as Coordinates & {
        radiusKm: number;
      };
      response.json(nearbyRisk(query, query.radiusKm));
    },
  );
  app.get(
    "/api/geo/nearby-reports",
    validate(coordinateQuery),
    (request, response) => {
      const query = request.query as unknown as Coordinates & {
        radiusKm: number;
      };
      response.json(nearbyReports(query, query.radiusKm));
    },
  );
  app.get(
    "/api/geo/safe-zone",
    validate(coordinateQuery),
    (request, response) =>
      response.json(safeZone(request.query as unknown as Coordinates) ?? null),
  );

  app.post(
    "/api/reports",
    validate(
      body(
        z.object({
          deviceId: z.string().min(1),
          location: coordinates,
          message: z.string().min(3).max(500),
        }),
      ),
    ),
    (request, response) =>
      response.status(201).json(createReport(request.body)),
  );
  app.get("/api/reports/live", (_request, response) =>
    response.json(liveReports()),
  );
  app.get("/api/analytics/live", (_request, response) =>
    response.json(analytics()),
  );

  app.post("/api/simulation/start", (request, response) =>
    response.json(startSimulation(request.body?.scenario)),
  );
  app.post("/api/simulation/pause", (_request, response) =>
    response.json(setSimulationStatus("PAUSED")),
  );
  app.post("/api/simulation/resume", (_request, response) =>
    response.json(setSimulationStatus("RUNNING")),
  );
  app.post("/api/simulation/reset", (_request, response) =>
    response.json(resetSimulation()),
  );
  app.post("/api/simulation/scenario", (request, response) =>
    response.json(startSimulation(request.body?.scenario)),
  );
  app.get("/api/simulation/state", (_request, response) =>
    response.json(simulationState()),
  );

  app.post(
    "/api/ai/context",
    validate(
      body(
        z.object({
          location: coordinates,
          radiusKm: z.number().positive().max(100).optional(),
        }),
      ),
    ),
    (request, response) =>
      response.json(buildContext(request.body.location, request.body.radiusKm)),
  );
  app.post(
    "/api/ai/chat",
    validate(
      body(
        z.object({
          location: coordinates.optional(),
          message: z.string().min(1).max(4000),
          radiusKm: z.number().positive().max(100).optional(),
        }),
      ),
    ),
    async (request, response, next) => {
      try {
        const context = request.body.location
          ? buildContext(request.body.location, request.body.radiusKm)
          : undefined;
        const result = await providerManager.chat([
          {
            role: "system",
            content:
              "You are Lucis, an emergency context assistant. Answer only from the supplied JSON context.",
          },
          {
            role: "user",
            content: JSON.stringify({ message: request.body.message, context }),
          },
        ]);
        response.json(result);
      } catch (error) {
        next(error);
      }
    },
  );
  app.get("/api/ai/providers", (_request, response) =>
    response.json(providerManager.list()),
  );
  app.patch("/api/ai/provider", (_request, response) =>
    response
      .status(501)
      .json({
        error:
          "Provider order is configured with AI_PRIMARY_PROVIDER and AI_FALLBACK_PROVIDERS",
      }),
  );

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Lucis API",
        version: "1.0.0",
        description: "Real-time location-based disaster alerts",
      },
      servers: [{ url: "/" }],
    },
    apis: [],
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
