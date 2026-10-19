-- Your tastings (V3-60 to V3-63): only yours, read and written by you. A strip is of one of your
-- sessions, about a material you can see, from one of your dilutions; every row below hangs from
-- one of yours. Nothing here writes in materials. The opening (t0) is written once and never
-- changed; the comparison with the sources opens only with the series closed.
CREATE FUNCTION public.tasting_session_owned(session uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.tasting_sessions s WHERE s.id = session AND s.user_id = (SELECT auth.uid()))
$$;
--> statement-breakpoint
CREATE FUNCTION public.tasting_strip_owned(strip uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.tasting_strips s WHERE s.id = strip AND s.user_id = (SELECT auth.uid()))
$$;
--> statement-breakpoint
CREATE FUNCTION public.tasting_moment_owned(tab uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.tasting_moments m WHERE m.id = tab AND m.user_id = (SELECT auth.uid()))
$$;
--> statement-breakpoint
CREATE FUNCTION public.lab_dilution_owned(dilution uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.lab_dilutions d WHERE d.id = dilution AND d.user_id = (SELECT auth.uid()))
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.tasting_session_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.tasting_strip_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.tasting_moment_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.lab_dilution_owned(uuid) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.tasting_session_owned(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.tasting_strip_owned(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.tasting_moment_owned(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.lab_dilution_owned(uuid) TO authenticated;
--> statement-breakpoint
ALTER TABLE "tasting_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasting_strips" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasting_moments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasting_families" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasting_battery" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasting_curve" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasting_closures" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasting_marks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tasting_sessions: own" ON "tasting_sessions"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
--> statement-breakpoint
CREATE POLICY "tasting_strips: own" ON "tasting_strips"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.tasting_session_owned(session_id)
    AND public.material_visible(material_id)
    AND (dilution_id IS NULL OR public.lab_dilution_owned(dilution_id))
  );
--> statement-breakpoint
CREATE POLICY "tasting_moments: own" ON "tasting_moments"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.tasting_strip_owned(strip_id));
--> statement-breakpoint
CREATE POLICY "tasting_closures: own" ON "tasting_closures"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.tasting_strip_owned(strip_id));
--> statement-breakpoint
CREATE POLICY "tasting_families: own" ON "tasting_families"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.tasting_moment_owned(moment_id));
--> statement-breakpoint
CREATE POLICY "tasting_battery: own" ON "tasting_battery"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.tasting_moment_owned(moment_id));
--> statement-breakpoint
CREATE POLICY "tasting_curve: own" ON "tasting_curve"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.tasting_moment_owned(moment_id));
--> statement-breakpoint
CREATE POLICY "tasting_marks: own" ON "tasting_marks"
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.material_visible(material_id));
--> statement-breakpoint

-- Whoever writes (also a loading script): each row is its parent's owner's, and that owner does not change.
CREATE FUNCTION public.check_tasting_strip() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.session_id IS DISTINCT FROM OLD.session_id OR NEW.material_id IS DISTINCT FROM OLD.material_id) THEN
    RAISE EXCEPTION 'a strip keeps its owner, its session and its material' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tasting_sessions s WHERE s.id = NEW.session_id AND s.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'a strip is of a session of its owner' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.materials m WHERE m.id = NEW.material_id AND (m.owner_id IS NULL OR m.owner_id = NEW.user_id)) THEN
    RAISE EXCEPTION 'a strip is of a common material or its owner''s' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.dilution_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.lab_dilutions d WHERE d.id = NEW.dilution_id AND d.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'a strip comes from a dilution of its owner' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER tasting_strips_check BEFORE INSERT OR UPDATE ON public.tasting_strips FOR EACH ROW EXECUTE FUNCTION public.check_tasting_strip();
--> statement-breakpoint

