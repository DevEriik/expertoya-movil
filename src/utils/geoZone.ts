export interface Coords {
  lat: number;
  lng: number;
}

interface CoverageZone {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const COVERAGE_ZONES: CoverageZone[] = [
  {
    name: "Neuquén",
    minLat: -39.02,
    maxLat: -38.88,
    minLng: -68.2,
    maxLng: -67.98,
  },
  {
    name: "Plottier",
    minLat: -39.0,
    maxLat: -38.9,
    minLng: -68.32,
    maxLng: -68.2,
  },
  {
    name: "Cipolletti",
    minLat: -38.99,
    maxLat: -38.88,
    minLng: -68.08,
    maxLng: -67.93,
  },
];

export function getCoverageZone({ lat, lng }: Coords): string | null {
  const zone = COVERAGE_ZONES.find(
    (z) =>
      lat >= z.minLat && lat <= z.maxLat && lng >= z.minLng && lng <= z.maxLng,
  );
  return zone ? zone.name : null;
}

export function isInCoverageZone(coords: Coords): boolean {
  return getCoverageZone(coords) !== null;
}

export const COVERAGE_MESSAGE =
  "Tu ubicación parece estar fuera de la zona de cobertura (Neuquén, Plottier y Cipolletti). Podés ingresar tu dirección manual para buscar o intentar con ubicación actual.";
