import type { MapPoint } from "@raahi/db/schema";

const METERS_PER_DEGREE = 111_195;

function distanceToSegment(point: MapPoint, start: MapPoint, end: MapPoint) {
  const scale = Math.cos((point.latitude * Math.PI) / 180) * METERS_PER_DEGREE;
  const startX = (start.longitude - point.longitude) * scale;
  const startY = (start.latitude - point.latitude) * METERS_PER_DEGREE;
  const dx = (end.longitude - start.longitude) * scale;
  const dy = (end.latitude - start.latitude) * METERS_PER_DEGREE;
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared
    ? Math.max(0, Math.min(1, -(startX * dx + startY * dy) / lengthSquared))
    : 0;
  return {
    fraction,
    distance: Math.hypot(startX + fraction * dx, startY + fraction * dy),
  };
}

export function distanceBetween(a: MapPoint, b: MapPoint) {
  const radians = Math.PI / 180;
  const lat = (b.latitude - a.latitude) * radians;
  const lng = (b.longitude - a.longitude) * radians;
  const haversine =
    Math.sin(lat / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(lng / 2) ** 2;
  return 12_742_000 * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function projections(point: MapPoint, route: MapPoint[], limit: number) {
  const matches: { distance: number; progress: number; segment: number }[] = [];
  let length = 0;
  for (let i = 1; i < route.length; i++) {
    const start = route[i - 1];
    const end = route[i];
    if (!start || !end) continue;
    const segmentLength = distanceBetween(start, end);
    const projection = distanceToSegment(point, start, end);
    if (segmentLength > 0 && projection.distance <= limit) {
      matches.push({
        distance: projection.distance,
        progress: length + projection.fraction * segmentLength,
        segment: i,
      });
    }
    length += segmentLength;
  }

  return length > 0
    ? matches.map((match) => ({ ...match, progress: match.progress / length }))
    : [];
}

export function closestPickup(
  route: MapPoint[],
  pickup: MapPoint,
  limit: number,
) {
  return projections(pickup, route, limit).reduce<
    { distance: number; progress: number } | undefined
  >(
    (best, match) => (!best || match.distance < best.distance ? match : best),
    undefined,
  );
}

export function matchTrip(
  route: MapPoint[],
  pickup: MapPoint,
  dropoff: MapPoint,
  limit: number,
  targetProgress?: number,
  progressWindow = Infinity,
) {
  if (distanceBetween(pickup, dropoff) < 1) return undefined;
  const pickupMatches = projections(pickup, route, limit);
  const dropoffMatches = projections(dropoff, route, limit);
  // Only closest approaches at each pass count. Segment endpoints within the
  // corridor could otherwise make a reversed pair appear to be in travel order.
  const localMinima = (matches: typeof pickupMatches) =>
    matches.filter((match, i) => {
      const previous = matches[i - 1];
      const next = matches[i + 1];
      return (
        (!previous ||
          previous.segment < match.segment - 1 ||
          previous.distance >= match.distance) &&
        (!next ||
          next.segment > match.segment + 1 ||
          next.distance >= match.distance)
      );
    });
  const dropoffs = localMinima(dropoffMatches);
  const lastDropoff = dropoffs.at(-1);
  if (!lastDropoff) return undefined;
  const possiblePickups = localMinima(pickupMatches).filter(
    (match) =>
      match.progress < lastDropoff.progress &&
      (targetProgress === undefined ||
        Math.abs(match.progress - targetProgress) <= progressWindow),
  );
  return possiblePickups.sort(
    (a, b) =>
      a.distance - b.distance ||
      (targetProgress === undefined
        ? a.progress - b.progress
        : Math.abs(a.progress - targetProgress) -
          Math.abs(b.progress - targetProgress)),
  )[0];
}

export function estimatedPickup(
  departure: Date,
  durationSeconds: number,
  progress: number,
) {
  return new Date(departure.getTime() + durationSeconds * 1000 * progress);
}

export function routeBounds(points: MapPoint[]) {
  const first = points[0];
  if (!first) throw new Error("A route requires points.");
  return points.reduce(
    (bounds, point) => ({
      minLat: Math.min(bounds.minLat, point.latitude),
      maxLat: Math.max(bounds.maxLat, point.latitude),
      minLng: Math.min(bounds.minLng, point.longitude),
      maxLng: Math.max(bounds.maxLng, point.longitude),
    }),
    {
      minLat: first.latitude,
      maxLat: first.latitude,
      minLng: first.longitude,
      maxLng: first.longitude,
    },
  );
}

export function corridorBounds(point: MapPoint, meters: number) {
  const latPadding = meters / METERS_PER_DEGREE;
  const lngPadding =
    latPadding / Math.max(0.01, Math.cos((point.latitude * Math.PI) / 180));
  return {
    minLat: point.latitude - latPadding,
    maxLat: point.latitude + latPadding,
    minLng: point.longitude - lngPadding,
    maxLng: point.longitude + lngPadding,
  };
}
