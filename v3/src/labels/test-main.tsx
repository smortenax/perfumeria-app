import React from "react";
import ReactDOM from "react-dom/client";
// The same face as the app: what the preview shows is what the printer gets.
import "@fontsource-variable/atkinson-hyperlegible-next";
import "../theme/tokens.css";
import "../App.css";
import "../theme/buttons.css";
import { LabelTest } from "./LabelTest";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LabelTest />
  </React.StrictMode>,
);
