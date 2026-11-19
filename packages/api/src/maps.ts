import { createHmac, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@raahi/auth/env";

export const pointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export const vehicleSchema = z.enum(["bike", "car"]);
export const routeInput = z.object({
  start: pointSchema,
  destination: pointSchema,
  vehicle: vehicleSchema,
});

const googlePoint = z.object({ latitude: z.number(), longitude: z.number() });
const routeResponse = z.object({
  routes: z
    .array(
      z.object({
        duration: z.string().regex(/^\d+(?:\.\d+)?s$/),
        distanceMeters: z.number().positive(),
        polyline: z.object({
          geoJsonLinestring: z.object({
            coordinates: z
              .array(z.tuple([z.number(), z.number()]))
              .min(2)
              .max(15_000),
          }),
        }),
      }),
    )
    .default([]),
});
const previewSchema = routeInput.extend({
  userId: z.string(),
  expiresAt: z.number(),
  durationSeconds: z.number().int().positive(),
  option: z.number().int().nonnegative(),
  points: z.array(pointSchema).min(2).max(15_000),
});

export async function googleRequest<T>(
  url: string,
  fields: string,
  schema: z.ZodType<T>,
  body?: unknown,
) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Google Maps is not configured on the server.",
    });
  let response: Response;
  try {
    response = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fields,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Google Maps did not respond. Please try again.",
    });
  }
  if (!response.ok) {
    const message =
      response.status === 429
        ? "Google Maps has reached its demo quota. Try again after it resets."
        : "Google Maps could not complete this request.";
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message });
  }
  const result = schema.safeParse(await response.json());
  if (!result.success)
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Google Maps returned unexpected data.",
    });
  return result.data;
}

export async function routeOptions(input: z.infer<typeof routeInput>) {
  const routes = await googleRequest(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    "routes.duration,routes.distanceMeters,routes.polyline.geoJsonLinestring",
    routeResponse,
    {
      origin: { location: { latLng: input.start } },
      destination: { location: { latLng: input.destination } },
      travelMode: input.vehicle === "bike" ? "TWO_WHEELER" : "DRIVE",
      computeAlternativeRoutes: true,
      polylineEncoding: "GEO_JSON_LINESTRING",
      polylineQuality: "HIGH_QUALITY",
    },
  );
  return routes.routes.map((route, option) => ({
    option,
    durationSeconds: Math.max(1, Math.round(Number.parseFloat(route.duration))),
    distanceMeters: route.distanceMeters,
    points: route.polyline.geoJsonLinestring.coordinates.map(
      ([longitude, latitude]) => ({ latitude, longitude }),
    ),
  }));
}

function signPreview(payload: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update("raahi-route-preview:")
    .update(payload)
    .digest();
}

export function createRoutePreview(preview: z.infer<typeof previewSchema>) {
  const payload = Buffer.from(JSON.stringify(preview)).toString("base64url");
  return `${payload}.${signPreview(payload).toString("base64url")}`;
}

export function readRoutePreview(token: string, userId: string) {
  const [payload, signature, extra] = token.split(".");
  if (payload && signature && extra === undefined) {
    const actual = Buffer.from(signature, "base64url");
    const expected = signPreview(payload);
    if (
      actual.length === expected.length &&
      timingSafeEqual(actual, expected)
    ) {
      const data = previewSchema.safeParse(
        JSON.parse(
          Buffer.from(payload, "base64url").toString("utf8"),
        ) as unknown,
      );
      if (
        data.success &&
        data.data.userId === userId &&
        data.data.expiresAt > Date.now()
      )
        return data.data;
    }
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Select a fresh route preview before publishing.",
  });
}

export async function searchPlaces(
  input: string,
  near?: z.infer<typeof pointSchema>,
) {
  const schema = z.object({
    suggestions: z
      .array(
        z.object({
          placePrediction: z.object({
            placeId: z.string(),
            text: z.object({ text: z.string() }),
          }),
        }),
      )
      .default([]),
  });
  const result = await googleRequest(
    "https://places.googleapis.com/v1/places:autocomplete",
    "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
    schema,
    {
      input,
      includedRegionCodes: ["in"],
      locationBias: near
        ? { circle: { center: near, radius: 20_000 } }
        : undefined,
    },
  );
  return result.suggestions.map(({ placePrediction: place }) => ({
    id: place.placeId,
    label: place.text.text,
  }));
}

export function placeLocation(id: string) {
  return googleRequest(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
    "location",
    z.object({ location: googlePoint }),
  );
}
