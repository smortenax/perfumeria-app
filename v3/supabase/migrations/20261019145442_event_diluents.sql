CREATE TABLE "formula_event_diluents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"owner_id" uuid,
	"position" smallint NOT NULL,
	"diluent_id" uuid NOT NULL,
	"fraction" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formula_event_diluents_once" UNIQUE("event_id","position"),
	CONSTRAINT "formula_event_diluents_position" CHECK ("formula_event_diluents"."position" >= 3),
	CONSTRAINT "formula_event_diluents_fraction" CHECK ("formula_event_diluents"."fraction" > 0 and "formula_event_diluents"."fraction" < 1)
);
--> statement-breakpoint
ALTER TABLE "formula_events" ADD COLUMN "dilution_id" uuid;--> statement-breakpoint
ALTER TABLE "formula_event_diluents" ADD CONSTRAINT "formula_event_diluents_event_id_formula_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."formula_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_event_diluents" ADD CONSTRAINT "formula_event_diluents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_event_diluents" ADD CONSTRAINT "formula_event_diluents_diluent_id_materials_id_fk" FOREIGN KEY ("diluent_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "formula_event_diluents_owner_idx" ON "formula_event_diluents" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "formula_events" ADD CONSTRAINT "formula_events_dilution_id_lab_dilutions_id_fk" FOREIGN KEY ("dilution_id") REFERENCES "public"."lab_dilutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_events" ADD CONSTRAINT "formula_events_dilution" CHECK ("formula_events"."dilution_id" is null or "formula_events"."kind" = 'add');