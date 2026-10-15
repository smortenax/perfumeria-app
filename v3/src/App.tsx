import { useEffect, useRef, useState } from "react";
import { currentUser, signOut, supabase, type SignedInUser } from "./db/client";
import { closeLocalDatabase, localDatabaseFor } from "./db/local/database";
import { createFormula, createWorkbench } from "./db/formulas";
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
  const [route, go, back] = useRoute();
  const leave = async () => {
    await closeLocalDatabase();
    await signOut();
    onSignedOut();
  };
  const fail = (e: unknown) => window.alert(texts.editor.failed(e instanceof Error ? e.message : String(e)));

  return (
    <main className="start">
      <header>
        <h1>
          {texts.app.name} <span className="version">{texts.app.version}</span>
        </h1>
        <p className="who">
          {route.view !== "home" && (
            <>
              <button type="button" className="link" onClick={() => go({ view: "home" })}>
                {texts.home.back}
              </button>
              {" · "}
            </>
          )}
          {user.email} · <button type="button" className="link" onClick={() => void leave()}>{texts.app.signOut}</button>
        </p>
      </header>
      {route.view === "home" && <Home data={data} onMaterials={() => go({ view: "materials" })} onFormulation={() => go({ view: "library" })} />}
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
              onNew={(workbenchId) =>
                void createFormula(local.db, local.userId, { name: texts.glossary.newFormulaName, workbenchId }).then((id) => go({ view: "formula", id }), fail)
              }
            />
          </div>
          {route.view === "sheet" && (
            <MaterialSheet
              data={data}
              id={route.id}
              onBack={() => back({ view: "materials" })}
              onEdit={() => go({ view: "edit", id: route.id })}
              onOpen={(id) => go({ view: "sheet", id })}
              onHave={(have) => void setHave(local.db, local.userId, route.id, have).catch(fail)}
              onMakeVersion={() => void createVersion(local.db, local.userId, route.id).then((id) => go({ view: "edit", id }), fail)}
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
          {route.view === "formula" && (
            <Bench data={data} local={local} formulaId={route.id} onExit={() => back({ view: "library" })} onOpen={(id) => go({ view: "formula", id }, true)} />
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
  | { readonly view: "home" | "materials" | "library" | "new" }
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
  return { view: "home" };
}
const HASH: Record<"home" | "materials" | "library" | "new", string> = { home: "", materials: "#materiales", library: "#formulacion", new: "#nuevo" };
const hashOf = (r: Route) => (r.view === "formula" ? `#formula/${r.id}` : "id" in r ? `#material/${r.id}${r.view === "edit" ? "/editar" : ""}` : HASH[r.view]);

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
