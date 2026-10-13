import { useEffect, useState } from "react";
import { currentUser, signOut, supabase, type SignedInUser } from "./db/client";
import { closeLocalDatabase, localDatabaseFor } from "./db/local/database";
import { SignIn } from "./SignIn";
import { SyncProbe } from "./SyncProbe";
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
  const t = texts.start;
  const local = localDatabaseFor(user.id);
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
      <h2>{t.title}</h2>
      <p>{t.lead}</p>
      <SyncProbe local={local} user={user} />
      <h3>{t.stepsTitle}</h3>
      <ol>
        {t.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </main>
  );
}
