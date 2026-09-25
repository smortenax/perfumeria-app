import { texts } from "./i18n/es";
import "./App.css";

function App() {
  return (
    <main className="shell">
      <h1>{texts.appName}</h1>
      <p>{texts.skeletonNote}</p>
    </main>
  );
}

export default App;
