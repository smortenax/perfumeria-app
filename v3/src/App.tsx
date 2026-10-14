import { useEffect, useState } from "react";
import { currentUser, signOut, supabase, type SignedInUser } from "./db/client";
import { closeLocalDatabase, localDatabaseFor } from "./db/local/database";
import { Glossary } from "./glossary/Glossary";
import { MaterialEditor } from "./glossary/MaterialEditor";
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
  const [route, go] = useRoute();
  const leave = async () => {
    await closeLocalDatabase();
    await signOut();
    onSignedOut();
  };

  return (
    <main className="start">
      <header>
        <h1>
          {texts.app.name} <span className="version">{texts.app.version}</span>
        </h1>
        <p className="who">
          {user.email} · <button type="button" className="link" onClick={() => void leave()}>{texts.app.signOut}</button>
        </p>
      </header>
      {!data ? (
        <p>{texts.glossary.loading}</p>
      ) : (
        <>
          {/* The glossary stays mounted while a sheet is open: back, it keeps its search and its filters. */}
          <div hidden={route.view !== "list"}>
            <Glossary data={data} onOpen={(id) => go({ view: "sheet", id })} onNew={() => go({ view: "new" })} />
          </div>
          {route.view === "sheet" && (
            <MaterialSheet data={data} id={route.id} onBack={() => go({ view: "list" })} onEdit={() => go({ view: "edit", id: route.id })} />
          )}
          {route.view === "edit" && (
            <MaterialEditor
              data={data}
              local={local}
              id={route.id}
              onDone={() => go({ view: "sheet", id: route.id })}
              onDeleted={() => go({ view: "list" }, true)}
            />
          )}
          {route.view === "new" && <NewMaterial local={local} onCreated={(id) => go({ view: "edit", id }, true)} onCancel={() => go({ view: "list" })} />}
        </>
      )}
      <details className="data-status">
        <summary>{texts.status.title}</summary>
        <SyncStatus local={local} />
      </details>
    </main>
  );
}

type Route = { readonly view: "list" } | { readonly view: "new" } | { readonly view: "sheet" | "edit"; readonly id: string };

/** Where the app is lives in the address («#material/<id>», «…/editar», «#nuevo»), so the browser's back works. */
function parseRoute(hash: string): Route {
  const m = /^#material\/([^/]+)(\/editar)?$/.exec(hash);
  if (m) return { view: m[2] ? "edit" : "sheet", id: m[1] };
  return hash === "#nuevo" ? { view: "new" } : { view: "list" };
}
const hashOf = (r: Route) => (r.view === "list" ? "" : r.view === "new" ? "#nuevo" : `#material/${r.id}${r.view === "edit" ? "/editar" : ""}`);

function useRoute(): [Route, (r: Route, replace?: boolean) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  const [listScroll, setListScroll] = useState(0);
  useEffect(() => {
    const changed = () => {
      const next = parseRoute(window.location.hash);
      setRoute(next);
      // A sheet opens at its top; the glossary, where it was left.
      requestAnimationFrame(() => window.scrollTo(0, next.view === "list" ? listScroll : 0));
    };
    // Going back through steps the app pushed may come as a popstate without a hashchange: both are heard.
    window.addEventListener("hashchange", changed);
    window.addEventListener("popstate", changed);
    return () => {
      window.removeEventListener("hashchange", changed);
      window.removeEventListener("popstate", changed);
    };
  }, [listScroll]);
  const go = (next: Route, replace = false) => {
    if (route.view === "list") setListScroll(window.scrollY);
    const hash = hashOf(next);
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    // Each step the app takes keeps how deep it is from the glossary: back to it goes back through them.
    const depth = (window.history.state as { depth?: number } | null)?.depth ?? 0;
    if (hash === "" && depth > 0) {
      window.history.go(-depth);
      return;
    }
    if (replace || hash === "") window.history.replaceState({ depth: hash === "" ? 0 : depth }, "", url);
    else window.history.pushState({ depth: depth + 1 }, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  return [route, go];
}
