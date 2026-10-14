CREATE TABLE "formula_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"formula_id" uuid NOT NULL,
	"owner_id" uuid,
	"kind" text NOT NULL,
	"material_id" uuid,
	"mass_ug" bigint,
	"fraction" numeric,
	"diluent_id" uuid,
	"second_diluent_id" uuid,
	"second_fraction" numeric,
	"target" uuid,
	"gross_ug" bigint,
	"tare_ug" bigint,
	"text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formula_events_kind" CHECK ("formula_events"."kind" in ('add', 'set_mass', 'remove', 'reweigh', 'note')),
	CONSTRAINT "formula_events_shape" CHECK (case "formula_events"."kind"
        when 'add' then "formula_events"."material_id" is not null and "formula_events"."mass_ug" > 0 and "formula_events"."fraction" > 0 and "formula_events"."fraction" <= 1
          and ("formula_events"."fraction" = 1 or "formula_events"."diluent_id" is not null)
          and (("formula_events"."second_diluent_id" is null and "formula_events"."second_fraction" is null)
            or ("formula_events"."second_diluent_id" is not null and "formula_events"."second_fraction" > 0 and "formula_events"."fraction" + "formula_events"."second_fraction" < 1))
          and "formula_events"."target" is null and "formula_events"."gross_ug" is null and "formula_events"."tare_ug" is null and "formula_events"."text" is null
        when 'set_mass' then "formula_events"."target" is not null and "formula_events"."mass_ug" > 0 and "formula_events"."material_id" is null and "formula_events"."fraction" is null
          and "formula_events"."diluent_id" is null and "formula_events"."gross_ug" is null and "formula_events"."tare_ug" is null and "formula_events"."text" is null
        when 'remove' then "formula_events"."target" is not null and "formula_events"."material_id" is null and "formula_events"."mass_ug" is null and "formula_events"."fraction" is null
          and "formula_events"."diluent_id" is null and "formula_events"."gross_ug" is null and "formula_events"."tare_ug" is null and "formula_events"."text" is null
        when 'reweigh' then "formula_events"."gross_ug" is not null and "formula_events"."tare_ug" >= 0 and "formula_events"."gross_ug" > "formula_events"."tare_ug" and "formula_events"."material_id" is null
          and "formula_events"."mass_ug" is null and "formula_events"."target" is null and "formula_events"."text" is null
        when 'note' then length(trim(coalesce("formula_events"."text", ''))) > 0 and "formula_events"."material_id" is null and "formula_events"."mass_ug" is null
          and "formula_events"."target" is null and "formula_events"."gross_ug" is null
        else false end)
);
--> statement-breakpoint
CREATE TABLE "formulas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"workbench_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"intention" text DEFAULT '' NOT NULL,
	"container_capacity_ml" numeric,
	"container_tare_ug" bigint,
	"work_batch_ug" bigint,
	"final_batch_ug" bigint,
	"markers" text[] DEFAULT '{}'::text[] NOT NULL,
	"role" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formulas_name" CHECK (length(trim("formulas"."name")) > 0),
	CONSTRAINT "formulas_markers" CHECK ("formulas"."markers" <@ array['accord', 'finished']::text[]),
	CONSTRAINT "formulas_not_own_parent" CHECK ("formulas"."parent_id" is null or "formulas"."parent_id" <> "formulas"."id"),
	CONSTRAINT "formulas_capacity" CHECK ("formulas"."container_capacity_ml" is null or "formulas"."container_capacity_ml" > 0),
	CONSTRAINT "formulas_tare" CHECK ("formulas"."container_tare_ug" is null or "formulas"."container_tare_ug" >= 0),
	CONSTRAINT "formulas_batches" CHECK (("formulas"."work_batch_ug" is null or "formulas"."work_batch_ug" > 0) and ("formulas"."final_batch_ug" is null or "formulas"."final_batch_ug" > 0))
);
--> statement-breakpoint
CREATE TABLE "workbenches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workbenches_name" CHECK (length(trim("workbenches"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "source_formula_id" uuid;--> statement-breakpoint
ALTER TABLE "formula_events" ADD CONSTRAINT "formula_events_formula_id_formulas_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formulas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_events" ADD CONSTRAINT "formula_events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_events" ADD CONSTRAINT "formula_events_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_events" ADD CONSTRAINT "formula_events_diluent_id_materials_id_fk" FOREIGN KEY ("diluent_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_events" ADD CONSTRAINT "formula_events_second_diluent_id_materials_id_fk" FOREIGN KEY ("second_diluent_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_workbench_id_workbenches_id_fk" FOREIGN KEY ("workbench_id") REFERENCES "public"."workbenches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_parent_id_formulas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."formulas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbenches" ADD CONSTRAINT "workbenches_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "formula_events_formula_idx" ON "formula_events" USING btree ("formula_id");--> statement-breakpoint
CREATE INDEX "formula_events_owner_idx" ON "formula_events" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "formulas_owner_idx" ON "formulas" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "formulas_workbench_idx" ON "formulas" USING btree ("workbench_id");--> statement-breakpoint
CREATE INDEX "formulas_parent_idx" ON "formulas" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "workbenches_owner_idx" ON "workbenches" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_source_formula_id_formulas_id_fk" FOREIGN KEY ("source_formula_id") REFERENCES "public"."formulas"("id") ON DELETE set null ON UPDATE no action;