import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../styles/tokens.css";
import "../styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('React mount element "#root" was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
