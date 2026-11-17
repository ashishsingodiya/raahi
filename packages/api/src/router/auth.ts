import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
  me: protectedProcedure.query(({ ctx }) => ctx.session.user),
} satisfies TRPCRouterRecord;
