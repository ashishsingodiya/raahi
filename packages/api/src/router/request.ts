import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, desc, eq, or, sql } from "@raahi/db";
import { ride, seatRequest, studentProfile } from "@raahi/db/schema";

import type { Context } from "../trpc";
import { pointSchema } from "../maps";
import {
  clearExpiredRoutes,
  corridorMeters,
  refreshRoute,
  requireAvailableRide,
  timeWindow,
} from "../ride";
import { estimatedPickup, matchTrip } from "../route-matching";
import { studentProcedure } from "../trpc";

const requestFields = {
  id: seatRequest.id,
  rideId: seatRequest.rideId,
  status: seatRequest.status,
  pickup: seatRequest.pickup,
  dropoff: seatRequest.dropoff,
  pickupAt: seatRequest.pickupAt,
  directedTo: ride.destinationLabel,
  pricePaise: seatRequest.pricePaise,
  departure: ride.departure,
  driverId: ride.driverId,
  riderId: seatRequest.riderId,
};

function requestNotFound() {
  return new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
}

const tripInput = z.object({
  rideId: z.uuid(),
  pickup: pointSchema,
  dropoff: pointSchema,
  preferredPickupTime: z.coerce.date().optional(),
});

async function estimateTrip(
  db: Context["db"],
  userId: string,
  input: z.infer<typeof tripInput>,
) {
  const [current] = await db
    .select()
    .from(ride)
    .where(eq(ride.id, input.rideId));
  if (!current)
    throw new TRPCError({ code: "NOT_FOUND", message: "Ride not found." });
  requireAvailableRide(current);
  if (current.driverId === userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You cannot request a seat on your own ride.",
    });
  }
  const route = await refreshRoute(db, current);
  const duration = current.durationSeconds * 1000;
  const target = input.preferredPickupTime
    ? (input.preferredPickupTime.getTime() - current.departure.getTime()) /
      duration
    : undefined;
  const trip = matchTrip(
    route,
    input.pickup,
    input.dropoff,
    corridorMeters,
    target,
    timeWindow / duration,
  );
  if (!trip) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Choose pickup and drop-off points near the route in travel order and within your preferred time.",
    });
  }
  return {
    pickupAt: estimatedPickup(
      current.departure,
      current.durationSeconds,
      trip.progress,
    ),
  };
}

