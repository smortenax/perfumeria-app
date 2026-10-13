CREATE TABLE "data_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"single" boolean DEFAULT true NOT NULL,
	"commit" text NOT NULL,
	"batch" text,
	"loaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_version_single_unique" UNIQUE("single"),
	CONSTRAINT "data_version_single" CHECK ("data_version"."single")
);
--> statement-breakpoint
CREATE TABLE "lab_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"material_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_materials_once" UNIQUE("user_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"amount_kind" text NOT NULL,
	"value" numeric,
	"min" numeric,
	"max" numeric,
	"authority" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_components_once" UNIQUE("material_id","component_id","authority","source"),
	CONSTRAINT "material_components_not_itself" CHECK ("material_components"."material_id" <> "material_components"."component_id"),
	CONSTRAINT "material_components_authority" CHECK ("material_components"."authority" in ('lot', 'product', 'ifra', 'literature', 'consensus')),
	CONSTRAINT "material_components_source" CHECK (length(trim("material_components"."source")) > 0),
	CONSTRAINT "material_components_amount" CHECK (case "material_components"."amount_kind"
        when 'exact' then "material_components"."value" is not null and "material_components"."min" is null and "material_components"."max" is null and "material_components"."value" > 0 and "material_components"."value" <= 1
        when 'max' then "material_components"."value" is not null and "material_components"."min" is null and "material_components"."max" is null and "material_components"."value" > 0 and "material_components"."value" <= 1
        when 'range' then "material_components"."value" is null and "material_components"."min" is not null and "material_components"."max" is not null and "material_components"."min" >= 0 and "material_components"."min" <= "material_components"."max" and "material_components"."max" <= 1
        when 'unknown' then "material_components"."value" is null and "material_components"."min" is null and "material_components"."max" is null
        else false end)
);
--> statement-breakpoint
CREATE TABLE "material_doses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"min" numeric,
	"typical" numeric,
	"max" numeric,
	"basis" text NOT NULL,
	"authority" text NOT NULL,
	"source" text NOT NULL,
	"disputed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_doses_basis" CHECK ("material_doses"."basis" in ('concentrate', 'finished_product', 'undeclared')),
	CONSTRAINT "material_doses_authority" CHECK ("material_doses"."authority" in ('lot', 'product', 'ifra', 'literature', 'consensus')),
	CONSTRAINT "material_doses_source" CHECK (length(trim("material_doses"."source")) > 0),
	CONSTRAINT "material_doses_some" CHECK (coalesce("material_doses"."min", "material_doses"."typical", "material_doses"."max") is not null),
	CONSTRAINT "material_doses_values" CHECK (("material_doses"."min" is null or ("material_doses"."min" >= 0 and "material_doses"."min" <= 1)) and ("material_doses"."typical" is null or ("material_doses"."typical" > 0 and "material_doses"."typical" <= 1)) and ("material_doses"."max" is null or ("material_doses"."max" > 0 and "material_doses"."max" <= 1)) and ("material_doses"."min" is null or "material_doses"."max" is null or "material_doses"."min" <= "material_doses"."max"))
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"solvent" boolean DEFAULT false NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"cas" text,
	"other_cas" text[] DEFAULT '{}'::text[] NOT NULL,
	"species" text,
	"part" text,
	"process" text,
	"chemotype" text,
	"inci" text,
	"origin" text,
	"category_id" uuid,
	"form" text,
	"based_on_id" uuid,
	"grade" text,
	"supplier" text,
	"purity" numeric,
	"house" text,
	"code" text,
	"odor_target" text,
	"synthesis" text,
	"isomers" text,
	"family" text,
	"family_detail" text,
	"facets" text,
	"tier" text,
	"evolution" text,
	"tenacity" text,
	"strength" text,
	"threshold" text,
	"diffusion" text,
	"blend_effect" text,
	"role" text,
	"recommended_dilution" text,
	"sources" text,
	"confidence" text,
	"disputed_fields" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_kind" CHECK ("materials"."kind" in ('molecule', 'natural', 'composition', 'provisional', 'frozen')),
	CONSTRAINT "materials_kind_owner" CHECK ("materials"."kind" not in ('provisional', 'frozen') or "materials"."owner_id" is not null),
	CONSTRAINT "materials_not_based_on_itself" CHECK ("materials"."based_on_id" is null or "materials"."based_on_id" <> "materials"."id"),
	CONSTRAINT "materials_purity" CHECK ("materials"."purity" is null or ("materials"."purity" > 0 and "materials"."purity" <= 1)),
	CONSTRAINT "materials_family" CHECK ("materials"."family" is null or "materials"."family" in ('citrus', 'green', 'ozonic', 'floral', 'fruity', 'spicy', 'woody', 'animal', 'transformed')),
	CONSTRAINT "materials_tier" CHECK ("materials"."tier" is null or "materials"."tier" in ('top', 'top_heart', 'heart', 'heart_base', 'base')),
	CONSTRAINT "materials_strength" CHECK ("materials"."strength" is null or "materials"."strength" in ('low', 'medium', 'high', 'very_high')),
	CONSTRAINT "materials_synthesis" CHECK ("materials"."synthesis" is null or "materials"."synthesis" in ('synthetic', 'natural', 'semisynthetic')),
	CONSTRAINT "materials_confidence" CHECK ("materials"."confidence" is null or "materials"."confidence" in ('high', 'medium', 'low'))
);
--> statement-breakpoint
CREATE TABLE "regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"regime" text NOT NULL,
	"category" text,
	"kind" text NOT NULL,
	"max_value" numeric,
	"group_key" text,
	"requirement" text,
	"authority" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regulations_regime" CHECK ("regulations"."regime" in ('ifra', 'manufacturer')),
	CONSTRAINT "regulations_authority" CHECK ("regulations"."authority" in ('lot', 'product', 'ifra', 'literature', 'consensus')),
	CONSTRAINT "regulations_source" CHECK (length(trim("regulations"."source")) > 0),
	CONSTRAINT "regulations_kind" CHECK (case "regulations"."kind"
        when 'max' then "regulations"."max_value" is not null and "regulations"."max_value" >= 0 and "regulations"."max_value" <= 1
        when 'prohibited' then "regulations"."max_value" is null
        when 'requirement' then "regulations"."requirement" is not null and length(trim("regulations"."requirement")) > 0
        else false end)
);
--> statement-breakpoint
ALTER TABLE "lab_materials" ADD CONSTRAINT "lab_materials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_materials" ADD CONSTRAINT "lab_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_components" ADD CONSTRAINT "material_components_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_components" ADD CONSTRAINT "material_components_component_id_materials_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_doses" ADD CONSTRAINT "material_doses_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_category_id_material_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_based_on_id_materials_id_fk" FOREIGN KEY ("based_on_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_materials_material_idx" ON "lab_materials" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "material_components_material_idx" ON "material_components" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "material_components_component_idx" ON "material_components" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "material_doses_material_idx" ON "material_doses" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "materials_owner_idx" ON "materials" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "materials_based_on_idx" ON "materials" USING btree ("based_on_id");--> statement-breakpoint
CREATE INDEX "regulations_material_idx" ON "regulations" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "regulations_group_idx" ON "regulations" USING btree ("group_key");