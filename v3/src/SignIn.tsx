import { useState, type FormEvent } from "react";
import { signIn, type SignedInUser } from "./db/client";
import { texts } from "./i18n/es";

/** Signing in with mail and password (plan step 1.7). Sign-up is closed: accounts are made by hand. */
export function SignIn({ onSignedIn }: { onSignedIn: (user: SignedInUser) => void }) {
  const t = texts.signIn;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      onSignedIn(await signIn(email.trim(), password));
    } catch (err) {
      setError(`${t.failed}: ${(err as Error).message}`);
    } finally {
      setWorking(false);
    }
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
      </form>
    </main>
  );
}
