import { texts } from "./i18n/es";

/** The start page of the skeleton (phase 1): the launcher and the glossary come later. */
export default function App() {
  const t = texts.start;
  return (
    <main className="start">
      <header>
        <h1>
          {texts.app.name} <span className="version">{texts.app.version}</span>
        </h1>
      </header>
      <h2>{t.title}</h2>
      <p>{t.lead}</p>
      <h3>{t.stepsTitle}</h3>
      <ol>
        {t.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </main>
  );
}
