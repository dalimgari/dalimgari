import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";

/**
 * Preview-only route shell. Do not wire this into production until legacy
 * URLs, GitHub Pages fallback behavior, and feature parity have been tested.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);
