CREATE TABLE "lab_axes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"material_id" uuid NOT NULL,
	"axis" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_axes_once" UNIQUE("user_id","material_id","axis"),
	CONSTRAINT "lab_axes_axis" CHECK (length(trim("lab_axes"."axis")) > 0)
);
--> statement-breakpoint
CREATE TABLE "lab_dilutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"material_id" uuid NOT NULL,
	"fraction" numeric NOT NULL,
	"solvent" text,
	"made_on" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_dilutions_fraction" CHECK ("lab_dilutions"."fraction" > 0 and "lab_dilutions"."fraction" <= 1),
	CONSTRAINT "lab_dilutions_made_on" CHECK ("lab_dilutions"."made_on" is null or "lab_dilutions"."made_on" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "lab_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"material_id" uuid NOT NULL,
	"status" text,
	"smelling_tip" text,
	"reading" text,
	"sheet" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_evaluations_once" UNIQUE("user_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "lab_axes" ADD CONSTRAINT "lab_axes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_axes" ADD CONSTRAINT "lab_axes_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD CONSTRAINT "lab_dilutions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_dilutions" ADD CONSTRAINT "lab_dilutions_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_evaluations" ADD CONSTRAINT "lab_evaluations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_evaluations" ADD CONSTRAINT "lab_evaluations_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_axes_material_idx" ON "lab_axes" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "lab_dilutions_user_idx" ON "lab_dilutions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lab_evaluations_material_idx" ON "lab_evaluations" USING btree ("material_id");