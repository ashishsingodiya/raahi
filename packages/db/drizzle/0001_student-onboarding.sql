CREATE TYPE "public"."student_approval_source" AS ENUM('college_email', 'admin');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "student_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"mobile_number" text NOT NULL,
	"status" "student_status" DEFAULT 'pending' NOT NULL,
	"approval_source" "student_approval_source",
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_profile_review_idx" ON "student_profile" USING btree ("status","created_at");