import assert from "node:assert/strict";
import { test } from "node:test";

import { estimatedPickup, matchTrip } from "./route-matching";

void test("projects custom pins onto the route in travel order and estimates pickup", () => {
  const point = (longitude: number, latitude = 25) => ({ latitude, longitude });
  const route = [point(75), point(75.01), point(75.02), point(75.03)];
  const pickup = point(75.009, 25.001);
  const dropoff = point(75.019);
  const match = matchTrip(route, pickup, dropoff, 500);
  assert.ok(match);
  assert.equal(Math.round(match.progress * 100), 30);
  assert.equal(
    estimatedPickup(new Date(0), 1800, match.progress).getTime(),
    540_000,
  );
  assert.equal(matchTrip(route, dropoff, pickup, 500), undefined);
  assert.equal(matchTrip(route, point(75.009, 25.01), dropoff, 500), undefined);
  assert.equal(matchTrip(route, pickup, dropoff, 500, 0.6, 0.1), undefined);
});

void test("uses a later pass through the same pickup when that pass fits the requested time", () => {
  const point = (longitude: number, latitude = 25) => ({ latitude, longitude });
  const pickup = point(75.01);
  const dropoff = point(75.03);
  const route = [
    point(75),
    pickup,
    point(75.015, 25.01),
    pickup,
    point(75.02),
    dropoff,
  ];
  const first = matchTrip(route, pickup, dropoff, 500);
  const later = matchTrip(route, pickup, dropoff, 500, 0.65, 0.2);
  assert.ok(first && later);
  assert.ok(later.progress > first.progress);
});
