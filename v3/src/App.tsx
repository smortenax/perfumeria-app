import { useEffect, useRef, useState } from "react";
import { currentUser, signOut, supabase, type SignedInUser } from "./db/client";
import { closeLocalDatabase, localDatabaseFor } from "./db/local/database";
import { createFormula, createWorkbench, deleteWorkbench } from "./db/formulas";
import { createVersion, setHave, setHaveMany } from "./db/materials";
import { Bench } from "./bench/Bench";
import { Glossary } from "./glossary/Glossary";
import { Library } from "./formulation/Library";
import { MaterialEditor } from "./glossary/MaterialEditor";
import { Home } from "./Home";
import { MaterialSheet } from "./glossary/MaterialSheet";
import { NewMaterial } from "./glossary/NewMaterial";
import { useGlossary } from "./glossary/useGlossary";
import { SignIn } from "./SignIn";
import { SyncStatus } from "./SyncStatus";
import { Dilutions, MaterialDilutions } from "./dilution/Dilutions";
import { MaterialTastings } from "./tasting/MaterialTastings";
import { tasteMaterial } from "./tasting/start";
import { type Tab as TastingTab, Tasting } from "./tasting/Tasting";
import { useTastings } from "./tasting/useTastings";
import { texts } from "./i18n/es";

/**
 * Who is using the app decides what opens (plan step 1.7): without a session, signing in;
 * with one, kept in the browser even without network, the start page on that user's copy.
 */
