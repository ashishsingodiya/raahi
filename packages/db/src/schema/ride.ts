import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { studentProfile } from "./student";

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export const vehicleType = pgEnum("vehicle_type", ["bike", "car"]);
export const requestStatus = pgEnum("ride_request_status", [
  "pending",
  "accepted",
  "declined",
  "cancelled",
]);

export const ride = pgTable(
  "ride",
  {
    id: uuid().defaultRandom().primaryKey(),
    driverId: text()
      .notNull()
      .references(() => studentProfile.userId, { onDelete: "cascade" }),
    start: jsonb().$type<MapPoint>().notNull(),
    destination: jsonb().$type<MapPoint>().notNull(),
    destinationLabel: text().notNull(),
    pickup: jsonb().$type<MapPoint>().notNull(),
    departure: timestamp({ withTimezone: true }).notNull(),
    durationSeconds: integer().notNull(),
    vehicle: vehicleType().notNull(),
    capacity: integer().notNull(),
    reserved: integer().default(0).notNull(),
    pricePaise: integer().default(0).notNull(),
    instructions: text(),
    cancelled: boolean().default(false).notNull(),
    route: jsonb().$type<MapPoint[]>(),
    routeExpiresAt: timestamp({ withTimezone: true }).notNull(),
    routeOption: integer().notNull(),
    minLat: doublePrecision().notNull(),
    maxLat: doublePrecision().notNull(),
    minLng: doublePrecision().notNull(),
    maxLng: doublePrecision().notNull(),
  },
  (table) => [
    index("ride_discovery_idx").on(table.cancelled, table.departure),
    index("ride_driver_idx").on(table.driverId, table.departure),
    check(
      "ride_capacity_check",
      sql`${table.capacity} between 1 and case when ${table.vehicle} = 'bike' then 1 else 8 end`,
    ),
    check(
      "ride_reserved_check",
      sql`${table.reserved} between 0 and ${table.capacity}`,
    ),
    check("ride_price_check", sql`${table.pricePaise} >= 0`),
  ],
);

export const seatRequest = pgTable(
  "seat_request",
  {
    id: uuid().defaultRandom().primaryKey(),
    rideId: uuid()
      .notNull()
      .references(() => ride.id, { onDelete: "cascade" }),
    riderId: text()
      .notNull()
      .references(() => studentProfile.userId, { onDelete: "cascade" }),
    pickup: jsonb().$type<MapPoint>().notNull(),
    dropoff: jsonb().$type<MapPoint>().notNull(),
    pickupAt: timestamp({ withTimezone: true }).notNull(),
    pricePaise: integer().notNull(),
    status: requestStatus().default("pending").notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("seat_request_active_idx")
      .on(table.rideId, table.riderId)
      .where(sql`${table.status} in ('pending', 'accepted')`),
    index("seat_request_ride_idx").on(table.rideId),
    index("seat_request_rider_idx").on(table.riderId, table.createdAt),
  ],
);
