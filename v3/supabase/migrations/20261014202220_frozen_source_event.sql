ALTER TABLE "materials" DROP CONSTRAINT "materials_source_formula_id_formulas_id_fk";
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "source_event_id" uuid;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_source_event_id_formula_events_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."formula_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_source_formula_id_formulas_id_fk" FOREIGN KEY ("source_formula_id") REFERENCES "public"."formulas"("id") ON DELETE restrict ON UPDATE no action;