CREATE TYPE "public"."ride_request_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('bike', 'car');--> statement-breakpoint
CREATE TABLE "ride" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" text NOT NULL,
	"start" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"destination_label" text NOT NULL,
	"pickup" jsonb NOT NULL,
	"departure" timestamp with time zone NOT NULL,
	"duration_seconds" integer NOT NULL,
	"vehicle" "vehicle_type" NOT NULL,
	"capacity" integer NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"instructions" text,
	"cancelled" boolean DEFAULT false NOT NULL,
	"route" jsonb,
	"route_expires_at" timestamp with time zone NOT NULL,
	"route_option" integer NOT NULL,
	"min_lat" double precision NOT NULL,
	"max_lat" double precision NOT NULL,
	"min_lng" double precision NOT NULL,
	"max_lng" double precision NOT NULL,
	CONSTRAINT "ride_capacity_check" CHECK ("ride"."capacity" between 1 and case when "ride"."vehicle" = 'bike' then 1 else 8 end),
	CONSTRAINT "ride_reserved_check" CHECK ("ride"."reserved" between 0 and "ride"."capacity"),
	CONSTRAINT "ride_price_check" CHECK ("ride"."price_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "seat_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"rider_id" text NOT NULL,
	"pickup" jsonb NOT NULL,
	"dropoff" jsonb NOT NULL,
	"pickup_at" timestamp with time zone NOT NULL,
	"price_paise" integer NOT NULL,
	"status" "ride_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ride" ADD CONSTRAINT "ride_driver_id_student_profile_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."student_profile"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_request" ADD CONSTRAINT "seat_request_ride_id_ride_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."ride"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_request" ADD CONSTRAINT "seat_request_rider_id_student_profile_user_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."student_profile"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ride_discovery_idx" ON "ride" USING btree ("cancelled","departure");--> statement-breakpoint
CREATE INDEX "ride_driver_idx" ON "ride" USING btree ("driver_id","departure");--> statement-breakpoint
CREATE UNIQUE INDEX "seat_request_active_idx" ON "seat_request" USING btree ("ride_id","rider_id") WHERE "seat_request"."status" in ('pending', 'accepted');--> statement-breakpoint
CREATE INDEX "seat_request_ride_idx" ON "seat_request" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "seat_request_rider_idx" ON "seat_request" USING btree ("rider_id","created_at");