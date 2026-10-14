import { useEffect, useState } from "react";
import { currentUser, signOut, supabase, type SignedInUser } from "./db/client";
import { closeLocalDatabase, localDatabaseFor } from "./db/local/database";
import { Glossary } from "./glossary/Glossary";
import { MaterialSheet } from "./glossary/MaterialSheet";
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
  const [open, setOpen] = useOpenMaterial();
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
          <div hidden={open !== null}>
            <Glossary data={data} onOpen={setOpen} />
          </div>
          {open && <MaterialSheet data={data} id={open} onBack={() => setOpen(null)} />}
        </>
      )}
      <details className="data-status">
        <summary>{texts.status.title}</summary>
        <SyncStatus local={local} />
      </details>
    </main>
  );
}

/** The open material lives in the address («#material/<id>»), so the browser's back returns to the glossary. */
function useOpenMaterial(): [string | null, (id: string | null) => void] {
  const read = () => /^#material\/(.+)$/.exec(window.location.hash)?.[1] ?? null;
  const [open, setOpenState] = useState<string | null>(read);
  const [listScroll, setListScroll] = useState(0);
  useEffect(() => {
    const changed = () => {
      const id = read();
      setOpenState(id);
      // A sheet opens at its top; the glossary, where it was left.
      requestAnimationFrame(() => window.scrollTo(0, id ? 0 : listScroll));
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, [listScroll]);
  const setOpen = (id: string | null) => {
    if (id) {
      if (!read()) setListScroll(window.scrollY);
      window.location.hash = `material/${id}`;
    } else if (read()) window.history.back();
  };
  return [open, setOpen];
}
