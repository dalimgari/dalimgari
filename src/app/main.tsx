import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AppProviders } from "./providers";
import "../styles/tokens.css";
import "../styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('React mount element "#root" was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
