CREATE TABLE "ifra_annex" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amendment" text NOT NULL,
	"natural_cas" text NOT NULL,
	"natural_other_cas" text[] DEFAULT '{}'::text[] NOT NULL,
	"natural_name" text NOT NULL,
	"botanical_name" text,
	"iso_category" text,
	"rifm_id" text,
	"constituent_cas" text,
	"constituent_name" text NOT NULL,
	"concentration" numeric NOT NULL,
	"constituent_standard" text,
	"notice" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ifra_annex_concentration" CHECK ("ifra_annex"."concentration" >= 0 and "ifra_annex"."concentration" <= 1)
);
--> statement-breakpoint
CREATE TABLE "ifra_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_id" uuid NOT NULL,
	"category" text NOT NULL,
	"kind" text NOT NULL,
	"max_value" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ifra_limits_once" UNIQUE("standard_id","category"),
	CONSTRAINT "ifra_limits_kind" CHECK ("ifra_limits"."kind" in ('max', 'prohibited')),
	CONSTRAINT "ifra_limits_value" CHECK (("ifra_limits"."kind" = 'max' and "ifra_limits"."max_value" > 0 and "ifra_limits"."max_value" <= 1) or ("ifra_limits"."kind" = 'prohibited' and "ifra_limits"."max_value" is null))
);
--> statement-breakpoint
CREATE TABLE "ifra_spec_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_id" uuid NOT NULL,
	"process" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ifra_spec_exclusions_process" CHECK (length(trim("ifra_spec_exclusions"."process")) > 0)
);
--> statement-breakpoint
CREATE TABLE "ifra_standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"amendment" text NOT NULL,
	"type" text NOT NULL,
	"prohibition" boolean DEFAULT false NOT NULL,
	"restriction" boolean DEFAULT false NOT NULL,
	"specification" boolean DEFAULT false NOT NULL,
	"prohibited_as_such" boolean DEFAULT false NOT NULL,
	"group_key" text NOT NULL,
	"limit_expressed_as" text,
	"limit_expressed_as_cas" text,
	"prohibition_note" text,
	"restriction_note" text,
	"specification_note" text,
	"limit_note" text,
	"phototoxicity_note" text,
	"property" text,
	"scope_note" text,
	"contributions" text,
	"contributions_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ifra_standards_code" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ifra_substances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_id" uuid NOT NULL,
	"cas" text NOT NULL,
	"subgroup" text,
	"synonyms" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ifra_substances_once" UNIQUE("standard_id","cas")
);
--> statement-breakpoint
CREATE TABLE "ifra_variant_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_id" uuid NOT NULL,
	"field" text NOT NULL,
	"match" text NOT NULL,
	"pattern" text NOT NULL,
	"variant" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ifra_variant_rules_field" CHECK ("ifra_variant_rules"."field" in ('species', 'process')),
	CONSTRAINT "ifra_variant_rules_match" CHECK ("ifra_variant_rules"."match" in ('contains', 'starts')),
	CONSTRAINT "ifra_variant_rules_variant" CHECK ("ifra_variant_rules"."variant" in ('prohibited', 'permitted')),
	CONSTRAINT "ifra_variant_rules_pattern" CHECK (length(trim("ifra_variant_rules"."pattern")) > 0)
);
--> statement-breakpoint
ALTER TABLE "ifra_limits" ADD CONSTRAINT "ifra_limits_standard_id_ifra_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."ifra_standards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ifra_spec_exclusions" ADD CONSTRAINT "ifra_spec_exclusions_standard_id_ifra_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."ifra_standards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ifra_substances" ADD CONSTRAINT "ifra_substances_standard_id_ifra_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."ifra_standards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ifra_variant_rules" ADD CONSTRAINT "ifra_variant_rules_standard_id_ifra_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."ifra_standards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ifra_annex_natural_idx" ON "ifra_annex" USING btree ("natural_cas");--> statement-breakpoint
CREATE INDEX "ifra_annex_constituent_idx" ON "ifra_annex" USING btree ("constituent_cas");--> statement-breakpoint
CREATE INDEX "ifra_substances_cas_idx" ON "ifra_substances" USING btree ("cas");