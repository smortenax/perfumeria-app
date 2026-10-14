ALTER TABLE "materials" ADD COLUMN "abbreviation" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "abbreviation_origin" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "product" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "product_url" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "tenacity_hours" numeric;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "tenacity_source" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "evolution_to_15m" smallint;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "evolution_to_2h" smallint;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "evolution_to_8h" smallint;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "evolution_to_24h" smallint;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "evolution_beyond_24h" smallint;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "cost" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "handling" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "physical_state" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "appearance" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "stains" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "solubility" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "density" numeric;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "melting_point_c" numeric;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "formula" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "molecular_weight" numeric;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "vapor_pressure" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "stability" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "incompatibilities" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "physical_sources" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_abbreviation_origin" CHECK ("materials"."abbreviation_origin" is null or "materials"."abbreviation_origin" in ('user', 'generated'));--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_color" CHECK ("materials"."color" is null or "materials"."color" ~ '^#[0-9a-f]{6}$');--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_tenacity_hours" CHECK ("materials"."tenacity_hours" is null or "materials"."tenacity_hours" > 0);--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_evolution" CHECK (coalesce("materials"."evolution_to_15m", 0) between 0 and 3 and coalesce("materials"."evolution_to_2h", 0) between 0 and 3 and coalesce("materials"."evolution_to_8h", 0) between 0 and 3 and coalesce("materials"."evolution_to_24h", 0) between 0 and 3 and coalesce("materials"."evolution_beyond_24h", 0) between 0 and 3);--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_density" CHECK ("materials"."density" is null or "materials"."density" > 0);--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_molecular_weight" CHECK ("materials"."molecular_weight" is null or "materials"."molecular_weight" > 0);