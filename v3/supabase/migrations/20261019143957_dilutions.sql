CREATE TABLE "lab_dilution_diluents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dilution_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"diluent_id" uuid NOT NULL,
	"mass_ug" bigint,
	"fraction" numeric NOT NULL,
	"position" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_dilution_diluents_once" UNIQUE("dilution_id","diluent_id"),
	CONSTRAINT "lab_dilution_diluents_fraction" CHECK ("lab_dilution_diluents"."fraction" > 0 and "lab_dilution_diluents"."fraction" < 1),
	CONSTRAINT "lab_dilution_diluents_mass" CHECK ("lab_dilution_diluents"."mass_ug" is null or "lab_dilution_diluents"."mass_ug" > 0)
);
--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD COLUMN "material_mass_ug" bigint;--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD COLUMN "source_dilution_id" uuid;--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lab_dilution_diluents" ADD CONSTRAINT "lab_dilution_diluents_dilution_id_lab_dilutions_id_fk" FOREIGN KEY ("dilution_id") REFERENCES "public"."lab_dilutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_dilution_diluents" ADD CONSTRAINT "lab_dilution_diluents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_dilution_diluents" ADD CONSTRAINT "lab_dilution_diluents_diluent_id_materials_id_fk" FOREIGN KEY ("diluent_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_dilution_diluents_user_idx" ON "lab_dilution_diluents" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD CONSTRAINT "lab_dilutions_source_dilution_id_lab_dilutions_id_fk" FOREIGN KEY ("source_dilution_id") REFERENCES "public"."lab_dilutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_dilutions_material_idx" ON "lab_dilutions" USING btree ("material_id");--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD CONSTRAINT "lab_dilutions_mass" CHECK ("lab_dilutions"."material_mass_ug" is null or "lab_dilutions"."material_mass_ug" > 0);--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD CONSTRAINT "lab_dilutions_not_own_source" CHECK ("lab_dilutions"."source_dilution_id" is null or "lab_dilutions"."source_dilution_id" <> "lab_dilutions"."id");