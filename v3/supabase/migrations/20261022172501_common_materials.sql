CREATE SCHEMA "common";
--> statement-breakpoint
CREATE TABLE "common"."allergen_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"label_name" text NOT NULL,
	"list" text NOT NULL,
	"in_force_new" date,
	"in_force_existing" date,
	"leave_on_threshold" numeric,
	"rinse_off_threshold" numeric,
	"condition" text,
	"batch_id" uuid,
	CONSTRAINT "allergen_entries_label" UNIQUE("label_name"),
	CONSTRAINT "allergen_entries_list" CHECK ("common"."allergen_entries"."list" in ('eu_26', 'eu_extended')),
	CONSTRAINT "allergen_entries_thresholds" CHECK (("common"."allergen_entries"."leave_on_threshold" is null or ("common"."allergen_entries"."leave_on_threshold" >= 0 and "common"."allergen_entries"."leave_on_threshold" <= 1)) and ("common"."allergen_entries"."rinse_off_threshold" is null or ("common"."allergen_entries"."rinse_off_threshold" >= 0 and "common"."allergen_entries"."rinse_off_threshold" <= 1)))
);
--> statement-breakpoint
CREATE TABLE "common"."allergen_substances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entry_id" uuid NOT NULL,
	"substance_id" uuid NOT NULL,
	"batch_id" uuid,
	CONSTRAINT "allergen_substances_once" UNIQUE("entry_id","substance_id")
);
--> statement-breakpoint
CREATE TABLE "common"."amendments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"notified_on" date,
	"in_force_new" date,
	"in_force_existing" date,
	"batch_id" uuid,
	CONSTRAINT "amendments_number" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "common"."attributes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"group" text NOT NULL,
	"value_type" text NOT NULL,
	"unit" text,
	"is_list" boolean DEFAULT false NOT NULL,
	"vocabulary_list" text,
	"applies_to" text DEFAULT 'all' NOT NULL,
	"sort" integer,
	"batch_id" uuid,
	CONSTRAINT "attributes_code" UNIQUE("code"),
	CONSTRAINT "attributes_group" CHECK ("common"."attributes"."group" in ('pure', 'natural', 'blend', 'product', 'olfactory', 'performance', 'physical')),
	CONSTRAINT "attributes_value_type" CHECK ("common"."attributes"."value_type" in ('number', 'range', 'text', 'list', 'boolean')),
	CONSTRAINT "attributes_vocabulary_list" CHECK (("common"."attributes"."vocabulary_list" is null) = (not "common"."attributes"."is_list") and ("common"."attributes"."vocabulary_list" is null or "common"."attributes"."vocabulary_list" in ('family', 'subfamily', 'descriptor', 'part', 'process', 'treatment', 'isomeric_form', 'physical_state', 'role', 'note', 'country', 'relation_type', 'text_type'))),
	CONSTRAINT "attributes_applies_to" CHECK ("common"."attributes"."applies_to" in ('pure', 'natural', 'blend', 'product', 'all'))
);
--> statement-breakpoint
CREATE TABLE "common"."batches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"loaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"script" text NOT NULL,
	"source_id" uuid,
	"status" text DEFAULT 'proposed' NOT NULL,
	"approval" text,
	"commit" text,
	"sha256" text,
	CONSTRAINT "batches_code" UNIQUE("code"),
	CONSTRAINT "batches_status" CHECK ("common"."batches"."status" in ('proposed', 'approved', 'reverted'))
);
--> statement-breakpoint
CREATE TABLE "common"."claim_terms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"claim_id" uuid NOT NULL,
	"list" text NOT NULL,
	"vocabulary_id" uuid NOT NULL,
	"percentage" numeric,
	"sort" integer,
	"batch_id" uuid,
	CONSTRAINT "claim_terms_once" UNIQUE("claim_id","vocabulary_id"),
	CONSTRAINT "claim_terms_percentage" CHECK (("common"."claim_terms"."percentage" is null or ("common"."claim_terms"."percentage" >= 0 and "common"."claim_terms"."percentage" <= 1)))
);
--> statement-breakpoint
CREATE TABLE "common"."claims" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"product_id" uuid,
	"attribute_id" uuid NOT NULL,
	"original_value" text,
	"original_unit" text,
	"value_min" numeric,
	"value_max" numeric,
	"value_text" text,
	"scale_id" uuid,
	"dilution" numeric,
	"solvent_material_id" uuid,
	"temperature_c" numeric,
	"pressure" text,
	"support" text,
	"source_id" uuid NOT NULL,
	"derived_from_id" uuid,
	"rank" text DEFAULT 'normal' NOT NULL,
	"reason" text,
	"quote" text,
	"batch_id" uuid,
	CONSTRAINT "claims_rank" CHECK ("common"."claims"."rank" in ('star', 'normal', 'discarded', 'disputed')),
	CONSTRAINT "claims_support" CHECK ("common"."claims"."support" is null or "common"."claims"."support" in ('strip', 'skin')),
	CONSTRAINT "claims_dilution" CHECK ("common"."claims"."dilution" is null or ("common"."claims"."dilution" > 0 and "common"."claims"."dilution" <= 1)),
	CONSTRAINT "claims_range" CHECK ("common"."claims"."value_min" is null or "common"."claims"."value_max" is null or "common"."claims"."value_min" <= "common"."claims"."value_max"),
	CONSTRAINT "claims_not_derived_from_itself" CHECK ("common"."claims"."derived_from_id" is null or "common"."claims"."derived_from_id" <> "common"."claims"."id")
);
--> statement-breakpoint
CREATE TABLE "common"."companies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"country_list" text GENERATED ALWAYS AS ('country') STORED,
	"country_id" uuid,
	"website" text,
	"batch_id" uuid,
	CONSTRAINT "companies_name" UNIQUE("name"),
	CONSTRAINT "companies_role" CHECK ("common"."companies"."role" is null or "common"."companies"."role" in ('manufacturer', 'distributor', 'laboratory'))
);
--> statement-breakpoint
CREATE TABLE "common"."composition_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"composition_id" uuid NOT NULL,
	"substance_id" uuid NOT NULL,
	"amount_kind" text NOT NULL,
	"value" numeric,
	"min" numeric,
	"max" numeric,
	"defines" boolean DEFAULT false NOT NULL,
	"batch_id" uuid,
	CONSTRAINT "composition_lines_once" UNIQUE("composition_id","substance_id"),
	CONSTRAINT "composition_lines_amount_kind" CHECK ("common"."composition_lines"."amount_kind" in ('typical', 'max', 'range', 'unspecified')),
	CONSTRAINT "composition_lines_amount" CHECK (case "common"."composition_lines"."amount_kind"
      when 'range' then "common"."composition_lines"."value" is null and "common"."composition_lines"."min" is not null and "common"."composition_lines"."max" is not null and "common"."composition_lines"."min" >= 0 and "common"."composition_lines"."min" <= "common"."composition_lines"."max" and "common"."composition_lines"."max" <= 1
      else "common"."composition_lines"."value" is not null and "common"."composition_lines"."min" is null and "common"."composition_lines"."max" is null and "common"."composition_lines"."value" > 0 and "common"."composition_lines"."value" <= 1 end)
);
--> statement-breakpoint
CREATE TABLE "common"."compositions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid,
	"product_id" uuid,
	"authority" text NOT NULL,
	"document_id" uuid,
	"source_id" uuid,
	"page" integer,
	"quote" text,
	"dated_on" date,
	"incomplete" boolean DEFAULT false NOT NULL,
	"batch_id" uuid,
	CONSTRAINT "compositions_one_owner" CHECK (("common"."compositions"."material_id" is null) <> ("common"."compositions"."product_id" is null)),
	CONSTRAINT "compositions_authority" CHECK ("common"."compositions"."authority" in ('product', 'literature', 'consensus'))
);
--> statement-breakpoint
CREATE TABLE "common"."documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"file_url" text,
	"issued_on" date,
	"amendment_id" uuid,
	"pages" integer,
	"batch_id" uuid,
	CONSTRAINT "documents_kind" CHECK ("common"."documents"."kind" in ('sds', 'ifra_certificate', 'allergens', 'analysis', 'specification', 'other'))
);
--> statement-breakpoint
CREATE TABLE "common"."equivalences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"source_term" text NOT NULL,
	"list" text NOT NULL,
	"vocabulary_id" uuid NOT NULL,
	"note" text,
	"batch_id" uuid,
	CONSTRAINT "equivalences_once" UNIQUE("source_id","list","source_term")
);
--> statement-breakpoint
CREATE TABLE "common"."identifiers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"value" text NOT NULL,
	"source_id" uuid,
	"batch_id" uuid,
	CONSTRAINT "identifiers_once" UNIQUE("material_id","kind","value"),
	CONSTRAINT "identifiers_kind" CHECK ("common"."identifiers"."kind" in ('inci', 'fema', 'einecs', 'synonym', 'trade_name', 'chemical_name', 'other_language', 'other'))
);
--> statement-breakpoint
CREATE TABLE "common"."ifra_annex" (
	"id" uuid PRIMARY KEY NOT NULL,
	"amendment_id" uuid NOT NULL,
	"natural_substance_id" uuid,
	"constituent_substance_id" uuid NOT NULL,
	"concentration" numeric NOT NULL,
	"natural_name" text NOT NULL,
	"botanical_name" text,
	"iso_category" text,
	"rifm_id" text,
	"constituent_standard" text,
	"notice" text,
	"batch_id" uuid,
	CONSTRAINT "ifra_annex_concentration" CHECK ("common"."ifra_annex"."concentration" >= 0 and "common"."ifra_annex"."concentration" <= 1)
);
--> statement-breakpoint
CREATE TABLE "common"."ifra_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"amendment_id" uuid NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"batch_id" uuid,
	CONSTRAINT "ifra_categories_once" UNIQUE("amendment_id","code")
);
--> statement-breakpoint
CREATE TABLE "common"."ifra_limits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"standard_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"max_value" numeric,
	"batch_id" uuid,
	CONSTRAINT "ifra_limits_once" UNIQUE("standard_id","category_id"),
	CONSTRAINT "ifra_limits_kind" CHECK ("common"."ifra_limits"."kind" in ('max', 'prohibited')),
	CONSTRAINT "ifra_limits_value" CHECK (("common"."ifra_limits"."kind" = 'max' and "common"."ifra_limits"."max_value" > 0 and "common"."ifra_limits"."max_value" <= 1) or ("common"."ifra_limits"."kind" = 'prohibited' and "common"."ifra_limits"."max_value" is null))
);
--> statement-breakpoint
CREATE TABLE "common"."ifra_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"standard_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"field" text,
	"match" text,
	"pattern" text,
	"variant" text,
	"note" text,
	"batch_id" uuid,
	CONSTRAINT "ifra_rules_kind" CHECK ("common"."ifra_rules"."kind" in ('variant', 'specification_exclusion'))
);
--> statement-breakpoint
CREATE TABLE "common"."ifra_standards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"amendment_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"last_amended" integer,
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
	"batch_id" uuid,
	CONSTRAINT "ifra_standards_once" UNIQUE("amendment_id","code")
);
--> statement-breakpoint
CREATE TABLE "common"."ifra_substances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"standard_id" uuid NOT NULL,
	"substance_id" uuid NOT NULL,
	"original_cas" text NOT NULL,
	"subgroup" text,
	"synonyms" text[] DEFAULT '{}'::text[] NOT NULL,
	"batch_id" uuid,
	CONSTRAINT "ifra_substances_once" UNIQUE("standard_id","original_cas")
);
--> statement-breakpoint
CREATE TABLE "common"."manufacturer_caps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"cap" numeric NOT NULL,
	"document_id" uuid,
	"batch_id" uuid,
	CONSTRAINT "manufacturer_caps_cap" CHECK ("common"."manufacturer_caps"."cap" > 0 and "common"."manufacturer_caps"."cap" <= 1)
);
--> statement-breakpoint
CREATE TABLE "common"."material_texts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"kind_list" text GENERATED ALWAYS AS ('text_type') STORED,
	"kind_id" uuid NOT NULL,
	"text" text NOT NULL,
	"language" text,
	"source_id" uuid,
	"batch_id" uuid
);
--> statement-breakpoint
CREATE TABLE "common"."materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ticker" text,
	"ticker_origin" text,
	"type" text NOT NULL,
	"origin" text,
	"is_solvent" boolean DEFAULT false NOT NULL,
	"substance_id" uuid,
	"isomeric_form_list" text GENERATED ALWAYS AS ('isomeric_form') STORED,
	"isomeric_form_id" uuid,
	"species" text,
	"part_list" text GENERATED ALWAYS AS ('part') STORED,
	"part_id" uuid,
	"process_list" text GENERATED ALWAYS AS ('process') STORED,
	"process_id" uuid,
	"chemotype" text,
	"company_id" uuid,
	"identity_key" text NOT NULL,
	"merged_into_id" uuid,
	"batch_id" uuid,
	CONSTRAINT "materials_identity_key" UNIQUE("identity_key"),
	CONSTRAINT "materials_ticker" UNIQUE("ticker"),
	CONSTRAINT "materials_type" CHECK ("common"."materials"."type" in ('pure', 'natural', 'blend')),
	CONSTRAINT "materials_ticker_origin" CHECK ("common"."materials"."ticker_origin" is null or "common"."materials"."ticker_origin" in ('own', 'fig', 'ifra', 'session')),
	CONSTRAINT "materials_origin" CHECK ("common"."materials"."origin" is null or "common"."materials"."origin" in ('synthetic', 'natural_isolate', 'biotech', 'semisynthetic', 'natural')),
	CONSTRAINT "materials_by_type" CHECK (case "common"."materials"."type"
        when 'pure' then "common"."materials"."substance_id" is not null and "common"."materials"."species" is null and "common"."materials"."part_id" is null and "common"."materials"."process_id" is null and "common"."materials"."chemotype" is null and "common"."materials"."company_id" is null
        when 'natural' then "common"."materials"."species" is not null and "common"."materials"."isomeric_form_id" is null and "common"."materials"."company_id" is null
        when 'blend' then "common"."materials"."company_id" is not null and "common"."materials"."species" is null and "common"."materials"."part_id" is null and "common"."materials"."process_id" is null and "common"."materials"."chemotype" is null and "common"."materials"."isomeric_form_id" is null
        else false end),
	CONSTRAINT "materials_not_merged_into_itself" CHECK ("common"."materials"."merged_into_id" is null or "common"."materials"."merged_into_id" <> "common"."materials"."id")
);
--> statement-breakpoint
CREATE TABLE "common"."natural_treatments" (
	"material_id" uuid NOT NULL,
	"treatment_list" text GENERATED ALWAYS AS ('treatment') STORED,
	"treatment_id" uuid NOT NULL,
	"batch_id" uuid,
	CONSTRAINT "natural_treatments_pk" PRIMARY KEY("material_id","treatment_id")
);
--> statement-breakpoint
CREATE TABLE "common"."products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"trade_name" text NOT NULL,
	"code" text,
	"captive" boolean,
	"grade" text,
	"dilution" numeric,
	"solvent_material_id" uuid,
	"status" text,
	"batch_id" uuid,
	CONSTRAINT "products_once" UNIQUE("material_id","company_id","trade_name"),
	CONSTRAINT "products_id_material" UNIQUE("id","material_id"),
	CONSTRAINT "products_dilution" CHECK ("common"."products"."dilution" is null or ("common"."products"."dilution" > 0 and "common"."products"."dilution" <= 1)),
	CONSTRAINT "products_status" CHECK ("common"."products"."status" is null or "common"."products"."status" in ('in_catalog', 'discontinued'))
);
--> statement-breakpoint
CREATE TABLE "common"."reference_perfumes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"perfume" text NOT NULL,
	"house" text,
	"year" integer,
	"source_id" uuid,
	"batch_id" uuid
);
--> statement-breakpoint
CREATE TABLE "common"."relations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"kind_list" text GENERATED ALWAYS AS ('relation_type') STORED,
	"kind_id" uuid NOT NULL,
	"other_id" uuid NOT NULL,
	"source_id" uuid,
	"note" text,
	"batch_id" uuid,
	CONSTRAINT "relations_not_itself" CHECK ("common"."relations"."material_id" <> "common"."relations"."other_id")
);
--> statement-breakpoint
CREATE TABLE "common"."scales" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"source_id" uuid,
	"attribute_id" uuid NOT NULL,
	"min" numeric,
	"max" numeric,
	"rule" text NOT NULL,
	"points" jsonb,
	"batch_id" uuid,
	CONSTRAINT "scales_name" UNIQUE("name"),
	CONSTRAINT "scales_rule" CHECK ("common"."scales"."rule" in ('min_max', 'points', 'unconverted'))
);
--> statement-breakpoint
CREATE TABLE "common"."sheet_composition" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sheet_id" uuid NOT NULL,
	"substance_id" uuid NOT NULL,
	"amount_kind" text NOT NULL,
	"value" numeric,
	"min" numeric,
	"max" numeric,
	"authority" text NOT NULL,
	"origin" text NOT NULL,
	"origin_id" uuid,
	CONSTRAINT "sheet_composition_once" UNIQUE("sheet_id","substance_id"),
	CONSTRAINT "sheet_composition_amount_kind" CHECK ("common"."sheet_composition"."amount_kind" in ('typical', 'max', 'range', 'unspecified')),
	CONSTRAINT "sheet_composition_amount" CHECK (case "common"."sheet_composition"."amount_kind"
      when 'range' then "common"."sheet_composition"."value" is null and "common"."sheet_composition"."min" is not null and "common"."sheet_composition"."max" is not null and "common"."sheet_composition"."min" >= 0 and "common"."sheet_composition"."min" <= "common"."sheet_composition"."max" and "common"."sheet_composition"."max" <= 1
      else "common"."sheet_composition"."value" is not null and "common"."sheet_composition"."min" is null and "common"."sheet_composition"."max" is null and "common"."sheet_composition"."value" > 0 and "common"."sheet_composition"."value" <= 1 end),
	CONSTRAINT "sheet_composition_authority" CHECK ("common"."sheet_composition"."authority" in ('product', 'ifra', 'literature', 'consensus', 'identity')),
	CONSTRAINT "sheet_composition_origin" CHECK ("common"."sheet_composition"."origin" in ('compositions', 'ifra_annex', 'identity'))
);
--> statement-breakpoint
CREATE TABLE "common"."sheets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"product_id" uuid,
	"name" text NOT NULL,
	"trade_name" text,
	"ticker" text,
	"type" text NOT NULL,
	"identity_key" text NOT NULL,
	"family_list" text GENERATED ALWAYS AS ('family') STORED,
	"family_id" uuid,
	"duration_h" numeric,
	"working_dilution" text,
	"density" numeric,
	"note_list" text GENERATED ALWAYS AS ('note') STORED,
	"note_id" uuid,
	"values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sheets_once" UNIQUE NULLS NOT DISTINCT("material_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "common"."sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"kind" text NOT NULL,
	"consulted_on" date,
	"notes" text,
	CONSTRAINT "sources_name" UNIQUE("name"),
	CONSTRAINT "sources_kind" CHECK ("common"."sources"."kind" in ('web', 'manufacturer_document', 'laboratory', 'own', 'regulation'))
);
--> statement-breakpoint
CREATE TABLE "common"."substance_aliases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"substance_id" uuid NOT NULL,
	"cas_alias" text NOT NULL,
	"reason" text,
	"batch_id" uuid,
	CONSTRAINT "substance_aliases_cas" UNIQUE("cas_alias"),
	CONSTRAINT "substance_aliases_cas_format" CHECK ("common"."substance_aliases"."cas_alias" ~ '^[0-9]{2,7}-[0-9]{2}-[0-9]$')
);
--> statement-breakpoint
CREATE TABLE "common"."substances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cas" text,
	"name" text NOT NULL,
	"kind" text DEFAULT 'defined' NOT NULL,
	"formula" text,
	"molecular_weight" numeric,
	"smiles" text,
	"inchikey" text,
	"pubchem_cid" bigint,
	"batch_id" uuid,
	CONSTRAINT "substances_cas" UNIQUE("cas"),
	CONSTRAINT "substances_cas_format" CHECK ("common"."substances"."cas" is null or "common"."substances"."cas" ~ '^[0-9]{2,7}-[0-9]{2}-[0-9]$'),
	CONSTRAINT "substances_kind" CHECK ("common"."substances"."kind" in ('defined', 'natural_uvcb', 'group'))
);
--> statement-breakpoint
CREATE TABLE "common"."vocabularies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"list" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"color" text,
	"sort" integer,
	"batch_id" uuid,
	CONSTRAINT "vocabularies_list_code" UNIQUE("list","code"),
	CONSTRAINT "vocabularies_list_id" UNIQUE("list","id"),
	CONSTRAINT "vocabularies_list" CHECK ("common"."vocabularies"."list" in ('family', 'subfamily', 'descriptor', 'part', 'process', 'treatment', 'isomeric_form', 'physical_state', 'role', 'note', 'country', 'relation_type', 'text_type'))
);
--> statement-breakpoint
ALTER TABLE "common"."allergen_entries" ADD CONSTRAINT "allergen_entries_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."allergen_substances" ADD CONSTRAINT "allergen_substances_entry_id_allergen_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "common"."allergen_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."allergen_substances" ADD CONSTRAINT "allergen_substances_substance_id_substances_id_fk" FOREIGN KEY ("substance_id") REFERENCES "common"."substances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."allergen_substances" ADD CONSTRAINT "allergen_substances_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."amendments" ADD CONSTRAINT "amendments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."attributes" ADD CONSTRAINT "attributes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."batches" ADD CONSTRAINT "batches_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claim_terms" ADD CONSTRAINT "claim_terms_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "common"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claim_terms" ADD CONSTRAINT "claim_terms_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claim_terms" ADD CONSTRAINT "claim_terms_term" FOREIGN KEY ("list","vocabulary_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "common"."attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_scale_id_scales_id_fk" FOREIGN KEY ("scale_id") REFERENCES "common"."scales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_solvent_material_id_materials_id_fk" FOREIGN KEY ("solvent_material_id") REFERENCES "common"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_derived_from_id_claims_id_fk" FOREIGN KEY ("derived_from_id") REFERENCES "common"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."claims" ADD CONSTRAINT "claims_product_of_material" FOREIGN KEY ("product_id","material_id") REFERENCES "common"."products"("id","material_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."companies" ADD CONSTRAINT "companies_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."companies" ADD CONSTRAINT "companies_country" FOREIGN KEY ("country_list","country_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."composition_lines" ADD CONSTRAINT "composition_lines_composition_id_compositions_id_fk" FOREIGN KEY ("composition_id") REFERENCES "common"."compositions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."composition_lines" ADD CONSTRAINT "composition_lines_substance_id_substances_id_fk" FOREIGN KEY ("substance_id") REFERENCES "common"."substances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."composition_lines" ADD CONSTRAINT "composition_lines_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."compositions" ADD CONSTRAINT "compositions_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."compositions" ADD CONSTRAINT "compositions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "common"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."compositions" ADD CONSTRAINT "compositions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "common"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."compositions" ADD CONSTRAINT "compositions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."compositions" ADD CONSTRAINT "compositions_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."documents" ADD CONSTRAINT "documents_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "common"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."documents" ADD CONSTRAINT "documents_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "common"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."documents" ADD CONSTRAINT "documents_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."equivalences" ADD CONSTRAINT "equivalences_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."equivalences" ADD CONSTRAINT "equivalences_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."equivalences" ADD CONSTRAINT "equivalences_term" FOREIGN KEY ("list","vocabulary_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."identifiers" ADD CONSTRAINT "identifiers_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."identifiers" ADD CONSTRAINT "identifiers_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."identifiers" ADD CONSTRAINT "identifiers_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_annex" ADD CONSTRAINT "ifra_annex_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "common"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_annex" ADD CONSTRAINT "ifra_annex_natural_substance_id_substances_id_fk" FOREIGN KEY ("natural_substance_id") REFERENCES "common"."substances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_annex" ADD CONSTRAINT "ifra_annex_constituent_substance_id_substances_id_fk" FOREIGN KEY ("constituent_substance_id") REFERENCES "common"."substances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_annex" ADD CONSTRAINT "ifra_annex_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_categories" ADD CONSTRAINT "ifra_categories_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "common"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_categories" ADD CONSTRAINT "ifra_categories_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_limits" ADD CONSTRAINT "ifra_limits_standard_id_ifra_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "common"."ifra_standards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_limits" ADD CONSTRAINT "ifra_limits_category_id_ifra_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "common"."ifra_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_limits" ADD CONSTRAINT "ifra_limits_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_rules" ADD CONSTRAINT "ifra_rules_standard_id_ifra_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "common"."ifra_standards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_rules" ADD CONSTRAINT "ifra_rules_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_standards" ADD CONSTRAINT "ifra_standards_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "common"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_standards" ADD CONSTRAINT "ifra_standards_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_substances" ADD CONSTRAINT "ifra_substances_standard_id_ifra_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "common"."ifra_standards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_substances" ADD CONSTRAINT "ifra_substances_substance_id_substances_id_fk" FOREIGN KEY ("substance_id") REFERENCES "common"."substances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."ifra_substances" ADD CONSTRAINT "ifra_substances_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."manufacturer_caps" ADD CONSTRAINT "manufacturer_caps_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "common"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."manufacturer_caps" ADD CONSTRAINT "manufacturer_caps_category_id_ifra_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "common"."ifra_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."manufacturer_caps" ADD CONSTRAINT "manufacturer_caps_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "common"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."manufacturer_caps" ADD CONSTRAINT "manufacturer_caps_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."material_texts" ADD CONSTRAINT "material_texts_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."material_texts" ADD CONSTRAINT "material_texts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."material_texts" ADD CONSTRAINT "material_texts_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."material_texts" ADD CONSTRAINT "material_texts_kind" FOREIGN KEY ("kind_list","kind_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."materials" ADD CONSTRAINT "materials_substance_id_substances_id_fk" FOREIGN KEY ("substance_id") REFERENCES "common"."substances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."materials" ADD CONSTRAINT "materials_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "common"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."materials" ADD CONSTRAINT "materials_merged_into_id_materials_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "common"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."materials" ADD CONSTRAINT "materials_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."materials" ADD CONSTRAINT "materials_isomeric_form" FOREIGN KEY ("isomeric_form_list","isomeric_form_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."materials" ADD CONSTRAINT "materials_part" FOREIGN KEY ("part_list","part_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."materials" ADD CONSTRAINT "materials_process" FOREIGN KEY ("process_list","process_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."natural_treatments" ADD CONSTRAINT "natural_treatments_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."natural_treatments" ADD CONSTRAINT "natural_treatments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."natural_treatments" ADD CONSTRAINT "natural_treatments_term" FOREIGN KEY ("treatment_list","treatment_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."products" ADD CONSTRAINT "products_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "common"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."products" ADD CONSTRAINT "products_solvent_material_id_materials_id_fk" FOREIGN KEY ("solvent_material_id") REFERENCES "common"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."products" ADD CONSTRAINT "products_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."reference_perfumes" ADD CONSTRAINT "reference_perfumes_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."reference_perfumes" ADD CONSTRAINT "reference_perfumes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."reference_perfumes" ADD CONSTRAINT "reference_perfumes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."relations" ADD CONSTRAINT "relations_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."relations" ADD CONSTRAINT "relations_other_id_materials_id_fk" FOREIGN KEY ("other_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."relations" ADD CONSTRAINT "relations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."relations" ADD CONSTRAINT "relations_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."relations" ADD CONSTRAINT "relations_kind" FOREIGN KEY ("kind_list","kind_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."scales" ADD CONSTRAINT "scales_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "common"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."scales" ADD CONSTRAINT "scales_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "common"."attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."scales" ADD CONSTRAINT "scales_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."sheet_composition" ADD CONSTRAINT "sheet_composition_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "common"."sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."sheet_composition" ADD CONSTRAINT "sheet_composition_substance_id_substances_id_fk" FOREIGN KEY ("substance_id") REFERENCES "common"."substances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."sheets" ADD CONSTRAINT "sheets_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "common"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."sheets" ADD CONSTRAINT "sheets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "common"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."sheets" ADD CONSTRAINT "sheets_family" FOREIGN KEY ("family_list","family_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."sheets" ADD CONSTRAINT "sheets_note" FOREIGN KEY ("note_list","note_id") REFERENCES "common"."vocabularies"("list","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."substance_aliases" ADD CONSTRAINT "substance_aliases_substance_id_substances_id_fk" FOREIGN KEY ("substance_id") REFERENCES "common"."substances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."substance_aliases" ADD CONSTRAINT "substance_aliases_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."substances" ADD CONSTRAINT "substances_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."vocabularies" ADD CONSTRAINT "vocabularies_parent_id_vocabularies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "common"."vocabularies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common"."vocabularies" ADD CONSTRAINT "vocabularies_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "common"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claims_material" ON "common"."claims" USING btree ("material_id","attribute_id");--> statement-breakpoint
CREATE INDEX "identifiers_value" ON "common"."identifiers" USING btree ("value");--> statement-breakpoint
CREATE INDEX "ifra_annex_natural" ON "common"."ifra_annex" USING btree ("natural_substance_id");--> statement-breakpoint
CREATE INDEX "ifra_substances_substance" ON "common"."ifra_substances" USING btree ("substance_id");--> statement-breakpoint
CREATE INDEX "materials_substance" ON "common"."materials" USING btree ("substance_id");