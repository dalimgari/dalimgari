import { createHashRouter } from "react-router-dom";
import { App } from "./App";

/**
 * Preview-only route shell. The wildcard is intentional because Vite serves
 * this app from /react-preview.html during isolated migration testing.
 * Do not wire this into production until legacy URLs, GitHub Pages fallback
 * behavior, and feature parity have been tested.
 */
export const router = createBrowserRouter([
  {
    path: "/albums/:albumId",
    element: <App />,
  },
  {
    path: "*",
    element: <App />,
  },
]);
