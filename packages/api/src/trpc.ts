import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import type { Auth } from "@ridemate/auth";
import type { Action, Resource } from "@ridemate/auth/permissions";
import { hasPermission } from "@ridemate/auth/permissions";
import { db } from "@ridemate/db/client";

import { getStudentProfile } from "./student";

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Auth;
}) => {
  const session = await opts.auth.api.getSession({ headers: opts.headers });
  return {
    db,
    session,
    headers: opts.headers,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
    },
  }),
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/** Anyone, logged in or not. */
export const publicProcedure = t.procedure;

/** Any logged-in user. `ctx.session` is guaranteed to exist. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { session: ctx.session } });
});

export const studentProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const profile = await getStudentProfile(ctx.db, ctx.session.user.id);
    if (profile?.status !== "approved") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Student approval is required.",
      });
    }
    return next({ ctx: { student: profile } });
  },
);

/** Logged-in users whose role grants `resource:action`. */
export const requirePermission = <R extends Resource>(
  resource: R,
  action: Action<R>,
) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!hasPermission(ctx.session.user.role, resource, action)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });
