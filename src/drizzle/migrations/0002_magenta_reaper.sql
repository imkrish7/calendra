ALTER TABLE "events" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "schedulAvailablities" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;