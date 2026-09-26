import type { RasterLayerSpecification, StyleSpecification } from "maplibre-gl";

/**
 * Basemap definitions.
 *
 * Raster tiles are used deliberately: they need no API token, so the app runs
 * out of the box.
 *
 * Note: CARTO's `basemaps.cartocdn.com` endpoints now answer every request with
 * a ~2 KB "API KEY REQUIRED" placeholder at HTTP 200, so they cannot be used
 * without a key. OpenStreetMap's standard layer and Esri's World Imagery are
 * both key-free. The dark variant is derived from the same OSM tiles with
 * raster paint adjustments rather than a second tile source.
 *
 * OSM's tile policy requires a valid User-Agent/Referer and forbids bulk use.
 * Point these at your own tile server before production traffic.
 */

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export type BasemapId = "light" | "dark" | "satellite";

export interface BasemapDefinition {
  id: BasemapId;
  label: string;
  tiles: string[];
  attribution: string;
  /**
   * Raster paint applied to the basemap only. Hazard polygons and markers are
   * separate layers, so the map can be darkened without inverting the data on
   * top of it.
   */
  rasterPaint: NonNullable<RasterLayerSpecification["paint"]>;
}

const OSM_TILES = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
];

/** A readable, slightly muted OSM rendering. */
type RasterPaint = NonNullable<RasterLayerSpecification["paint"]>;

const LIGHT_RASTER_PAINT: RasterPaint = {
  "raster-opacity": 1,
  "raster-saturation": -0.35,
  "raster-contrast": 0.05,
  "raster-brightness-min": 0,
  "raster-brightness-max": 1,
  "raster-fade-duration": 200,
};

/**
 * The same tiles darkened and desaturated. Using paint rather than a CSS filter
 * means only the basemap is affected — markers, the risk zone and the user
 * location keep their semantic colours.
 */
const DARK_RASTER_PAINT: RasterPaint = {
  "raster-opacity": 1,
  "raster-saturation": -0.45,
  "raster-contrast": 0.12,
  "raster-brightness-min": 0,
  "raster-brightness-max": 0.34,
  "raster-fade-duration": 200,
};

const SATELLITE_RASTER_PAINT: RasterPaint = {
  "raster-opacity": 0.88,
  "raster-saturation": -0.15,
  "raster-contrast": 0.05,
  "raster-brightness-min": 0,
  "raster-brightness-max": 0.92,
  "raster-fade-duration": 200,
};

export const BASEMAPS: Record<BasemapId, BasemapDefinition> = {
  light: {
    id: "light",
    label: "Light",
    tiles: OSM_TILES,
    attribution: OSM_ATTRIBUTION,
    rasterPaint: LIGHT_RASTER_PAINT,
  },
  dark: {
    id: "dark",
    label: "Dark",
    // Same tiles as `light`; only the raster paint differs.
    tiles: OSM_TILES,
    attribution: OSM_ATTRIBUTION,
    rasterPaint: DARK_RASTER_PAINT,
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution:
      "Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    rasterPaint: SATELLITE_RASTER_PAINT,
  },
};

/** Source/layer ids used by the map component. */
export const MAP_SOURCE_IDS = {
  basemap: "lucis-basemap",
  riskZone: "lucis-risk-zone",
  floodPolygon: "lucis-flood-polygon",
  userLocation: "lucis-user-location",
  resources: "lucis-resources",
} as const;

export const MAP_LAYER_IDS = {
  basemapRaster: "lucis-basemap-raster",
  riskZoneFill: "lucis-risk-zone-fill",
  riskZoneLine: "lucis-risk-zone-line",
  floodPolygonFill: "lucis-flood-polygon-fill",
  floodPolygonLine: "lucis-flood-polygon-line",
  userLocationHalo: "lucis-user-location-halo",
  userLocationDot: "lucis-user-location-dot",
  resourcePoints: "lucis-resource-points",
  resourceLabels: "lucis-resource-labels",
  riskPulseFill: "lucis-risk-pulse-fill",
  riskPulseLine: "lucis-risk-pulse-line",
} as const;

/** Build a complete MapLibre style from a basemap definition. */
export function createMapStyle(basemap: BasemapDefinition): StyleSpecification {
  return {
    version: 8,
    sources: {
      [MAP_SOURCE_IDS.basemap]: {
        type: "raster",
        tiles: basemap.tiles,
        tileSize: 256,
        attribution: basemap.attribution,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: MAP_LAYER_IDS.basemapRaster,
        type: "raster",
        source: MAP_SOURCE_IDS.basemap,
        minzoom: 0,
        maxzoom: 22,
        paint: basemap.rasterPaint,
      },
    ],
  };
}
