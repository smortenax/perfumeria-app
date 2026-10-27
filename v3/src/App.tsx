import { useEffect, useRef, useState } from "react";
import { currentUser, signOut, supabase, type SignedInUser } from "./db/client";
import { closeLocalDatabase, localDatabaseFor } from "./db/local/database";
import { createFormula, createWorkbench, deleteWorkbench } from "./db/formulas";
import { copySpecification, createVersion, setHave, setHaveMany } from "./db/materials";
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
import { FailureNote } from "./FailureNote";
import { Dilutions, MaterialDilutions } from "./dilution/Dilutions";
import { ShoppingList } from "./shopping/ShoppingList";
import { ImportSheet } from "./import/ImportSheet";
import { MaterialTastings } from "./tasting/MaterialTastings";
import { MaterialUses } from "./glossary/MaterialUses";
import { tasteMaterial } from "./tasting/start";
import { type Tab as TastingTab, Tasting } from "./tasting/Tasting";
import { useTastings } from "./tasting/useTastings";
import { useDueCount } from "./tasting/useDue";
import { NavIcon, type NavIconName } from "./NavIcon";
import { texts } from "./i18n/en";

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
  // What could not be saved is said in the page, not in an alert (audit F-09).
  const [failure, setFailure] = useState<string | null>(null);
  const fail = (e: unknown) => setFailure(texts.editor.failed(e instanceof Error ? e.message : String(e)));
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
  const due = useDueCount(tastings);
  // The sidebar folds to icons on the workbench unless you open it; your choice holds until you leave.
  const [navMini, setNavMini] = useState<boolean | null>(null);
  useEffect(() => setNavMini(null), [route.view]);
  const mini = navMini ?? route.view === "formula";
  const navItem = (key: string, icon: NavIconName, label: string, onClick: () => void, badgeLabel?: string, badge = 0) => (
    <button key={key} type="button" className={`app-link app-link-${key}`} aria-current={section === key ? "page" : undefined} onClick={onClick} title={mini ? label : undefined}>
      <NavIcon name={icon} />
      <span className="nav-label">{label}</span>
      {badge > 0 && (
        <span className="nav-badge" aria-label={badgeLabel}>
          {badge}
        </span>
      )}
    </button>
  );
  const section = route.view === "home" ? "home" : route.view === "library" ? "library" : route.view === "tasting" || route.view === "strip" ? "tasting" : route.view === "dilutions" || route.view === "bottle" || route.view === "newBottle" ? "dilutions" : route.view === "formula" ? "bench" : "materials";
  const n = texts.nav;

  return (
    <main className={`start${mini ? " nav-mini" : ""}`}>
      {/* One launcher for the whole app (2026-10-15), as a sidebar on wide screens (V3-73): Home, then
          the library (materials, dilutions) and the work (formulation, the open bench, evaluations). It
          folds to icons on the workbench, which needs the width; a top bar on narrow screens, and the
          bottom bar of audit F-03 on a phone. */}
      <nav className="app-nav" aria-label={n.label}>
        <span className="app-name">
          <span className="app-mark" aria-hidden="true" />
          <span className="app-name-text">
            {texts.app.name} <span className="version">{texts.app.version}</span>
          </span>
        </span>
        <span className="app-links">
          {navItem("home", "home", n.home, () => go({ view: "home" }))}
          <span className="nav-group">{n.groupLibrary}</span>
          {navItem("materials", "materials", n.materials, () => go({ view: "materials" }))}
          {navItem("dilutions", "dilutions", n.dilutions, () => go({ view: "dilutions" }))}
          <span className="nav-group">{n.groupWork}</span>
          {navItem("library", "library", n.library, () => go({ view: "library" }))}
          {lastFormula && navItem("bench", "bench", n.bench(benchName ?? ""), () => go({ view: "formula", id: lastFormula }))}
          {navItem("tasting", "tasting", n.tasting, () => go({ view: "tasting", tab: "session" }), due > 0 ? n.due(due) : undefined, due)}
        </span>
        <button type="button" className="nav-collapse" aria-expanded={!mini} onClick={() => setNavMini(!mini)}>
          <span aria-hidden="true">{mini ? "»" : "«"}</span>
          <span className="nav-label">{mini ? n.expand : n.collapse}</span>
        </button>
        <span className="who">
          <span className="avatar" aria-hidden="true">{user.email.slice(0, 1).toUpperCase()}</span>
          <span className="who-text">
            <span className="who-mail">{user.email}</span> ·{" "}
            <button type="button" className="link" aria-current={route.view === "shopping" ? "page" : undefined} onClick={() => go({ view: "shopping" })}>
              {texts.shopping.nav}
            </button>{" "}
            ·{" "}
            <button type="button" className="link" onClick={() => void leave()}>{texts.app.signOut}</button>
          </span>
        </span>
      </nav>
      {route.view === "home" && (
        <Home
          data={data}
          tastings={tastings}
          email={user.email}
          lastFormulaId={lastFormula}
          onMaterials={() => go({ view: "materials" })}
          onFormulation={() => go({ view: "library" })}
          onTasting={() => go({ view: "tasting", tab: "session" })}
          onQueue={() => go({ view: "tasting", tab: "queue" })}
          onDilutions={() => go({ view: "dilutions" })}
          onOpenFormula={(id) => go({ view: "formula", id })}
          onSignOut={() => void leave()}
        />
      )}
      {route.view !== "home" && !data && <p>{texts.glossary.loading}</p>}
      {data && (
        <>
          {/* The glossary stays mounted while a sheet is open: back, it keeps its search and its filters. */}
          <div hidden={route.view !== "materials"}>
            <Glossary
              data={data}
              onOpen={(id) => go({ view: "sheet", id })}
              onNew={() => go({ view: "new" })}
              onImport={() => go({ view: "import" })}
              mark={(ids, have) => setHaveMany(local.db, local.userId, ids, have)}
              onOpenFormula={(id) => go({ view: "formula", id })}
            />
          </div>
          <div hidden={route.view !== "library"}>
            <Library
              data={data}
              local={local}
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
              onCopySpec={() => void copySpecification(local.db, local.userId, route.id).then((id) => go({ view: "edit", id }), fail)}
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
                <MaterialDilutions data={data} local={local} materialId={route.id} onOpen={(id) => go({ view: "bottle", id })} />
                <MaterialUses data={data} local={local} materialId={route.id} onOpen={(id) => go({ view: "formula", id })} />
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
          {route.view === "import" && <ImportSheet data={data} local={local} onDone={() => go({ view: "materials" })} onCancel={() => back({ view: "materials" })} />}
          {route.view === "shopping" && <ShoppingList data={data} local={local} onOpenMaterial={(id) => go({ view: "sheet", id })} />}
          {route.view === "new" && <NewMaterial local={local} onCreated={(id) => go({ view: "edit", id }, true)} onCancel={() => back({ view: "materials" })} />}
        </>
      )}
      <FailureNote message={failure} onClose={() => setFailure(null)} floating />
      <details className="data-status">
        <summary>{texts.status.title}</summary>
        <SyncStatus local={local} />
      </details>
    </main>
  );
}

type Route =
  | { readonly view: "home" | "materials" | "library" | "new" | "dilutions" | "shopping" | "import" }
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
  if (hash === "#compra") return { view: "shopping" };
  if (hash === "#importar") return { view: "import" };
  const strip = /^#cata\/([^/]+)$/.exec(hash);
  if (strip) return { view: "strip", id: strip[1] };
  return { view: "home" };
}
const HASH: Record<"home" | "materials" | "library" | "new" | "dilutions" | "shopping" | "import", string> = {
  home: "",
  materials: "#materiales",
  library: "#formulacion",
  new: "#nuevo",
  dilutions: "#diluciones",
  shopping: "#compra",
  import: "#importar",
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
