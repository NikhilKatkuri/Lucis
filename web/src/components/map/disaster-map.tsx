"use client";

import {
  AttributionControl,
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * MapLibre spawns its tile worker from a separate module, which bundlers do not
 * rewrite automatically. `scripts/copy-maplibre-worker.mjs` stages the worker
 * and its relative imports into `public/maplibre/` on every dev and build, so
 * the sibling import resolves. See that script for the full explanation.
 */
const WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

let workerConfigured = false;
function configureWorker() {
  if (workerConfigured || typeof window === "undefined") return;
  workerConfigured = true;
  setWorkerUrl(WORKER_URL);
}

import { MapControls, MapLegend } from "@/components/map/map-controls";
import { SkeletonMap } from "@/components/shared/skeleton";
import { useMapThemeColors } from "@/hooks/use-map-theme-colors";
import { useEffectiveCoordinates } from "@/hooks/use-user-location";
import { RESOURCE_TYPE_LABEL } from "@/constants/app";
import { fromGeoPoint } from "@/lib/format";
import {
  BASEMAPS,
  MAP_LAYER_IDS,
  MAP_SOURCE_IDS,
  createMapStyle,
  type BasemapId,
} from "@/lib/map-style";
import type { Alert, Resource, RiskZone, WeatherSnapshot } from "@/types/api";
import { cn } from "@/lib/utils";

const INITIAL_ZOOM = 11;

const EMPTY_POINT = { type: "FeatureCollection" as const, features: [] };
const EMPTY_POLYGON = { type: "FeatureCollection" as const, features: [] };

export interface DisasterMapProps {
  risk?: RiskZone | null;
  resources?: Resource[];
  alerts?: Alert[];
  weather?: WeatherSnapshot | null;
  /** `full` fills its container (the /map page); `panel` uses a fixed height. */
  variant?: "panel" | "full";
  className?: string;
  hideControls?: boolean;
  onResourceSelect?: (resource: Resource) => void;
}

/**
 * The interactive hazard map.
 *
 * Draws the user's position, an animated danger radius around the active risk
 * zone, a flood-extent polygon, resource markers and a weather overlay. All
 * colours come from the design tokens via `useMapThemeColors`, so the map
 * follows light/dark mode without duplicating palette values.
 */
export function DisasterMap({
  risk = null,
  resources = [],
  alerts = [],
  weather = null,
  variant = "panel",
  className,
  hideControls = false,
  onResourceSelect,
}: DisasterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hasFitted = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [basemap, setBasemap] = useState<BasemapId>("light");
  const [showResources, setShowResources] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [basemapPinned, setBasemapPinned] = useState(false);

  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const { coordinates } = useEffectiveCoordinates();
  const colors = useMapThemeColors();

  // Follow the app theme until the user picks a basemap explicitly. Derived
  // during render rather than synced in an effect, to avoid a cascading render.
  const themeBasemap: BasemapId = resolvedTheme === "dark" ? "dark" : "light";
  const activeBasemap = basemapPinned ? basemap : themeBasemap;

  const handleBasemapChange = useCallback((next: BasemapId) => {
    setBasemapPinned(true);
    setBasemap(next);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Init once                                                               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    configureWorker();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: createMapStyle(BASEMAPS.light),
      center: [coordinates.longitude, coordinates.latitude],
      zoom: INITIAL_ZOOM,
      attributionControl: false,
      dragRotate: false,
    });

    mapRef.current = map;

    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      addDataSources(map);
      addDataLayers(map, colors);

      map.on("mouseenter", MAP_LAYER_IDS.resourcePoints, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MAP_LAYER_IDS.resourcePoints, () => {
        map.getCanvas().style.cursor = "";
      });

      setIsReady(true);
    });

    /*
     * MapLibre sizes its canvas once at construction. This map lives in a
     * responsive grid, so the container changes height as the layout reflows
     * (sidebar breakpoint, rotation, panel resize). Without this the canvas
     * keeps a stale size and the map appears cropped or blank.
     */
    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      hasFitted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Marker selection                                                        */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const handleClick = (event: { features?: unknown }) => {
      const features = event.features as
        | { properties?: { id?: string } }[]
        | undefined;
      const id = features?.[0]?.properties?.id;
      if (!id) return;

      const match = resources.find((item) => item.id === id);
      if (match) onResourceSelect?.(match);
    };

    map.on("click", MAP_LAYER_IDS.resourcePoints, handleClick);
    return () => {
      map.off("click", MAP_LAYER_IDS.resourcePoints, handleClick);
    };
  }, [isReady, resources, onResourceSelect]);

  /* ---------------------------------------------------------------------- */
  /* Repaint data layers when the theme changes                               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    addDataLayers(map, colors);
  }, [colors, isReady]);

  /* ---------------------------------------------------------------------- */
  /* Basemap switching                                                        */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const definition = BASEMAPS[activeBasemap];
    const source = map.getSource(MAP_SOURCE_IDS.basemap) as
      | (GeoJSONSource & { setTiles?: (tiles: string[]) => void })
      | undefined;

    // Swapping tiles in place preserves our data layers; only fall back to a
    // full restyle if the raster source is unavailable.
    if (source?.setTiles) {
      source.setTiles(definition.tiles);
    } else {
      map.setStyle(createMapStyle(definition));
    }

    // Light and dark share one tile source and differ only in raster paint, so
    // the basemap can be re-toned without touching the layers above it.
    if (map.getLayer(MAP_LAYER_IDS.basemapRaster)) {
      const paint = definition.rasterPaint;

      for (const property of Object.keys(paint) as (keyof typeof paint)[]) {
        map.setPaintProperty(
          MAP_LAYER_IDS.basemapRaster,
          property,
          paint[property] as never,
        );
      }
    }
  }, [activeBasemap, isReady]);

  /* ---------------------------------------------------------------------- */
  /* User position                                                            */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const source = map.getSource(MAP_SOURCE_IDS.userLocation) as
      | GeoJSONSource
      | undefined;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
          properties: { kind: "user" },
        },
        // A second feature drives the pulsing danger ring.
        ...(risk ? [pulseFeature(risk)] : []),
      ],
    });
  }, [coordinates, risk, isReady]);

  /* ---------------------------------------------------------------------- */
  /* Risk zone + flood extent                                                 */
  /* ---------------------------------------------------------------------- */

  const riskFeatures = useMemo(() => {
    if (!risk) return EMPTY_POLYGON;

    const center = fromGeoPoint(risk.center);
    const ring = circlePolygon(
      center.latitude,
      center.longitude,
      risk.radius,
      72,
    );

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon" as const, coordinates: [ring] },
          properties: { hazard: risk.hazard, score: risk.score },
        },
      ],
    };
  }, [risk]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    (map.getSource(MAP_SOURCE_IDS.riskZone) as GeoJSONSource | undefined)
      ?.setData(riskFeatures);

    if (risk && !hasFitted.current) {
      hasFitted.current = true;
      map.easeTo({
        center: [risk.center.coordinates[0], risk.center.coordinates[1]],
        zoom: 11.5,
        duration: 600,
      });
    }
  }, [riskFeatures, risk, isReady]);

  /**
   * The API exposes a radius but no GeoJSON, so the flood extent is derived
   * from the same circle with deterministic jitter, which reads as an
   * inundation boundary rather than a perfect disc.
   */
  const floodFeatures = useMemo(() => {
    const source = risk ?? alerts[0];
    if (!source) return EMPTY_POLYGON;

    const center = fromGeoPoint(source.center);
    const outer = circlePolygon(
      center.latitude,
      center.longitude,
      source.radius * 0.8,
      48,
      0.12,
    );
    const inner = circlePolygon(
      center.latitude,
      center.longitude,
      source.radius * 0.42,
      48,
      0.2,
    );

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon" as const, coordinates: [outer, inner] },
          properties: {},
        },
      ],
    };
  }, [risk, alerts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    (map.getSource(MAP_SOURCE_IDS.floodPolygon) as GeoJSONSource | undefined)
      ?.setData(floodFeatures);
  }, [floodFeatures, isReady]);

  // Weather overlay: a translucent wash whose opacity tracks rainfall.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    if (!map.getLayer(MAP_LAYER_IDS.floodPolygonFill)) return;

    const intensity = Math.min(0.45, (weather?.rainfall ?? 0) / 50);
    map.setPaintProperty(
      MAP_LAYER_IDS.floodPolygonFill,
      "fill-opacity",
      showWeather ? Math.max(0.1, intensity) : 0.2,
    );
  }, [weather, showWeather, isReady]);

  /* ---------------------------------------------------------------------- */
  /* Resource markers                                                         */
  /* ---------------------------------------------------------------------- */

  const resourceFeatures = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: resources.map((resource) => ({
        type: "Feature" as const,
        geometry: resource.location,
        properties: {
          id: resource.id,
          name: resource.name,
          type: resource.type,
          label: RESOURCE_TYPE_LABEL[resource.type] ?? resource.type,
        },
      })),
    }),
    [resources],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    (map.getSource(MAP_SOURCE_IDS.resources) as GeoJSONSource | undefined)
      ?.setData(resourceFeatures);

    const visibility = showResources ? "visible" : "none";
    for (const id of [MAP_LAYER_IDS.resourcePoints, MAP_LAYER_IDS.resourceLabels]) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visibility);
      }
    }
  }, [resourceFeatures, showResources, isReady]);

  /* ---------------------------------------------------------------------- */
  /* Danger-radius pulse animation                                           */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !risk) return;
    if (reduceMotion) return;

    const fillId = MAP_LAYER_IDS.riskPulseFill;
    const lineId = MAP_LAYER_IDS.riskPulseLine;
    if (!map.getLayer(fillId) || !map.getLayer(lineId)) return;

    const duration = 2400;
    let frame = 0;
    let start: number | null = null;

    const tick = (timestamp: number) => {
      start ??= timestamp;
      const elapsed = (timestamp - start) % duration;
      // Ease-out then fade, so the ring feels like a radar pulse.
      const progress = elapsed / duration;
      const swell = 1 - (1 - Math.min(1, progress * 1.6)) ** 2;
      const fade = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;

      map.setPaintProperty(fillId, "fill-opacity", 0.05 + swell * fade * 0.16);
      map.setPaintProperty(lineId, "line-opacity", 0.25 + fade * 0.45);

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [risk, isReady, reduceMotion]);

  /* ---------------------------------------------------------------------- */
  /* Controls                                                                 */
  /* ---------------------------------------------------------------------- */

  const recenter = useCallback(() => {
    mapRef.current?.easeTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: INITIAL_ZOOM,
      duration: 500,
    });
  }, [coordinates]);

  const zoomBy = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: 300 });
  }, []);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-muted",
        variant === "full" ? "h-full w-full" : "h-[320px] w-full sm:h-[380px]",
        className,
      )}
    >
      {/*
        The container is sized, not positioned, on purpose. MapLibre ships
        `.maplibregl-map { position: relative }` as *unlayered* CSS, and
        unlayered rules outrank Tailwind's `@layer utilities` — so an
        `absolute inset-0` here is silently overridden to `position: relative`,
        `inset-0` stops having any effect and the container collapses to zero
        height. `h-full w-full` is a size, which MapLibre does not override.
      */}
      <div ref={containerRef} className="h-full w-full" aria-hidden="true" />

      {!isReady ? <SkeletonMap className="absolute inset-0 rounded-none" /> : null}

      {/* Textual equivalent for assistive technology. */}
      <p className="sr-only" aria-live="polite">
        {risk
          ? `Map showing a ${risk.hazard.replaceAll("_", " ").toLowerCase()} risk zone with a ${Math.round(risk.radius / 1000)} kilometre radius, plus ${resources.length} nearby resources.`
          : `Map centred on your position with ${resources.length} nearby resources and no active risk zone.`}
      </p>

      {!hideControls ? (
        <MapControls
          onRecenter={recenter}
          onZoomIn={() => zoomBy(1)}
          onZoomOut={() => zoomBy(-1)}
          basemap={activeBasemap}
          onBasemapChange={handleBasemapChange}
          showResources={showResources}
          onToggleResources={() => setShowResources((value) => !value)}
          showWeather={showWeather}
          onToggleWeather={() => setShowWeather((value) => !value)}
        />
      ) : null}

      {/* Attribution comes from MapLibre's own control, which swaps the
          credits when the basemap changes. */}
      <div className="pointer-events-none absolute bottom-3 left-3">
        <div className="pointer-events-auto">
          <MapLegend />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layer construction                                                          */
