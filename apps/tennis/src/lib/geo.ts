export interface Coordinates {
  lat: number;
  lng: number;
}

/** Fixed home point: Drummoyne, Sydney. All venue distances are measured from here. */
export const HOME_COORDS: Coordinates = { lat: -33.8517, lng: 151.1547 };

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Distance from home, rounded to one decimal for display. */
export function distanceFromHomeKm(venue: Coordinates): number {
  return Math.round(haversineKm(HOME_COORDS, venue) * 10) / 10;
}
