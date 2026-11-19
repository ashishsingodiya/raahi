import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  lte,
  ne,
  sql,
} from "@raahi/db";
import { ride, seatRequest } from "@raahi/db/schema";

import {
  createRoutePreview,
  pointSchema,
  readRoutePreview,
  routeInput,
  routeOptions,
} from "../maps";
import {
  clearExpiredRoutes,
  corridorMeters,
  nearbyMeters,
  refreshRoute,
  requireAvailableRide,
  routeExpiry,
  timeWindow,
} from "../ride";
import {
  closestPickup,
  corridorBounds,
  distanceBetween,
  estimatedPickup,
  matchTrip,
  routeBounds,
} from "../route-matching";
import { studentProcedure } from "../trpc";

const futureDate = z.coerce
  .date()
  .refine((date) => date.getTime() > Date.now(), "Choose a future departure.");
const publishInput = z.object({
  preview: z.string().min(1).max(1_500_000),
  pickup: pointSchema,
  destinationLabel: z.string().trim().min(1).max(100),
  departure: futureDate,
  capacity: z.number().int().min(1).max(8),
  pricePaise: z.number().int().min(0).max(10_000_000),
  instructions: z.string().trim().max(500).optional(),
});
const rideId = z.uuid();
const publicFields = {
  id: ride.id,
  departure: ride.departure,
  durationSeconds: ride.durationSeconds,
  destination: ride.destination,
  destinationLabel: ride.destinationLabel,
  pickup: ride.pickup,
  vehicle: ride.vehicle,
  capacity: ride.capacity,
  reserved: ride.reserved,
  pricePaise: ride.pricePaise,
};
const routeFields = getTableColumns(ride);

