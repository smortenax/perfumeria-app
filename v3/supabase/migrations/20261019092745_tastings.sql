CREATE TABLE "tasting_battery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moment_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"axis" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasting_battery_once" UNIQUE("moment_id","axis"),
	CONSTRAINT "tasting_battery_axis" CHECK ("tasting_battery"."axis" in ('metallic', 'soapy', 'green', 'floral', 'sweet', 'smoky', 'animalic', 'resinous')),
	CONSTRAINT "tasting_battery_state" CHECK ("tasting_battery"."state" in ('yes', 'no', 'unsure', 'nr'))
);
--> statement-breakpoint
CREATE TABLE "tasting_closures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strip_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"role" text,
	"effect_richness" text,
	"effect_energy" text,
	"versatility" text,
	"decay" text,
	"r1" text,
	"r2" text,
	"r2_note" text,
	"r3" text,
	"r3_note" text,
	"biases" text[] DEFAULT '{}'::text[] NOT NULL,
	"bias_note" text,
	"affinities" text,
	"destination" text,
	"negative_destination" text,
	"comparison" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasting_closures_once" UNIQUE("strip_id"),
	CONSTRAINT "tasting_closures_role" CHECK ("tasting_closures"."role" is null or "tasting_closures"."role" in ('thesis', 'holds', 'projects')),
	CONSTRAINT "tasting_closures_richness" CHECK ("tasting_closures"."effect_richness" is null or "tasting_closures"."effect_richness" in ('rich', 'fresh')),
	CONSTRAINT "tasting_closures_energy" CHECK ("tasting_closures"."effect_energy" is null or "tasting_closures"."effect_energy" in ('gentle', 'active')),
	CONSTRAINT "tasting_closures_versatility" CHECK ("tasting_closures"."versatility" is null or "tasting_closures"."versatility" in ('difficult', 'congenial', 'turgid', 'tenacious')),
	CONSTRAINT "tasting_closures_decay" CHECK ("tasting_closures"."decay" is null or "tasting_closures"."decay" in ('fades', 'truncates', 'simplifies')),
	CONSTRAINT "tasting_closures_r1" CHECK ("tasting_closures"."r1" is null or "tasting_closures"."r1" in ('no_idea', 'two_or_three', 'sure')),
	CONSTRAINT "tasting_closures_r2" CHECK ("tasting_closures"."r2" is null or "tasting_closures"."r2" in ('no', 'confuses', 'sure', 'confirmed')),
	CONSTRAINT "tasting_closures_r3" CHECK ("tasting_closures"."r3" is null or "tasting_closures"."r3" in ('never_used', 'used_in_accord')),
	CONSTRAINT "tasting_closures_biases" CHECK ("tasting_closures"."biases" <@ array['priming', 'fatigue', 'solvent', 'informed']::text[])
);
--> statement-breakpoint
CREATE TABLE "tasting_curve" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moment_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"segment" smallint NOT NULL,
	"level" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasting_curve_once" UNIQUE("moment_id","segment"),
	CONSTRAINT "tasting_curve_segment" CHECK ("tasting_curve"."segment" in (1, 2, 3, 4)),
	CONSTRAINT "tasting_curve_level" CHECK ("tasting_curve"."level" in ('low', 'mid', 'high'))
);
--> statement-breakpoint
CREATE TABLE "tasting_families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moment_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"scheme" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasting_families_once" UNIQUE("moment_id","scheme","code"),
	CONSTRAINT "tasting_families_code" CHECK (case "tasting_families"."scheme" when 'calkin' then code in ('aldehydic', 'amber', 'animal', 'anisic', 'aromatic_herbal', 'balsamic', 'camphoraceous', 'cinnamic', 'citrus', 'floral', 'fresh', 'fruity', 'green', 'herbal', 'iris', 'lavender', 'leather', 'linalool', 'minty', 'mossy', 'musky', 'spicy', 'sweet', 'melon_cucumber') when 'ellena' then code in ('flowers', 'fruits', 'woods', 'herbs', 'spices', 'sweets', 'animals', 'marine', 'minerals') when 'app' then code in ('citrus', 'green', 'ozonic', 'floral', 'fruity', 'spicy', 'woody', 'animal', 'transformed') else false end)
);
--> statement-breakpoint
CREATE TABLE "tasting_marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"material_id" uuid NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasting_marks_once" UNIQUE("user_id","material_id"),
	CONSTRAINT "tasting_marks_label" CHECK (length(trim("tasting_marks"."label")) > 0)
);
--> statement-breakpoint
CREATE TABLE "tasting_moments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strip_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"moment" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text,
	"intensity" smallint,
	"texture" text,
	"temperature" text,
	"shape" text,
	"color" text,
	"brightness" text,
	"thing_or_place" text,
	"thing_or_place_text" text,
	"own_field" text,
	"complexity" text,
	"complexity_note" text,
	"puff" text,
	"revised_image" text,
	"metaphor" text,
	"notes" text,
	"near_detectable" boolean,
	"far_detectable" boolean,
	"reviewed" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasting_moments_once" UNIQUE("strip_id","moment"),
	CONSTRAINT "tasting_moments_moment" CHECK ("tasting_moments"."moment" in ('t0', 't5', 't15', 't30', 't60', 'h24', 'days')),
	CONSTRAINT "tasting_moments_intensity" CHECK ("tasting_moments"."intensity" is null or "tasting_moments"."intensity" between 1 and 5),
	CONSTRAINT "tasting_moments_thing_or_place" CHECK ("tasting_moments"."thing_or_place" is null or "tasting_moments"."thing_or_place" in ('thing', 'place', 'both', 'unsure')),
	CONSTRAINT "tasting_moments_complexity" CHECK ("tasting_moments"."complexity" is null or "tasting_moments"."complexity" in ('simple', 'compound', 'complex')),
	CONSTRAINT "tasting_moments_puff" CHECK ("tasting_moments"."puff" is null or "tasting_moments"."puff" in ('b1', 'b2', 'b3')),
	CONSTRAINT "tasting_moments_reviewed" CHECK ("tasting_moments"."reviewed" <@ array['description', 'thing_or_place', 'intensity', 'curve', 'synesthetic', 'families', 'battery', 'form']::text[]),
	CONSTRAINT "tasting_moments_t0" CHECK ("tasting_moments"."moment" <> 't0' or (length(trim(coalesce("tasting_moments"."text", ''))) > 0 and "tasting_moments"."intensity" is null and "tasting_moments"."texture" is null
        and "tasting_moments"."temperature" is null and "tasting_moments"."shape" is null and "tasting_moments"."color" is null and "tasting_moments"."brightness" is null and "tasting_moments"."thing_or_place" is null
        and "tasting_moments"."thing_or_place_text" is null and "tasting_moments"."own_field" is null and "tasting_moments"."complexity" is null and "tasting_moments"."complexity_note" is null and "tasting_moments"."puff" is null
        and "tasting_moments"."revised_image" is null and "tasting_moments"."metaphor" is null and "tasting_moments"."notes" is null and "tasting_moments"."near_detectable" is null and "tasting_moments"."far_detectable" is null))
);
--> statement-breakpoint
CREATE TABLE "tasting_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasting_strips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"material_id" uuid NOT NULL,
	"dilution_id" uuid,
	"fraction" numeric,
	"solvent" text,
	"dose" text,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blind_label" text NOT NULL,
	"revealed_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasting_strips_label_once" UNIQUE("session_id","blind_label"),
	CONSTRAINT "tasting_strips_label" CHECK ("tasting_strips"."blind_label" in ('A', 'B', 'C', 'D')),
	CONSTRAINT "tasting_strips_fraction" CHECK ("tasting_strips"."fraction" is null or ("tasting_strips"."fraction" > 0 and "tasting_strips"."fraction" <= 1))
);
--> statement-breakpoint
ALTER TABLE "tasting_battery" ADD CONSTRAINT "tasting_battery_moment_id_tasting_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."tasting_moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_battery" ADD CONSTRAINT "tasting_battery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_closures" ADD CONSTRAINT "tasting_closures_strip_id_tasting_strips_id_fk" FOREIGN KEY ("strip_id") REFERENCES "public"."tasting_strips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_closures" ADD CONSTRAINT "tasting_closures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_curve" ADD CONSTRAINT "tasting_curve_moment_id_tasting_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."tasting_moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_curve" ADD CONSTRAINT "tasting_curve_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_families" ADD CONSTRAINT "tasting_families_moment_id_tasting_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."tasting_moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_families" ADD CONSTRAINT "tasting_families_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_marks" ADD CONSTRAINT "tasting_marks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_marks" ADD CONSTRAINT "tasting_marks_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_moments" ADD CONSTRAINT "tasting_moments_strip_id_tasting_strips_id_fk" FOREIGN KEY ("strip_id") REFERENCES "public"."tasting_strips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_moments" ADD CONSTRAINT "tasting_moments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_sessions" ADD CONSTRAINT "tasting_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_strips" ADD CONSTRAINT "tasting_strips_session_id_tasting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tasting_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_strips" ADD CONSTRAINT "tasting_strips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_strips" ADD CONSTRAINT "tasting_strips_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_strips" ADD CONSTRAINT "tasting_strips_dilution_id_lab_dilutions_id_fk" FOREIGN KEY ("dilution_id") REFERENCES "public"."lab_dilutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasting_battery_user_idx" ON "tasting_battery" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_closures_user_idx" ON "tasting_closures" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_curve_user_idx" ON "tasting_curve" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_families_user_idx" ON "tasting_families" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_marks_user_idx" ON "tasting_marks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_moments_user_idx" ON "tasting_moments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_sessions_user_idx" ON "tasting_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_strips_user_idx" ON "tasting_strips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasting_strips_session_idx" ON "tasting_strips" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "tasting_strips_material_idx" ON "tasting_strips" USING btree ("material_id");