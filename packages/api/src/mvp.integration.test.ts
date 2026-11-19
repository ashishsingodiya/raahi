import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import type { Session } from "@raahi/auth";
import { inArray } from "@raahi/db";
import { studentProfile, user } from "@raahi/db/schema";

// eslint-disable-next-line turbo/no-undeclared-env-vars -- Only the opt-in integration test reads this URL.
const testDatabase = process.env.TEST_POSTGRES_URL;

void test(
  "students can discover a ride, compete for one seat, and share contact details on acceptance",
  {
    skip:
      !testDatabase &&
      "Set TEST_POSTGRES_URL to a disposable migrated database",
  },
  async (t) => {
    process.env.POSTGRES_URL = testDatabase;
    process.env.BETTER_AUTH_SECRET ??= "test-only-route-secret-32-characters";
    process.env.AUTH_GOOGLE_CLIENT_ID ??= "test-client";
    process.env.AUTH_GOOGLE_CLIENT_SECRET ??= "test-secret";
    process.env.GOOGLE_MAPS_SERVER_KEY = "test-key";

    const { createCaller } = await import("./index");
    const { db } = await import("@raahi/db/client");

    const prefix = randomUUID();
    const users = [
      {
        id: `${prefix}-driver`,
        name: "Driver",
        email: `${prefix}-driver@rtu.ac.in`,
        emailVerified: true,
        role: "user",
      },
      {
        id: `${prefix}-rider-a`,
        name: "Rider A",
        email: `${prefix}-rider-a@example.com`,
        emailVerified: true,
        role: "user",
      },
      {
        id: `${prefix}-rider-b`,
        name: "Rider B",
        email: `${prefix}-rider-b@rtu.ac.in`,
        emailVerified: true,
        role: "user",
      },
      {
        id: `${prefix}-other`,
        name: "Other student",
        email: `${prefix}-other@rtu.ac.in`,
        emailVerified: true,
        role: "user",
      },
      {
        id: `${prefix}-lookalike`,
        name: "Lookalike",
        email: `${prefix}-lookalike@rtu.ac.in.example.com`,
        emailVerified: true,
        role: "user",
      },
      {
        id: `${prefix}-unverified`,
        name: "Unverified",
        email: `${prefix}-unverified@rtu.ac.in`,
        emailVerified: false,
        role: "user",
      },
      {
        id: `${prefix}-admin`,
        name: "Admin",
        email: `${prefix}-admin@example.com`,
        emailVerified: true,
        role: "admin",
      },
    ] as const;
    await db.insert(user).values([...users]);
    t.after(async () => {
      try {
        await db.delete(user).where(
          inArray(
            user.id,
            users.map((account) => account.id),
          ),
        );
      } finally {
        await db.$client.end();
      }
    });

    const now = new Date();
    function caller(account: (typeof users)[number]) {
      const session: Session = {
        user: { ...account, createdAt: now, updatedAt: now, banned: false },
        session: {
          id: account.id,
          userId: account.id,
          token: account.id,
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(now.getTime() + 60_000),
        },
      };
      return createCaller({ db, session, headers: new Headers() });
    }

    const [
      driver,
      firstRider,
      secondRider,
      other,
      lookalike,
      unverified,
      admin,
    ] = users.map(caller);
    assert.ok(
      driver &&
        firstRider &&
        secondRider &&
        other &&
        lookalike &&
        unverified &&
        admin,
    );
    const mobile = ["9876500001", "9876500002", "9876500003", "9876500004"];
    const [driverNumber, firstNumber, secondNumber, otherNumber] = mobile;
    assert.ok(driverNumber && firstNumber && secondNumber && otherNumber);
    assert.equal(await firstRider.student.profile(), null);
    await assert.rejects(
      firstRider.student.onboard({ displayName: "Rider A", mobileNumber: "1" }),
      { code: "BAD_REQUEST" },
    );
    assert.equal(
      (
        await driver.student.onboard({
          displayName: "Driver",
          mobileNumber: driverNumber,
        })
      )?.status,
      "approved",
    );
    assert.equal(
      (
        await firstRider.student.onboard({
          displayName: "Rider A",
          mobileNumber: firstNumber,
        })
      )?.status,
      "pending",
    );
    assert.equal(
      (
        await secondRider.student.onboard({
          displayName: "Rider B",
          mobileNumber: secondNumber,
        })
      )?.status,
      "approved",
    );
    assert.equal(
      (
        await other.student.onboard({
          displayName: "Other",
          mobileNumber: otherNumber,
        })
      )?.status,
      "approved",
    );
    assert.equal(
      (
        await lookalike.student.onboard({
          displayName: "Lookalike",
          mobileNumber: firstNumber,
        })
      )?.status,
      "pending",
    );
    assert.equal(
      (
        await unverified.student.onboard({
          displayName: "Unverified",
          mobileNumber: secondNumber,
        })
      )?.status,
      "pending",
    );
    await assert.rejects(firstRider.ride.mine(), { code: "FORBIDDEN" });
    await assert.rejects(firstRider.student.pending(), { code: "FORBIDDEN" });
    assert.ok(
      (await admin.student.pending()).every(
        (profile) => !("mobileNumber" in profile),
      ),
    );
    await admin.student.review({ userId: users[1].id, status: "approved" });
    await admin.student.review({ userId: users[4].id, status: "rejected" });
    assert.equal((await firstRider.student.profile())?.status, "approved");
    assert.equal((await lookalike.student.profile())?.status, "rejected");
    assert.equal(
      (
        await lookalike.student.onboard({
          displayName: "Retry",
          mobileNumber: driverNumber,
        })
      )?.status,
      "rejected",
    );
    assert.ok(
      (await db.select().from(studentProfile)).some(
        (profile) =>
          profile.userId === users[1].id &&
          profile.reviewedBy === users[6].id &&
          profile.reviewedAt,
      ),
    );

    const start = { latitude: 25.13, longitude: 75.8 };
    const pickup = { latitude: 25.131, longitude: 75.815 };
    const dropoff = { latitude: 25.13, longitude: 75.841 };
    const destination = { latitude: 25.13, longitude: 75.85 };
    const departure = new Date(now.getTime() + 2 * 60 * 60_000);
    t.mock.method(globalThis, "fetch", () =>
      Promise.resolve(
        Response.json({
          routes: [
            {
              duration: "1800s",
              distanceMeters: 5100,
              polyline: {
                geoJsonLinestring: {
                  coordinates: [
                    [75.8, 25.13],
                    [75.82, 25.13],
                    [75.84, 25.13],
                    [75.85, 25.13],
                  ],
                },
              },
            },
          ],
        }),
      ),
    );

    const [preview] = await driver.ride.preview({
      start,
      destination,
      vehicle: "car",
    });
    assert.ok(preview);
    const offer = {
      preview: preview.preview,
      pickup: start,
      destinationLabel: "Campus",
      departure,
      capacity: 1,
      pricePaise: 5000,
      instructions: "Meet at the north entrance.",
    };
    await assert.rejects(
      driver.ride.publish({ ...offer, preview: "invalid" }),
      { code: "BAD_REQUEST" },
    );
    await assert.rejects(driver.ride.publish({ ...offer, pricePaise: -1 }), {
      code: "BAD_REQUEST",
    });
    await assert.rejects(driver.ride.publish({ ...offer, capacity: 0 }), {
      code: "BAD_REQUEST",
    });
    await assert.rejects(
      driver.ride.publish({ ...offer, departure: new Date(0) }),
      { code: "BAD_REQUEST" },
    );
    await assert.rejects(
      driver.ride.publish({ ...offer, pickup: { latitude: 0, longitude: 0 } }),
      { code: "BAD_REQUEST" },
    );
    const paid = await driver.ride.publish(offer);
    const free = await driver.ride.publish({
      ...offer,
      pricePaise: 0,
      destinationLabel: "Market",
    });
    assert.ok(paid && free);
    assert.equal((await firstRider.ride.detail(free.id)).pricePaise, 0);
    const matches = await firstRider.ride.discover({
      pickup,
      dropoff,
      pickupTime: departure,
    });
    assert.ok(
      matches.some((ride) => ride.id === paid.id && ride.pricePaise === 5000),
    );
    assert.equal(
      (
        await firstRider.ride.discover({ pickup: dropoff, dropoff: pickup })
      ).some((ride) => ride.id === paid.id),
      false,
    );
    assert.equal(
      (
        await firstRider.ride.discover({
          pickup,
          dropoff,
          pickupTime: new Date(departure.getTime() + 90 * 60_000),
        })
      ).some((ride) => ride.id === paid.id),
      false,
    );

    const booking = {
      rideId: paid.id,
      pickup,
      dropoff,
      expectedPricePaise: 5000,
    };
    await assert.rejects(driver.request.submit(booking), {
      code: "BAD_REQUEST",
    });
    await assert.rejects(
      firstRider.request.submit({
        ...booking,
        pickup: dropoff,
        dropoff: pickup,
      }),
      { code: "BAD_REQUEST" },
    );
    await assert.rejects(
      firstRider.request.submit({
        ...booking,
        pickup: { latitude: 0, longitude: 0 },
      }),
      { code: "BAD_REQUEST" },
    );
    const a = await firstRider.request.submit(booking);
    const b = await secondRider.request.submit(booking);
    const estimate = await firstRider.request.estimate(booking);
    assert.deepEqual(
      (await firstRider.request.detail(a.id)).pickupAt,
      estimate.pickupAt,
    );
    await assert.rejects(firstRider.request.submit(booking), {
      code: "CONFLICT",
    });
    assert.equal((await driver.request.detail(a.id)).contact, undefined);
    const decisions = await Promise.allSettled([
      driver.request.decide({ id: a.id, action: "accept" }),
      driver.request.decide({ id: b.id, action: "accept" }),
    ]);
    assert.equal(
      decisions.filter((decision) => decision.status === "fulfilled").length,
      1,
    );
    const firstWon = decisions[0].status === "fulfilled";
    const winner = firstWon ? firstRider : secondRider;
    const winnerId = firstWon ? a.id : b.id;
    const declinedId = firstWon ? b.id : a.id;
    assert.equal(
      (await winner.request.detail(winnerId)).contact?.mobileNumber,
      `+91${driverNumber}`,
    );
    assert.equal(
      (await driver.request.detail(winnerId)).contact?.mobileNumber,
      `+91${firstWon ? firstNumber : secondNumber}`,
    );
    assert.equal(
      (await winner.request.detail(winnerId)).contact?.instructions,
      offer.instructions,
    );
    await assert.rejects(other.request.detail(winnerId), { code: "NOT_FOUND" });
    assert.equal((await firstRider.ride.detail(paid.id)).availableSeats, 0);
    await driver.request.decide({ id: declinedId, action: "decline" });
    assert.equal((await driver.request.detail(declinedId)).contact, undefined);
    await Promise.all([
      winner.request.decide({ id: winnerId, action: "cancel" }),
      winner.request.decide({ id: winnerId, action: "cancel" }),
    ]);
    assert.equal((await winner.request.detail(winnerId)).contact, undefined);
    assert.equal((await firstRider.ride.detail(paid.id)).availableSeats, 1);
    const cancelled = await firstRider.request.submit({
      ...booking,
      rideId: free.id,
      expectedPricePaise: 0,
    });
    await driver.ride.cancel(free.id);
    assert.equal(
      (await firstRider.request.detail(cancelled.id)).status,
      "cancelled",
    );
    assert.equal(
      (await firstRider.ride.discover({ pickup, dropoff })).some(
        (ride) => ride.id === free.id,
      ),
      false,
    );
  },
);