export const rideRouter = {
  preview: studentProcedure
    .input(routeInput)
    .mutation(async ({ ctx, input }) => {
      const options = await routeOptions(input);
      if (!options.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No driving route was found for those points.",
        });
      return options.map(
        ({ option, durationSeconds, distanceMeters, points }) => ({
          option,
          durationSeconds,
          distanceMeters,
          points,
          preview: createRoutePreview({
            ...input,
            option,
            points,
            durationSeconds,
            userId: ctx.session.user.id,
            expiresAt: Date.now() + 30 * 60_000,
          }),
        }),
      );
    }),
  publish: studentProcedure
    .input(publishInput)
    .mutation(async ({ ctx, input }) => {
      const selected = readRoutePreview(input.preview, ctx.session.user.id);
      if (selected.vehicle === "bike" && input.capacity !== 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A bike ride can carry one rider.",
        });
      }
      if (!closestPickup(selected.points, input.pickup, corridorMeters)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a default pickup closer to the route.",
        });
      }
      const [created] = await ctx.db
        .insert(ride)
        .values({
          driverId: ctx.session.user.id,
          start: selected.start,
          destination: selected.destination,
          vehicle: selected.vehicle,
          durationSeconds: selected.durationSeconds,
          route: selected.points,
          routeOption: selected.option,
          routeExpiresAt: routeExpiry(),
          ...routeBounds(selected.points),
          pickup: input.pickup,
          destinationLabel: input.destinationLabel,
          departure: input.departure,
          capacity: input.capacity,
          pricePaise: input.pricePaise,
          instructions: input.instructions ?? null,
        })
        .returning({ id: ride.id });
      return created;
    }),
  mine: studentProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        ...publicFields,
        cancelled: ride.cancelled,
      })
      .from(ride)
      .where(eq(ride.driverId, ctx.session.user.id))
      .orderBy(desc(ride.departure))
      .limit(100),
  ),
  detail: studentProcedure.input(rideId).query(async ({ ctx, input }) => {
    await clearExpiredRoutes(ctx.db);
    const [row] = await ctx.db.select().from(ride).where(eq(ride.id, input));
    if (!row)
      throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found." });
    if (row.driverId !== ctx.session.user.id) requireAvailableRide(row);
    const active = !row.cancelled && row.departure.getTime() > Date.now();
    return {
      id: row.id,
      start: row.start,
      destination: row.destination,
      destinationLabel: row.destinationLabel,
      pickup: row.pickup,
      departure: row.departure,
      durationSeconds: row.durationSeconds,
      vehicle: row.vehicle,
      availableSeats: active ? row.capacity - row.reserved : 0,
      pricePaise: row.pricePaise,
      route: active ? await refreshRoute(ctx.db, row) : row.route,
      owner: row.driverId === ctx.session.user.id,
      upcoming: active,
      cancelled: row.cancelled,
    };
  }),
  discover: studentProcedure
    .input(
      z.object({
        pickup: pointSchema,
        dropoff: pointSchema.optional(),
        pickupTime: z.coerce.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await clearExpiredRoutes(ctx.db);
      const now = Date.now();
      const windowStart = input.pickupTime
        ? input.pickupTime.getTime() - timeWindow
        : now;
      const windowEnd = input.pickupTime
        ? input.pickupTime.getTime() + timeWindow
        : now + 24 * 60 * 60 * 1000;
      const bounds = corridorBounds(
        input.pickup,
        input.dropoff ? corridorMeters : nearbyMeters,
      );
      const destinationBounds = input.dropoff
        ? corridorBounds(input.dropoff, corridorMeters)
        : undefined;
      const candidates = await ctx.db
        .select(routeFields)
        .from(ride)
        .where(
          and(
            eq(ride.cancelled, false),
            ne(ride.driverId, ctx.session.user.id),
            gt(ride.departure, new Date(now)),
            lte(ride.departure, new Date(windowEnd)),
            sql`${ride.departure} + ${ride.durationSeconds} * interval '1 second' >= ${new Date(windowStart).toISOString()}::timestamptz`,
            sql`${ride.reserved} < ${ride.capacity}`,
            lte(ride.minLat, bounds.maxLat),
            gte(ride.maxLat, bounds.minLat),
            lte(ride.minLng, bounds.maxLng),
            gte(ride.maxLng, bounds.minLng),
            destinationBounds
              ? and(
                  lte(ride.minLat, destinationBounds.maxLat),
                  gte(ride.maxLat, destinationBounds.minLat),
                  lte(ride.minLng, destinationBounds.maxLng),
                  gte(ride.maxLng, destinationBounds.minLng),
                )
              : undefined,
          ),
        )
        .orderBy(asc(ride.departure));
      const results = [];
      for (const row of candidates) {
        const directDistance = distanceBetween(input.pickup, row.pickup);
        if (!input.dropoff && directDistance > nearbyMeters) continue;
        const route = await refreshRoute(ctx.db, row);
        const targetProgress = input.pickupTime
          ? (input.pickupTime.getTime() - row.departure.getTime()) /
            (row.durationSeconds * 1000)
          : undefined;
        const match = input.dropoff
          ? matchTrip(
              route,
              input.pickup,
              input.dropoff,
              corridorMeters,
              targetProgress,
              timeWindow / (row.durationSeconds * 1000),
            )
          : closestPickup(route, row.pickup, corridorMeters);
        if (!match) continue;
        const pickupAt = estimatedPickup(
          row.departure,
          row.durationSeconds,
          match.progress,
        );
        if (pickupAt.getTime() < windowStart || pickupAt.getTime() > windowEnd)
          continue;
        results.push({
          id: row.id,
          pickup: input.dropoff ? input.pickup : row.pickup,
          destination: row.destination,
          destinationLabel: row.destinationLabel,
          departure: row.departure,
          pickupAt,
          vehicle: row.vehicle,
          pricePaise: row.pricePaise,
          availableSeats: row.capacity - row.reserved,
          distance: input.dropoff ? match.distance : directDistance,
          timeDifference: Math.abs(
            pickupAt.getTime() - (input.pickupTime?.getTime() ?? now),
          ),
        });
      }
      return results
        .sort(
          (a, b) =>
            a.distance - b.distance || a.timeDifference - b.timeDifference,
        )
        .slice(0, 50);
    }),
  cancel: studentProcedure.input(rideId).mutation(async ({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(ride)
        .where(eq(ride.id, input))
        .for("update");
      if (row?.driverId !== ctx.session.user.id)
        throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found." });
      if (row.cancelled) return;
      requireAvailableRide(row);
      await tx
        .update(ride)
        .set({ cancelled: true, reserved: 0 })
        .where(eq(ride.id, row.id));
      await tx
        .update(seatRequest)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(seatRequest.rideId, row.id),
            sql`${seatRequest.status} in ('pending', 'accepted')`,
          ),
        );
    }),
  ),
};