export default function App() {
  const [user, setUser] = useState<SignedInUser | null | undefined>(undefined);

  useEffect(() => {
    void currentUser().then(setUser);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (user === undefined) {
    return <main className="start">{texts.app.loading}</main>;
  }
  if (user === null) {
    return <SignIn onSignedIn={setUser} />;
  }
  return <Start key={user.id} user={user} onSignedOut={() => setUser(null)} />;
}

function Start({ user, onSignedOut }: { user: SignedInUser; onSignedOut: () => void }) {
  const local = localDatabaseFor(user.id);
  const data = useGlossary(local);
  const tastings = useTastings(local);
  const [route, go, back] = useRoute();
  const leave = async () => {
    await closeLocalDatabase();
    await signOut();
    onSignedOut();
  };
  const fail = (e: unknown) => window.alert(texts.editor.failed(e instanceof Error ? e.message : String(e)));
  // The last formula opened stays open behind (its workbench keeps its state): the launcher goes back to it.
  const [lastFormula, setLastFormula] = useState<string | null>(route.view === "formula" ? route.id : null);
  useEffect(() => {
    if (route.view === "formula") setLastFormula(route.id);
  }, [route]);
  // A formula deleted (or not yours) is not kept open behind.
  useEffect(() => {
    if (data && lastFormula && !data.formulas.some((f) => f.id === lastFormula) && route.view !== "formula") setLastFormula(null);
  }, [data, lastFormula, route]);
  const benchName = lastFormula ? data?.formulas.find((f) => f.id === lastFormula)?.name : undefined;
  const section = route.view === "home" ? "home" : route.view === "library" ? "library" : route.view === "tasting" || route.view === "strip" ? "tasting" : route.view === "dilutions" || route.view === "bottle" || route.view === "newBottle" ? "dilutions" : route.view === "formula" ? "bench" : "materials";
  const n = texts.nav;

  return (
    <main className="start">
      {/* One launcher for the whole app: materials and the workbench live side by side (the user, 2026-10-15). */}
      <nav className="app-nav" aria-label={n.label}>
        <span className="app-name">
          {texts.app.name} <span className="version">{texts.app.version}</span>
        </span>
        <span className="app-links">
          {(
            [
              ["home", n.home, () => go({ view: "home" })],
              ["materials", n.materials, () => go({ view: "materials" })],
              ["library", n.library, () => go({ view: "library" })],
              ["tasting", n.tasting, () => go({ view: "tasting", tab: "session" })],
              ["dilutions", n.dilutions, () => go({ view: "dilutions" })],
              ...(lastFormula ? [["bench", n.bench(benchName ?? ""), () => go({ view: "formula", id: lastFormula })] as const] : []),
            ] as const
          ).map(([key, label, onClick]) => (
            <button key={key} type="button" className="app-link" aria-current={section === key ? "page" : undefined} onClick={onClick}>
              {label}
            </button>
          ))}
        </span>
        <span className="who">
          {user.email} · <button type="button" className="link" onClick={() => void leave()}>{texts.app.signOut}</button>
        </span>
      </nav>
      {route.view === "home" && <Home data={data} tastings={tastings} onMaterials={() => go({ view: "materials" })} onFormulation={() => go({ view: "library" })} onTasting={() => go({ view: "tasting", tab: "session" })}
          onDilutions={() => go({ view: "dilutions" })} />}
      {route.view !== "home" && !data && <p>{texts.glossary.loading}</p>}
      {data && (
        <>
          {/* The glossary stays mounted while a sheet is open: back, it keeps its search and its filters. */}
          <div hidden={route.view !== "materials"}>
            <Glossary
              data={data}
              onOpen={(id) => go({ view: "sheet", id })}
              onNew={() => go({ view: "new" })}
              mark={(ids, have) => setHaveMany(local.db, local.userId, ids, have)}
              onOpenFormula={(id) => go({ view: "formula", id })}
            />
          </div>
          <div hidden={route.view !== "library"}>
            <Library
              data={data}
              onOpen={(id) => go({ view: "formula", id })}
              onNewBench={(name) => void createWorkbench(local.db, local.userId, { name }).catch(fail)}
              onDeleteBench={(id) => void deleteWorkbench(local.db, local.userId, id).catch(fail)}
              onNew={(workbenchId) =>
                void createFormula(local.db, local.userId, { name: texts.glossary.newFormulaName, workbenchId }).then((id) => go({ view: "formula", id }), fail)
              }
            />
          </div>
          {/* Always mounted: the timers of the strips keep giving their notices while you are elsewhere. */}
          {tastings && (
            <Tasting
              data={data}
              local={local}
              tastings={tastings}
              visible={route.view === "tasting" || route.view === "strip"}
              tab={route.view === "tasting" ? route.tab : "session"}
              stripId={route.view === "strip" ? route.id : null}
              onTab={(tab) => go({ view: "tasting", tab }, true)}
              onOpenStrip={(id) => go({ view: "strip", id })}
              onBack={() => back({ view: "tasting", tab: "session" })}
            />
          )}
          {(route.view === "dilutions" || route.view === "bottle" || route.view === "newBottle") && (
            <Dilutions
              data={data}
              local={local}
              bottleId={route.view === "bottle" ? route.id : null}
              newFor={route.view === "newBottle" ? route.materialId : null}
              onOpen={(id) => go({ view: "bottle", id }, route.view === "newBottle")}
              onNew={(materialId) => go({ view: "newBottle", materialId: materialId ?? "" })}
              onBack={() => back({ view: "dilutions" })}
            />
          )}
          {route.view === "sheet" && (
            <MaterialSheet
              data={data}
              id={route.id}
              onBack={() => back({ view: "materials" })}
              onEdit={() => go({ view: "edit", id: route.id })}
              onOpen={(id) => go({ view: "sheet", id })}
              onHave={(have) => void setHave(local.db, local.userId, route.id, have).catch(fail)}
              onMakeVersion={() => void createVersion(local.db, local.userId, route.id).then((id) => go({ view: "edit", id }), fail)}
              links={
                <>
                <MaterialTastings
                  data={data}
                  tastings={tastings}
                  materialId={route.id}
                  onOpenStrip={(id) => go({ view: "strip", id })}
                  onLegacy={() => go({ view: "tasting", tab: "legacy" })}
                  onNew={() => {
                    if (tastings) void tasteMaterial(data, local, tastings, route.id, "sheet").then((id) => go({ view: "strip", id }), fail);
                  }}
                />
                <MaterialDilutions
                  data={data}
                  materialId={route.id}
                  onOpen={(id) => go({ view: "bottle", id })}
                  onNew={() => go({ view: "newBottle", materialId: route.id })}
                />
                </>
              }
            />
          )}
          {route.view === "edit" && (
            <MaterialEditor
              data={data}
              local={local}
              id={route.id}
              onDone={() => back({ view: "sheet", id: route.id })}
              onDeleted={() => go({ view: "materials" }, true)}
            />
          )}
          {/* Kept open while you look at materials: back, it is as you left it. */}
          {lastFormula && (
            <div hidden={route.view !== "formula"}>
              <Bench
                data={data}
                local={local}
                formulaId={lastFormula}
                active={route.view === "formula"}
                onExit={() => back({ view: "library" })}
                onOpen={(id) => go({ view: "formula", id }, true)}
                onOpenMaterial={(id) => go({ view: "sheet", id })}
              />
            </div>
          )}
          {route.view === "new" && <NewMaterial local={local} onCreated={(id) => go({ view: "edit", id }, true)} onCancel={() => back({ view: "materials" })} />}
        </>
      )}
      <details className="data-status">
        <summary>{texts.status.title}</summary>
        <SyncStatus local={local} />
      </details>
    </main>
  );
}

type Route =
  | { readonly view: "home" | "materials" | "library" | "new" | "dilutions" }
  | { readonly view: "bottle"; readonly id: string }
  | { readonly view: "newBottle"; readonly materialId: string }
  | { readonly view: "tasting"; readonly tab: TastingTab }
  | { readonly view: "strip"; readonly id: string }
  | { readonly view: "sheet" | "edit" | "formula"; readonly id: string };

/** Where the app is lives in the address, so the browser's back works: «#materiales», «#formulacion», «#material/<id>»… */
function parseRoute(hash: string): Route {
  const m = /^#material\/([^/]+)(\/editar)?$/.exec(hash);
  if (m) return { view: m[2] ? "edit" : "sheet", id: m[1] };
  const f = /^#formula\/([^/]+)$/.exec(hash);
  if (f) return { view: "formula", id: f[1] };
  if (hash === "#nuevo") return { view: "new" };
  if (hash === "#materiales") return { view: "materials" };
  if (hash === "#formulacion") return { view: "library" };
  const c = /^#catas(?:\/(cola|catadas|legado))?$/.exec(hash);
  if (c) return { view: "tasting", tab: c[1] ? TASTING_TAB_OF[c[1]] : "session" };
  const bottle = /^#dilucion\/([^/]+)$/.exec(hash);
  if (bottle) return { view: "bottle", id: bottle[1] };
  const newBottle = /^#diluciones\/nueva(?:\/([^/]+))?$/.exec(hash);
  if (newBottle) return { view: "newBottle", materialId: newBottle[1] ?? "" };
  if (hash === "#diluciones") return { view: "dilutions" };
  const strip = /^#cata\/([^/]+)$/.exec(hash);
  if (strip) return { view: "strip", id: strip[1] };
  return { view: "home" };
}
const HASH: Record<"home" | "materials" | "library" | "new" | "dilutions", string> = {
  home: "",
  materials: "#materiales",
  library: "#formulacion",
  new: "#nuevo",
  dilutions: "#diluciones",
};
/** «Catas» in the address: its tabs, and one tasting (the user, 2026-10-19: a material links to it). */
const TASTING_TAB_OF: Record<string, TastingTab> = { cola: "queue", catadas: "history", legado: "legacy" };
const TASTING_SLUG: Record<TastingTab, string> = { session: "", queue: "/cola", history: "/catadas", legacy: "/legado" };
const hashOf = (r: Route) =>
  r.view === "formula"
    ? `#formula/${r.id}`
    : r.view === "bottle"
      ? `#dilucion/${r.id}`
      : r.view === "newBottle"
        ? `#diluciones/nueva${r.materialId ? `/${r.materialId}` : ""}`
        : r.view === "strip"
      ? `#cata/${r.id}`
      : r.view === "tasting"
        ? `#catas${TASTING_SLUG[r.tab]}`
        : "id" in r
          ? `#material/${r.id}${r.view === "edit" ? "/editar" : ""}`
          : HASH[r.view];

function useRoute(): [Route, (r: Route, replace?: boolean) => void, (fallback: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const scrolls = useRef(new Map<string, number>());
  useEffect(() => {
    const changed = () => {
      const next = parseRoute(window.location.hash);
      setRoute(next);
      // A sheet opens at its top; a list, where it was left.
      requestAnimationFrame(() => window.scrollTo(0, scrolls.current.get(hashOf(next)) ?? 0));
    };
    // Going back may come as a popstate without a hashchange: both are heard.
    window.addEventListener("hashchange", changed);
    window.addEventListener("popstate", changed);
    return () => {
      window.removeEventListener("hashchange", changed);
      window.removeEventListener("popstate", changed);
    };
  }, []);
  const depth = () => (window.history.state as { depth?: number } | null)?.depth ?? 0;
  const go = (next: Route, replace = false) => {
    scrolls.current.set(hashOf(route), window.scrollY);
    const url = `${window.location.pathname}${window.location.search}${hashOf(next)}`;
    if (replace) window.history.replaceState({ depth: depth() }, "", url);
    else window.history.pushState({ depth: depth() + 1 }, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  // Back where you came from, if you came from the app; else to where it belongs.
  const back = (fallback: Route) => {
    scrolls.current.set(hashOf(route), window.scrollY);
    if (depth() > 0) window.history.back();
    else go(fallback, true);
  };
  return [route, go, back];
}
