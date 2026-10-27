CREATE TABLE "macerations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"formula_id" uuid NOT NULL,
	"started_on" date NOT NULL,
	"ended_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "macerations_dates" CHECK ("macerations"."ended_on" is null or "macerations"."ended_on" >= "macerations"."started_on")
);
--> statement-breakpoint
ALTER TABLE "macerations" ADD CONSTRAINT "macerations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "macerations" ADD CONSTRAINT "macerations_formula_id_formulas_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formulas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "macerations_owner_idx" ON "macerations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "macerations_formula_idx" ON "macerations" USING btree ("formula_id");