/* -------------------------------------------------------------------------- */

function addDataSources(map: MapLibreMap) {
  for (const id of [
    MAP_SOURCE_IDS.riskZone,
    MAP_SOURCE_IDS.floodPolygon,
    MAP_SOURCE_IDS.userLocation,
    MAP_SOURCE_IDS.resources,
  ]) {
    if (map.getSource(id)) continue;
    map.addSource(id, { type: "geojson", data: EMPTY_POINT });
  }
}

function addDataLayers(map: MapLibreMap, colors: ReturnType<typeof useMapThemeColors>) {
  const ensure = (
    layer: Parameters<MapLibreMap["addLayer"]>[0],
    beforeId?: string,
  ) => {
    if (map.getLayer(layer.id)) return;
    if (beforeId && map.getLayer(beforeId)) map.addLayer(layer, beforeId);
    else map.addLayer(layer);
  };

  /* -- Flood extent (below everything else) -------------------------------- */
  ensure({
    id: MAP_LAYER_IDS.floodPolygonFill,
    type: "fill",
    source: MAP_SOURCE_IDS.floodPolygon,
    paint: { "fill-color": colors.floodExtent, "fill-opacity": 0.2 },
  });

  ensure({
    id: MAP_LAYER_IDS.floodPolygonLine,
    type: "line",
    source: MAP_SOURCE_IDS.floodPolygon,
    paint: {
      "line-color": colors.floodExtent,
      "line-width": 1.5,
      "line-dasharray": [2, 2],
    },
  });

  /* -- Risk zone ----------------------------------------------------------- */
  ensure({
    id: MAP_LAYER_IDS.riskZoneFill,
    type: "fill",
    source: MAP_SOURCE_IDS.riskZone,
    paint: { "fill-color": colors.riskZone, "fill-opacity": 0.16 },
  });

  ensure({
    id: MAP_LAYER_IDS.riskZoneLine,
    type: "line",
    source: MAP_SOURCE_IDS.riskZone,
    paint: {
      "line-color": colors.riskZone,
      "line-width": 2,
      "line-dasharray": [3, 2],
    },
  });

  /* -- Animated danger-radius pulse ----------------------------------------- */
  // A circle layer cannot render polygon geometry, so the pulse is a fill plus
  // an outline on the pulsing polygon, animated via `fill-opacity` below.
  ensure({
    id: MAP_LAYER_IDS.riskPulseFill,
    type: "fill",
    source: MAP_SOURCE_IDS.userLocation,
    filter: ["==", ["get", "kind"], "pulse"],
    paint: {
      "fill-color": colors.riskZone,
      "fill-opacity": 0.12,
    },
  });

  ensure({
    id: MAP_LAYER_IDS.riskPulseLine,
    type: "line",
    source: MAP_SOURCE_IDS.userLocation,
    filter: ["==", ["get", "kind"], "pulse"],
    paint: {
      "line-color": colors.riskZone,
      "line-width": 1.5,
      "line-opacity": 0.55,
      "line-dasharray": [4, 3],
    },
  });

  /* -- Resource markers ---------------------------------------------------- */
  ensure({
    id: MAP_LAYER_IDS.resourcePoints,
    type: "circle",
    source: MAP_SOURCE_IDS.resources,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4.5, 14, 8],
      "circle-color": [
        "match",
        ["get", "type"],
        "SHELTER",
        colors.shelter,
        "HOSPITAL",
        colors.hospital,
        "RESCUE_CENTER",
        colors.rescue,
        "WATER",
        colors.water,
        "FOOD",
        colors.food,
        colors.other,
      ],
      "circle-stroke-color": colors.halo,
      "circle-stroke-width": 1.5,
    },
  });

  ensure({
    id: MAP_LAYER_IDS.resourceLabels,
    type: "symbol",
    source: MAP_SOURCE_IDS.resources,
    minzoom: 12,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-offset": [0, 1.3],
      "text-anchor": "top",
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": colors.label,
      "text-halo-color": colors.labelHalo,
      "text-halo-width": 1.5,
    },
  });

  /* -- User location (always on top) --------------------------------------- */
  ensure(
    {
      id: MAP_LAYER_IDS.userLocationHalo,
      type: "circle",
      source: MAP_SOURCE_IDS.userLocation,
      filter: ["==", ["get", "kind"], "user"],
      paint: {
        "circle-radius": 11,
        "circle-color": colors.userLocation,
        "circle-opacity": 0.22,
      },
    },
    MAP_LAYER_IDS.resourceLabels,
  );

  ensure(
    {
      id: MAP_LAYER_IDS.userLocationDot,
      type: "circle",
      source: MAP_SOURCE_IDS.userLocation,
      filter: ["==", ["get", "kind"], "user"],
      paint: {
        "circle-radius": 6,
        "circle-color": colors.userLocation,
        "circle-stroke-color": colors.halo,
        "circle-stroke-width": 2.5,
      },
    },
    MAP_LAYER_IDS.resourceLabels,
  );
}

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                            */
/* -------------------------------------------------------------------------- */

