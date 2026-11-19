import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const studentStatus = pgEnum("student_status", [
  "pending",
  "approved",
  "rejected",
]);

export const studentApprovalSource = pgEnum("student_approval_source", [
  "college_email",
  "admin",
]);

export const studentProfile = pgTable(
  "student_profile",
  {
    userId: text()
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text().notNull(),
    mobileNumber: text().notNull(),
    status: studentStatus().default("pending").notNull(),
    approvalSource: studentApprovalSource(),
    reviewedBy: text().references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("student_profile_review_idx").on(table.status, table.createdAt),
  ],
);
