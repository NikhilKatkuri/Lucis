"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";

import { SOCKET_EVENTS, SOCKET_PATH, SOCKET_URL } from "@/constants/app";
import { queryKeys } from "@/lib/query-keys";
import type {
  Alert,
  Resource,
  RiskZone,
  SafePayload,
  SimulationEvent,
  SimulationState,
  SimulationTickEvent,
  WeatherSnapshot,
} from "@/types/api";
import { isSimulationTick } from "@/lib/socket-events";

/* -------------------------------------------------------------------------- */
/* Connection state                                                            */
/* -------------------------------------------------------------------------- */

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface SocketContextValue {
  status: ConnectionStatus;
  isConnected: boolean;
  /** Latest risk zone pushed by the server, if any. */
  risk: RiskZone | null;
  /** Alerts keyed by id, in arrival order. */
  alerts: Record<string, Alert>;
  weather: WeatherSnapshot | null;
  simulation: SimulationState | null;
  /** Monotonic tick count while the simulation runs. */
  simulationTick: number;
  safeMessage: SafePayload | null;
  /** ISO timestamp of the most recent event of any kind. */
  lastEventAt: string | null;
  /** Pushed resources / reports, if the backend ever starts emitting them. */
  resources: Resource[];
  reports: unknown[];
  dismissSafeMessage: () => void;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside <SocketProvider>.");
  }
  return context;
}

/** Narrow accessor for components that only need the live badge. */
export function useSocketStatus(): Pick<
  SocketContextValue,
  "status" | "isConnected" | "simulation"
