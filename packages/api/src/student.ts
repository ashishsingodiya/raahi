import { eq } from "@raahi/db";
import { studentProfile } from "@raahi/db/schema";

import type { Context } from "./trpc";

export function isCollegeEmail(email: string, verified: boolean) {
  return verified && /^[^@]+@rtu\.ac\.in$/i.test(email);
}

export function normalizeMobileNumber(value: string) {
  const number = value.replace(/[\s()-]/g, "");
  return /^\d{10}$/.test(number) ? `+91${number}` : number;
}

export function getStudentProfile(db: Context["db"], userId: string) {
  return db.query.studentProfile.findFirst({
    columns: { displayName: true, status: true },
    where: eq(studentProfile.userId, userId),
  });
}
