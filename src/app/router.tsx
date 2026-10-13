import { createHashRouter } from "react-router-dom";
import { App } from "./App";

/**
 * Preview-only routes. Hash routing keeps navigation on GitHub Pages and
 * avoids requiring server-side rewrite rules for deep links.
 */
export const router = createHashRouter([
  { path: "/albums/:albumId", element: <App /> },
  { path: "/dashboard/media-library", element: <App /> },
  { path: "/dashboard/:section", element: <App /> },
  { path: "*", element: <App /> },
]);