> {
  const { status, isConnected, simulation } = useSocket();
  return { status, isConnected, simulation };
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                    */
/* -------------------------------------------------------------------------- */

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [risk, setRisk] = useState<RiskZone | null>(null);
  const [alerts, setAlerts] = useState<Record<string, Alert>>({});
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [simulationTick, setSimulationTick] = useState(0);
  const [safeMessage, setSafeMessage] = useState<SafePayload | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reports, setReports] = useState<unknown[]>([]);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  const markEvent = useCallback(() => {
    setLastEventAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      // Mirror the server's own ordering: try websocket first, then polling.
      transports: ["websocket", "polling"],
      // engine.io-client v6 negotiates the heartbeat from the server handshake,
      // so pingInterval/pingTimeout are server-controlled and not set here.
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      // Connection attempt timeout.
      timeout: 20_000,
      // The server sends `origin: "*"` without credentials.
      withCredentials: false,
      autoConnect: true,
    });

    socketRef.current = socket;

    /* ---------------------------------------------------------------- */
    /* Connection lifecycle                                              */
    /* ---------------------------------------------------------------- */

    /**
     * Server state can change while the socket is down — a simulation reset
     * clears every risk zone and alert without emitting anything, for example.
     * Refetching on connect guarantees the caches are truthful again.
     */
    const catchUp = () => {
      void queryClient.invalidateQueries();
    };

    socket.on("connect", () => {
      setStatus("connected");
      catchUp();
    });

    socket.on("disconnect", () => setStatus("disconnected"));

    socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));
    socket.io.on("reconnect", () => {
      setStatus("connected");
      catchUp();
    });
    socket.io.on("error", () => setStatus("disconnected"));

    /* ---------------------------------------------------------------- */
    /* Alerts — the same payload arrives for create, update and expiry.   */
    /* Last write wins, keyed by id, which is also the risk zone id.       */
    /* ---------------------------------------------------------------- */

    const handleAlert = (alert: Alert) => {
      setAlerts((previous) => {
        const next = { ...previous, [alert.id]: alert };
        // Keep the store bounded; the server prunes expired alerts anyway.
        const ids = Object.keys(next);
        if (ids.length > 50) {
          const oldest = ids.slice(0, ids.length - 50);
          for (const id of oldest) delete next[id];
        }
        return next;
      });

      // Mirror the push into the query cache so every consumer of
      // `/api/alerts/live` updates without refetching.
      queryClient.setQueryData<Alert[]>(queryKeys.alerts.live(), (previous) => {
        const existing = previous ?? [];
        if (alert.status === "EXPIRED") {
          return existing.filter((item) => item.id !== alert.id);
        }
        const index = existing.findIndex((item) => item.id === alert.id);
        if (index === -1) return [alert, ...existing];
        const next = [...existing];
        next[index] = alert;
        return next;
      });

      // The alert counters on the analytics snapshot move with every push.
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.live() });

      markEvent();
    };

    socket.on(SOCKET_EVENTS.alert, handleAlert);

    /* ---------------------------------------------------------------- */
    /* Spec-named aliases. The current backend never emits these, so      */
    /* they cost nothing but make the UI work if it starts to.            */
    /* ---------------------------------------------------------------- */

    socket.on(SOCKET_EVENTS.alertNew, handleAlert);
    socket.on(SOCKET_EVENTS.alertUpdate, handleAlert);
    socket.on(SOCKET_EVENTS.alertResolved, (alert: Alert) => {
      if (alert?.status === "EXPIRED") {
        setAlerts((previous) => {
          const next = { ...previous };
          delete next[alert.id];
          return next;
        });
        queryClient.setQueryData<Alert[]>(queryKeys.alerts.live(), (previous) =>
          (previous ?? []).filter((item) => item.id !== alert.id),
        );
      } else {
        handleAlert(alert);
      }
    });

    /* ---------------------------------------------------------------- */
    /* Risk                                                              */
    /* ---------------------------------------------------------------- */

    const handleRisk = (zone: RiskZone) => {
      setRisk(zone);
      // The live risk endpoint returns a single-element array.
      queryClient.setQueryData(queryKeys.risk.live(), [zone]);
      markEvent();
    };

    socket.on(SOCKET_EVENTS.risk, handleRisk);
    socket.on(SOCKET_EVENTS.riskUpdate, handleRisk);

    /* ---------------------------------------------------------------- */
    /* Weather                                                          */
    /* ---------------------------------------------------------------- */

    const handleWeather = (snapshot: WeatherSnapshot) => {
      setWeather(snapshot);
      markEvent();
    };

    /** Write a push into every cached "current weather" entry, whatever the coordinates. */
    const syncWeatherCache = (snapshot: WeatherSnapshot) => {
      // The endpoint returns the globally nearest observation, so a push is
      // authoritative for every cached coordinate pair.
      queryClient.setQueriesData<WeatherSnapshot | null>(
        { queryKey: [...queryKeys.weather.all, "current"] },
        snapshot,
      );
    };

    socket.on(SOCKET_EVENTS.weather, (snapshot: WeatherSnapshot) => {
      handleWeather(snapshot);
      syncWeatherCache(snapshot);
      // The 24-hour forecast is derived from the current observation, so a new
      // reading makes the cached projection stale.
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.weather.all, "forecast"],
      });
      // `weatherUpdates` increments on every refresh.
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.live() });
    });

    socket.on(SOCKET_EVENTS.weatherUpdate, (snapshot: WeatherSnapshot) => {
      handleWeather(snapshot);
      syncWeatherCache(snapshot);
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.weather.all, "forecast"],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.live() });
    });

    /* ---------------------------------------------------------------- */
    /* Simulation — one event name, two payload shapes. Discriminate on  */
    /* `eventType`: the state snapshot has `status`, the tick does not.    */
    /* ---------------------------------------------------------------- */

    /**
     * The backend only broadcasts a full simulation snapshot when a socket
     * connects; a scenario change made over HTTP produces no state event. Every
     * tick, however, carries the current scenario, so the cached snapshot is
     * patched from it and the UI stays truthful without polling.
     */
    const handleSimulation = (event: SimulationEvent) => {
      if (isSimulationTick(event)) {
        const tick = event as SimulationTickEvent;
        setSimulationTick(tick.payload.tick);

        const patched: SimulationState = {
          status: "RUNNING",
          scenario: tick.scenario,
          tick: tick.payload.tick,
          updatedAt: tick.timestamp,
        };

        queryClient.setQueryData<SimulationState>(
          queryKeys.simulation.state(),
          (previous) => (previous ? { ...previous, ...patched } : previous),
        );

        // Keep the badge and sidebar in step with the cache.
        setSimulation((previous) => (previous ? { ...previous, ...patched } : previous));
      } else {
        const state = event as SimulationState;
        setSimulation(state);
        setSimulationTick(state.tick);
        queryClient.setQueryData(queryKeys.simulation.state(), state);
      }
      markEvent();
    };

    socket.on(SOCKET_EVENTS.simulation, handleSimulation);
    socket.on(SOCKET_EVENTS.simulationEvent, handleSimulation);

    /* ---------------------------------------------------------------- */
    /* Forward-compatible channels                                        */
    /* ---------------------------------------------------------------- */

    socket.on(SOCKET_EVENTS.resourceUpdate, (payload: Resource[] | Resource) => {
      setResources((previous) => {
        const incoming = Array.isArray(payload) ? payload : [payload];
        const byId = new Map(previous.map((item) => [item.id, item]));
        for (const item of incoming) byId.set(item.id, item);
        return [...byId.values()];
      });
      // Resources and the derived safe zone both change together.
      void queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
      markEvent();
    });

    socket.on(SOCKET_EVENTS.reportNew, (payload: unknown) => {
      setReports((previous) => [payload, ...previous].slice(0, 100));
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.live() });
      markEvent();
    });

    /* ---------------------------------------------------------------- */
    /* Targeted "you are outside the risk zone" message                   */
    /* ---------------------------------------------------------------- */

    socket.on(SOCKET_EVENTS.safe, (payload: SafePayload) => {
      setSafeMessage(payload);
      // Safety is derived from the risk zones around the device, so re-read it.
      void queryClient.invalidateQueries({ queryKey: queryKeys.risk.all });
      markEvent();
    });

    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [markEvent, queryClient]);

  const dismissSafeMessage = useCallback(() => setSafeMessage(null), []);

  const connect = useCallback(() => {
    setStatus("connecting");
    socketRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({
      status,
      isConnected: status === "connected",
      risk,
      alerts,
      weather,
      simulation,
      simulationTick,
      safeMessage,
      lastEventAt,
      resources,
      reports,
      dismissSafeMessage,
      connect,
      disconnect,
    }),
    [
      status,
      risk,
      alerts,
      weather,
      simulation,
      simulationTick,
      safeMessage,
      lastEventAt,
      resources,
      reports,
      dismissSafeMessage,
      connect,
      disconnect,
    ],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
