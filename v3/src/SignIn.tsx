import { useState, type FormEvent } from "react";
import { signIn, signInForTesting, type SignedInUser } from "./db/client";
import { texts } from "./i18n/en";

/** The one-click sign-in of the test phase (vite.config.ts); none where Vite did not define it. */
// Yours on the address you use (localhost); the test account only on [::1], where the session tests:
// the user does not want a way in that does not have their materials (2026-10-15).
const DEV_LOGINS = (typeof __DEV_LOGINS__ === "undefined" ? [] : __DEV_LOGINS__).filter((l) =>
  l.who === "me" ? location.hostname !== "[::1]" : location.hostname === "[::1]",
);

/** Signing in with mail and password (plan step 1.7). Sign-up is closed: accounts are made by hand. */
export function SignIn({ onSignedIn }: { onSignedIn: (user: SignedInUser) => void }) {
  const t = texts.signIn;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter(how: () => Promise<SignedInUser>) {
    setWorking(true);
    setError(null);
    try {
      onSignedIn(await how());
    } catch (err) {
      setError(`${t.failed}: ${(err as Error).message}`);
    } finally {
      setWorking(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    void enter(() => signIn(email.trim(), password));
  }

  return (
    <main className="start">
      <h1>
        {texts.app.name} <span className="version">{texts.app.version}</span>
      </h1>
      <form className="sign-in" onSubmit={submit}>
        <h2>{t.title}</h2>
        <label>
          {t.email}
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t.password}
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={working}>
          {working ? t.working : t.submit}
        </button>
        {error && <p className="error">{error}</p>}
        <p className="hint">{t.closed}</p>
        {/* The test phase, in development only (vite.config.ts): one click, no password typed. */}
        {DEV_LOGINS.length > 0 && (
          <div className="dev-logins">
            {DEV_LOGINS.map((l) => (
              <button key={l.who} type="button" className="secondary" disabled={working} onClick={() => void enter(() => signInForTesting(l.who))}>
                {l.who === "me" ? t.devMe : t.devTest}
              </button>
            ))}
            <p className="hint">{t.devHint}</p>
          </div>
        )}
      </form>
    </main>
  );
}
