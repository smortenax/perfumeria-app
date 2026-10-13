ALTER TABLE "material_components" DROP CONSTRAINT "material_components_amount";--> statement-breakpoint
ALTER TABLE "material_components" ADD CONSTRAINT "material_components_amount" CHECK (case "material_components"."amount_kind"
        when 'exact' then "material_components"."value" is not null and "material_components"."min" is null and "material_components"."max" is null and "material_components"."value" >= 0 and "material_components"."value" <= 1
        when 'max' then "material_components"."value" is not null and "material_components"."min" is null and "material_components"."max" is null and "material_components"."value" > 0 and "material_components"."value" <= 1
        when 'range' then "material_components"."value" is null and "material_components"."min" is not null and "material_components"."max" is not null and "material_components"."min" >= 0 and "material_components"."min" <= "material_components"."max" and "material_components"."max" <= 1
        when 'unknown' then "material_components"."value" is null and "material_components"."min" is null and "material_components"."max" is null
        else false end);