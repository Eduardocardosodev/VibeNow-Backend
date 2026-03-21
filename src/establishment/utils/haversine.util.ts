/** Distância em km (Haversine). */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Caixa mínima (graus) que contém um círculo Haversine em torno de (lat,lng).
 * Usada para pré-filtrar no SQL antes de refinar por raio.
 */
export function approximateBoundingBoxForRadiusKm(
  latitude: number,
  longitude: number,
  radiusKm: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = radiusKm / 111;
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  const lngDelta = cosLat > 0.01 ? radiusKm / (111 * cosLat) : radiusKm / 111;
  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
  };
}
