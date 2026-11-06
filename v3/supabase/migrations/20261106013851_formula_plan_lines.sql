CREATE TABLE "formula_plan_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"formula_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"parts" numeric NOT NULL,
	"shape" text,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formula_plan_lines_material" UNIQUE("formula_id","material_id"),
	CONSTRAINT "formula_plan_lines_parts" CHECK ("formula_plan_lines"."parts" >= 0),
	CONSTRAINT "formula_plan_lines_shape" CHECK ("formula_plan_lines"."shape" is null or "formula_plan_lines"."shape" in ('fleeting', 'top', 'heart', 'plateau', 'linear'))
);
--> statement-breakpoint
ALTER TABLE "formula_plan_lines" ADD CONSTRAINT "formula_plan_lines_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_plan_lines" ADD CONSTRAINT "formula_plan_lines_formula_id_formulas_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formulas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_plan_lines" ADD CONSTRAINT "formula_plan_lines_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "formula_plan_lines_owner_idx" ON "formula_plan_lines" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "formula_plan_lines_formula_idx" ON "formula_plan_lines" USING btree ("formula_id");