-- A tab is of a strip of its owner; t0 is written once. Sent again unchanged (an upload retried),
-- it passes; changed, it is refused. It goes only with its strip.
CREATE FUNCTION public.check_tasting_moment() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.moment = 't0' AND EXISTS (SELECT 1 FROM public.tasting_strips s WHERE s.id = OLD.strip_id) THEN
      RAISE EXCEPTION 'the opening (t0) is never corrected' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.strip_id IS DISTINCT FROM OLD.strip_id OR NEW.moment IS DISTINCT FROM OLD.moment THEN
      RAISE EXCEPTION 'a tab keeps its owner, its strip and its time' USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.moment = 't0' AND (NEW.text IS DISTINCT FROM OLD.text OR NEW.at IS DISTINCT FROM OLD.at) THEN
      RAISE EXCEPTION 'the opening (t0) is never corrected' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tasting_strips s WHERE s.id = NEW.strip_id AND s.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'a tab is of a strip of its owner' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER tasting_moments_check BEFORE INSERT OR UPDATE OR DELETE ON public.tasting_moments FOR EACH ROW EXECUTE FUNCTION public.check_tasting_moment();
--> statement-breakpoint

-- The closing is of a strip of its owner; the comparison, only with the series closed.
CREATE FUNCTION public.check_tasting_closure() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.strip_id IS DISTINCT FROM OLD.strip_id) THEN
    RAISE EXCEPTION 'a closing keeps its owner and its strip' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tasting_strips s WHERE s.id = NEW.strip_id AND s.user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'a closing is of a strip of its owner' USING ERRCODE = 'check_violation';
  END IF;
  IF length(trim(coalesce(NEW.comparison, ''))) > 0
    AND NOT EXISTS (SELECT 1 FROM public.tasting_strips s WHERE s.id = NEW.strip_id AND s.closed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'the comparison with the sources comes after closing the series, never before' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER tasting_closures_check BEFORE INSERT OR UPDATE ON public.tasting_closures FOR EACH ROW EXECUTE FUNCTION public.check_tasting_closure();
--> statement-breakpoint

-- Families, battery and curve: of a tab of their owner, never of t0 (the opening is only its text).
CREATE FUNCTION public.check_tasting_moment_child() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.moment_id IS DISTINCT FROM OLD.moment_id) THEN
    RAISE EXCEPTION 'a tab''s row keeps its owner and its tab' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tasting_moments m WHERE m.id = NEW.moment_id AND m.user_id = NEW.user_id AND m.moment <> 't0') THEN
    RAISE EXCEPTION 'a tab''s row is of a tab of its owner, after the opening' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER tasting_families_check BEFORE INSERT OR UPDATE ON public.tasting_families FOR EACH ROW EXECUTE FUNCTION public.check_tasting_moment_child();
--> statement-breakpoint
CREATE TRIGGER tasting_battery_check BEFORE INSERT OR UPDATE ON public.tasting_battery FOR EACH ROW EXECUTE FUNCTION public.check_tasting_moment_child();
--> statement-breakpoint
CREATE TRIGGER tasting_curve_check BEFORE INSERT OR UPDATE ON public.tasting_curve FOR EACH ROW EXECUTE FUNCTION public.check_tasting_moment_child();
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_tasting_strip() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_tasting_moment() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_tasting_closure() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.check_tasting_moment_child() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER tasting_sessions_touch BEFORE UPDATE ON public.tasting_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER tasting_strips_touch BEFORE UPDATE ON public.tasting_strips FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER tasting_moments_touch BEFORE UPDATE ON public.tasting_moments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER tasting_battery_touch BEFORE UPDATE ON public.tasting_battery FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER tasting_curve_touch BEFORE UPDATE ON public.tasting_curve FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER tasting_closures_touch BEFORE UPDATE ON public.tasting_closures FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
-- lab_evaluations stays as the legacy (V3-60): read only for you; the loading script still writes it.
DROP POLICY "lab_evaluations: own" ON "lab_evaluations";
--> statement-breakpoint
CREATE POLICY "lab_evaluations: read own" ON "lab_evaluations"
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