export const requestRouter = {
  estimate: studentProcedure
    .input(tripInput)
    .query(({ ctx, input }) =>
      estimateTrip(ctx.db, ctx.session.user.id, input),
    ),
  submit: studentProcedure
    .input(
      tripInput.extend({ expectedPricePaise: z.number().int().nonnegative() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { pickupAt } = await estimateTrip(
        ctx.db,
        ctx.session.user.id,
        input,
      );
      return ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(ride)
          .where(eq(ride.id, input.rideId))
          .for("update");
        if (!row)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Ride not found.",
          });
        requireAvailableRide(row);
        if (row.reserved >= row.capacity)
          throw new TRPCError({
            code: "CONFLICT",
            message: "There are no seats left.",
          });
        if (row.pricePaise !== input.expectedPricePaise)
          throw new TRPCError({
            code: "CONFLICT",
            message: "The ride price changed. Review it and try again.",
          });
        const [created] = await tx
          .insert(seatRequest)
          .values({
            rideId: row.id,
            riderId: ctx.session.user.id,
            pickup: input.pickup,
            dropoff: input.dropoff,
            pricePaise: row.pricePaise,
            pickupAt,
          })
          .onConflictDoNothing()
          .returning({ id: seatRequest.id });
        if (!created)
          throw new TRPCError({
            code: "CONFLICT",
            message: "You already have an active request on this ride.",
          });
        return created;
      });
    }),
  list: studentProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.session.user.id;
    const rows = await ctx.db
      .select(requestFields)
      .from(seatRequest)
      .innerJoin(ride, eq(seatRequest.rideId, ride.id))
      .where(
        or(
          eq(seatRequest.riderId, currentUser),
          eq(ride.driverId, currentUser),
        ),
      )
      .orderBy(desc(seatRequest.createdAt))
      .limit(100);
    return rows.map(({ driverId, riderId: _riderId, ...row }) => ({
      ...row,
      role: driverId === currentUser ? ("driver" as const) : ("rider" as const),
    }));
  }),
  detail: studentProcedure.input(z.uuid()).query(async ({ ctx, input }) => {
    await clearExpiredRoutes(ctx.db);
    const [row] = await ctx.db
      .select({
        ...requestFields,
        route: ride.route,
        instructions: ride.instructions,
        otherName: studentProfile.displayName,
        mobileNumber: sql<
          string | null
        >`case when ${seatRequest.status} = 'accepted' and not ${ride.cancelled} then ${studentProfile.mobileNumber} end`,
      })
      .from(seatRequest)
      .innerJoin(ride, eq(seatRequest.rideId, ride.id))
      .innerJoin(
        studentProfile,
        sql`${studentProfile.userId} = case when ${ride.driverId} = ${ctx.session.user.id} then ${seatRequest.riderId} else ${ride.driverId} end`,
      )
      .where(
        and(
          eq(seatRequest.id, input),
          or(
            eq(seatRequest.riderId, ctx.session.user.id),
            eq(ride.driverId, ctx.session.user.id),
          ),
        ),
      );
    if (!row) throw requestNotFound();

    const driver = row.driverId === ctx.session.user.id;
    return {
      id: row.id,
      upcoming: row.departure.getTime() > Date.now(),
      status: row.status,
      pickup: row.pickup,
      dropoff: row.dropoff,
      pickupAt: row.pickupAt,
      departure: row.departure,
      directedTo: row.directedTo,
      pricePaise: row.pricePaise,
      route: row.route,
      role: driver ? ("driver" as const) : ("rider" as const),
      otherName: row.otherName,
      ...(row.mobileNumber
        ? {
            contact: {
              mobileNumber: row.mobileNumber,
              instructions: row.instructions,
            },
          }
        : {}),
    };
  }),
  decide: studentProcedure
    .input(
      z.object({
        id: z.uuid(),
        action: z.enum(["accept", "decline", "cancel"]),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        const [lookup] = await tx
          .select({ rideId: seatRequest.rideId })
          .from(seatRequest)
          .where(eq(seatRequest.id, input.id));
        if (!lookup) throw requestNotFound();
        const [row] = await tx
          .select()
          .from(ride)
          .where(eq(ride.id, lookup.rideId))
          .for("update");
        const [request] = await tx
          .select()
          .from(seatRequest)
          .where(eq(seatRequest.id, input.id));
        if (!row || !request) throw requestNotFound();
        const driver = row.driverId === ctx.session.user.id;
        const rider = request.riderId === ctx.session.user.id;
        if (!(driver || (rider && input.action === "cancel")))
          throw requestNotFound();
        if (input.action === "cancel" && request.status === "cancelled")
          return { status: request.status };
        requireAvailableRide(row);

        if (input.action === "accept") {
          if (request.status !== "pending" || row.reserved >= row.capacity) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This request is no longer pending or the ride is full.",
            });
          }
          await tx
            .update(ride)
            .set({ reserved: sql`${ride.reserved} + 1` })
            .where(eq(ride.id, row.id));
        } else if (request.status !== "pending") {
          if (input.action !== "cancel" || request.status !== "accepted") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This request has already been decided.",
            });
          }
          await tx
            .update(ride)
            .set({ reserved: sql`${ride.reserved} - 1` })
            .where(eq(ride.id, row.id));
        }
        const status =
          input.action === "accept"
            ? "accepted"
            : input.action === "decline"
              ? "declined"
              : "cancelled";
        await tx
          .update(seatRequest)
          .set({ status })
          .where(eq(seatRequest.id, request.id));
        return { status };
      }),
    ),
};
