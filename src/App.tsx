import { useState } from "react";
import { Bench, type Opened } from "./bench/Bench";
import { Launcher } from "./bench/Launcher";
import { emptyFormula } from "./bench/state";
import { texts } from "./i18n/es";
import "./App.css";

function App() {
  const [opened, setOpened] = useState<Opened | null>(null);
  // A new bench each time it is entered, so nothing leaks from the previous one.
  const [session, setSession] = useState(0);

  const enter = (next: Opened) => {
    setOpened(next);
    setSession((n) => n + 1);
  };

  if (!opened) {
    return <Launcher onNew={() => enter({ formula: emptyFormula(texts.bench.untitled), path: null })} onOpen={enter} />;
  }
  return <Bench key={session} initial={opened} onExit={() => setOpened(null)} />;
}

export default App;
