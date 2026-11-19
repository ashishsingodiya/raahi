import { authRouter } from "./router/auth";
import { mapsRouter } from "./router/maps";
import { requestRouter } from "./router/request";
import { rideRouter } from "./router/ride";
import { studentRouter } from "./router/student";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  student: studentRouter,
  maps: mapsRouter,
  ride: rideRouter,
  request: requestRouter,
});

export type AppRouter = typeof appRouter;
