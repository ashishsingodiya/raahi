import { sql } from "@ridemate/db";
import { db } from "@ridemate/db/client";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", db: "up" });
  } catch {
    return Response.json({ status: "error", db: "down" }, { status: 503 });
  }
}
