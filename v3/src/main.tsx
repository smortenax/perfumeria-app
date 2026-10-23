import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// The faces travel with the app, so it reads the same without network (V3-73).
import "@fontsource-variable/atkinson-hyperlegible-next";
import "@fontsource-variable/geist-mono";
import "./theme/tokens.css";
import "./App.css";
import "./theme/layout.css";
import "./theme/screens.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