/** The expanding ring feature that animates the danger radius. */
function pulseFeature(risk: RiskZone) {
  const center = fromGeoPoint(risk.center);
  const ring = circlePolygon(
    center.latitude,
    center.longitude,
    risk.radius,
    48,
  );

  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [ring] },
    properties: { kind: "pulse" },
  };
}

/**
 * Build a GeoJSON polygon ring approximating a circle.
 *
 * `irregularity` jitters each vertex deterministically, so repeated renders
 * produce a stable, natural-looking boundary instead of a perfect disc.
 */
function circlePolygon(
  latitude: number,
  longitude: number,
  radiusMetres: number,
  steps: number,
  irregularity = 0,
): number[][] {
  const earthRadius = 6_371_008.8;
  const latitudeDelta = (radiusMetres / earthRadius) * (180 / Math.PI);
  const longitudeDelta =
    (radiusMetres / (earthRadius * Math.cos((latitude * Math.PI) / 180))) *
    (180 / Math.PI);

  const ring: number[][] = [];

  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * Math.PI * 2;
    const jitter =
      irregularity === 0
        ? 1
        : 1 + Math.sin(angle * 3.7 + step) * irregularity * 0.5;

    ring.push([
      longitude + Math.cos(angle) * longitudeDelta * jitter,
      latitude + Math.sin(angle) * latitudeDelta * jitter,
    ]);
  }

  return ring;
}
