import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, asc, eq } from "@ridemate/db";
import { studentProfile, user } from "@ridemate/db/schema";

import {
  getStudentProfile,
  isCollegeEmail,
  normalizeMobileNumber,
} from "../student";
import { protectedProcedure, requirePermission } from "../trpc";

export const studentRouter = {
  profile: protectedProcedure.query(
    async ({ ctx }) =>
      (await getStudentProfile(ctx.db, ctx.session.user.id)) ?? null,
  ),
  onboard: protectedProcedure
    .input(
      z.object({
        displayName: z.string().trim().min(1).max(100),
        mobileNumber: z
          .string()
          .trim()
          .max(40)
          .transform(normalizeMobileNumber)
          .pipe(
            z
              .string()
              .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid mobile number."),
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, email, emailVerified } = ctx.session.user;
      const approved = isCollegeEmail(email, emailVerified);
      await ctx.db
        .insert(studentProfile)
        .values({
          userId: id,
          ...input,
          status: approved ? "approved" : "pending",
          approvalSource: approved ? "college_email" : null,
        })
        .onConflictDoNothing({ target: studentProfile.userId });
      return getStudentProfile(ctx.db, id);
    }),
  pending: requirePermission("user", "list").query(({ ctx }) =>
    ctx.db
      .select({
        userId: studentProfile.userId,
        displayName: studentProfile.displayName,
        email: user.email,
        image: user.image,
        createdAt: studentProfile.createdAt,
      })
      .from(studentProfile)
      .innerJoin(user, eq(studentProfile.userId, user.id))
      .where(eq(studentProfile.status, "pending"))
      .orderBy(asc(studentProfile.createdAt)),
  ),
  review: requirePermission("user", "list")
    .input(
      z.object({
        userId: z.string().min(1),
        status: z.enum(["approved", "rejected"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(studentProfile)
        .set({
          status: input.status,
          approvalSource: "admin",
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(studentProfile.userId, input.userId),
            eq(studentProfile.status, "pending"),
          ),
        )
        .returning({ userId: studentProfile.userId });
      if (!updated)
        throw new TRPCError({
          code: "CONFLICT",
          message: "This profile is no longer pending.",
        });
      return updated;
    }),
};
