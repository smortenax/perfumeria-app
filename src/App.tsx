import { useEffect, useState } from "react";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-sans/300.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import { Bench, type Opened } from "./bench/Bench";
import { Launcher } from "./bench/Launcher";
import { modelVersion } from "./bench/prefs";
import { loadUserData } from "./bench/store";
import { emptyFormula } from "./bench/state";
import { fitToWindow } from "./bench/zoom";
import { repositoryFor } from "./data/repositories";
import { texts } from "./i18n/es";
import "./App.css";

function App() {
  const [opened, setOpened] = useState<Opened | null>(null);
  // A new bench each time it is entered, so nothing leaks from the previous one.
  const [session, setSession] = useState(0);
  // The user's data (favourites, last dilutions, recent) is read from disk before the first screen (§6).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadUserData()
      .catch((e) => console.error("preferencias.json", e))
      .finally(() => setReady(true));
  }, []);

  // The sketch's proportions in any window (boceto 4, P36).
  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    fitToWindow()
      .then((unlisten) => {
        if (cancelled) {
          unlisten();
        } else {
          stop = unlisten;
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  const enter = (next: Opened) => {
    setOpened(next);
    setSession((n) => n + 1);
  };

  if (!ready) {
    return null;
  }
  if (!opened) {
    return <Launcher onNew={() => enter({ formula: emptyFormula(texts.bench.untitled), path: null })} onOpen={enter} />;
  }
  return <Bench key={session} initial={opened} onExit={() => setOpened(null)} repository={repositoryFor(modelVersion())} />;
}

export default App;
