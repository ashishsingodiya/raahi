import { z } from "zod";

import { placeLocation, pointSchema, searchPlaces } from "../maps";
import { studentProcedure } from "../trpc";

export const mapsRouter = {
  search: studentProcedure
    .input(
      z.object({
        text: z.string().trim().min(3).max(100),
        near: pointSchema.optional(),
      }),
    )
    .query(({ input }) => searchPlaces(input.text, input.near)),
  location: studentProcedure
    .input(z.string().min(1).max(256))
    .query(({ input }) => placeLocation(input)),
};
