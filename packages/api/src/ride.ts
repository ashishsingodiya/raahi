import { TRPCError } from "@trpc/server";

import type { ride as rideTable } from "@ridemate/db/schema";
import { and, eq, isNotNull, lte } from "@ridemate/db";
import { ride } from "@ridemate/db/schema";

import type { Context } from "./trpc";
import { routeOptions } from "./maps";
import { routeBounds } from "./route-matching";

export const corridorMeters =
  Number(process.env.RIDE_ROUTE_CORRIDOR_METERS) > 0
    ? Number(process.env.RIDE_ROUTE_CORRIDOR_METERS)
    : 500;
export const timeWindow =
  (Number(process.env.RIDE_PICKUP_WINDOW_MINUTES) > 0
    ? Number(process.env.RIDE_PICKUP_WINDOW_MINUTES)
    : 30) * 60_000;
export const nearbyMeters = 2_000;
const cacheDuration = 29 * 24 * 60 * 60 * 1000;

export function routeExpiry() {
  return new Date(Date.now() + cacheDuration);
}

export function requireAvailableRide(row: typeof rideTable.$inferSelect) {
  if (row.cancelled || row.departure.getTime() <= Date.now()) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This ride is no longer available.",
    });
  }
}

export function clearExpiredRoutes(db: Context["db"]) {
  return db
    .update(ride)
    .set({ route: null })
    .where(and(lte(ride.routeExpiresAt, new Date()), isNotNull(ride.route)));
}

export async function refreshRoute(
  db: Context["db"],
  row: typeof rideTable.$inferSelect,
) {
  if (row.route && row.routeExpiresAt.getTime() > Date.now()) return row.route;
  const options = await routeOptions(row);
  const selected = options[row.routeOption];
  if (!selected)
    throw new TRPCError({
      code: "CONFLICT",
      message: "The planned route is no longer available.",
    });
  const route = selected.points;
  await db
    .update(ride)
    .set({ route, ...routeBounds(route), routeExpiresAt: routeExpiry() })
    .where(eq(ride.id, row.id));
  return route;
}
