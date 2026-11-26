import rawGeoJson from "../data/bairros-canoas.json";
import type { AddressSuggestion } from "../types/denuncia";

export interface BairroGeoFeature {
  type: "Feature";
  id?: string;
  properties: {
    name: string;
    "IBGE:GEOCODIGO"?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface BairroGeoCollection {
  type: "FeatureCollection";
  features: BairroGeoFeature[];
}

interface RawGeoJsonShape {
  features?: Array<{
    type?: string;
    id?: string;
    properties?: Record<string, unknown>;
    geometry?: {
      type?: string;
      coordinates?: unknown;
    };
  }>;
}

const CANOAS_VIEWBOX = "-51.27,-29.83,-51.11,-30.00";
export const CANOAS_CENTER: [number, number] = [-29.918, -51.182];

const polygonFeaturesCache: BairroGeoFeature[] = (() => {
  const parsed = rawGeoJson as unknown as RawGeoJsonShape;
  if (!parsed.features || !Array.isArray(parsed.features)) {
    return [];
  }

  return parsed.features.filter((f): f is BairroGeoFeature => {
    return (
      f?.type === "Feature" &&
      f?.geometry?.type === "Polygon" &&
      Array.isArray(f.geometry.coordinates) &&
      typeof f?.properties?.name === "string"
    );
  });
})();

export function getCanoasBairrosGeoJson(): BairroGeoCollection {
  return {
    type: "FeatureCollection",
    features: polygonFeaturesCache,
  };
}

export function getPolygonCentroid(coordinates: number[][][]): [number, number] {
  const outerRing = coordinates[0] ?? [];
  if (outerRing.length === 0) {
    return CANOAS_CENTER;
  }

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const x0 = outerRing[j][0];
    const y0 = outerRing[j][1];
    const x1 = outerRing[i][0];
    const y1 = outerRing[i][1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  if (Math.abs(area) < 1e-9) {
    const sumLng = outerRing.reduce((acc, pt) => acc + pt[0], 0);
    const sumLat = outerRing.reduce((acc, pt) => acc + pt[1], 0);
    return [sumLat / outerRing.length, sumLng / outerRing.length];
  }

  const factor = 1 / (3 * area);
  const lng = cx * factor;
  const lat = cy * factor;
  return [lat, lng];
}

function isPointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

export function findBairroNameByPoint(
  latitude: number,
  longitude: number
): string | null {
  for (const feature of polygonFeaturesCache) {
    const rings = feature.geometry.coordinates;
    if (rings.length === 0) continue;

    if (!isPointInRing(longitude, latitude, rings[0])) {
      continue;
    }

    let inHole = false;
    for (let h = 1; h < rings.length; h++) {
      if (isPointInRing(longitude, latitude, rings[h])) {
        inHole = true;
        break;
      }
    }

    if (!inHole) {
      return feature.properties.name;
    }
  }
  return null;
}

export function getBairroCentroidByName(nomeBairro: string): [number, number] | null {
  const normalized = nomeBairro.trim().toLowerCase();
  const match = polygonFeaturesCache.find(
    (f) => f.properties.name.trim().toLowerCase() === normalized
  );
  if (!match) return null;
  return getPolygonCentroid(match.geometry.coordinates);
}

export function getBrowserCoordinates(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(
        new Error("Seu navegador não suporta geolocalização. Digite o endereço ou clique no mapa.")
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error(
                "Permissão de localização negada. Você pode digitar o endereço ou clicar direto no mapa."
              )
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(
              new Error(
                "Localização indisponível no momento. Digite o endereço ou marque o ponto no mapa."
              )
            );
            break;
          case error.TIMEOUT:
            reject(
              new Error(
                "Tempo esgotado ao obter o GPS. Tente novamente ou digite o endereço."
              )
            );
            break;
          default:
            reject(
              new Error("Não foi possível obter sua localização atual.")
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  city?: string;
  town?: string;
  municipality?: string;
  state?: string;
}

function formatShortAddress(
  address?: NominatimAddress,
  fallbackDisplay?: string
): string {
  if (!address) {
    return fallbackDisplay ?? "";
  }

  const rua = address.road || address.pedestrian;
  const numero = address.house_number;
  const bairro = address.suburb || address.neighbourhood || address.city_district;
  const cidade = address.city || address.town || address.municipality || "Canoas";

  const parts: string[] = [];
  if (rua) {
    parts.push(numero ? `${rua}, ${numero}` : rua);
  }
  if (bairro) {
    parts.push(bairro);
  }
  if (cidade) {
    parts.push(`${cidade} - RS`);
  }

  if (parts.length === 0) {
    return fallbackDisplay ?? "";
  }

  return parts.join(" - ");
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      "accept-language": "pt-BR",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: NominatimAddress;
    };

    const formatted = formatShortAddress(data.address, data.display_name);
    return formatted || null;
  } catch {
    return null;
  }
}

export async function searchAddressInCanoas(
  query: string
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const normalizedQuery = trimmed.toLowerCase().includes("canoas")
    ? trimmed
    : `${trimmed}, Canoas, Rio Grande do Sul, Brasil`;

  const params = new URLSearchParams({
    format: "jsonv2",
    q: normalizedQuery,
    countrycodes: "br",
    viewbox: CANOAS_VIEWBOX,
    bounded: "1",
    addressdetails: "1",
    limit: "5",
    "accept-language": "pt-BR",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Não foi possível consultar o endereço no momento.");
  }

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: NominatimAddress;
  }>;

  return results
    .map((item) => ({
      displayName: item.display_name,
      shortAddress: formatShortAddress(item.address, item.display_name),
      latitude: Number(parseFloat(item.lat).toFixed(6)),
      longitude: Number(parseFloat(item.lon).toFixed(6)),
    }))
    .filter(
      (item) => !Number.isNaN(item.latitude) && !Number.isNaN(item.longitude)
    );
}
