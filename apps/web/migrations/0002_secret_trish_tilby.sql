CREATE TYPE "public"."quality_options" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
ALTER TABLE "annotation" ADD COLUMN "quality" "quality_options";