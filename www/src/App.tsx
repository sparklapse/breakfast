import "$app/bootstrap";

import { Router } from "@solidjs/router";
import { Toaster } from "solid-toast";
import type { JSX } from "solid-js";

// Simple file based routes
let routes: { path: string; component: () => JSX.Element }[];
routes = Object.entries(
  import.meta.glob<true, "", { default: () => JSX.Element }>("./routes/**/*.tsx", {
    eager: true,
  }),
).map(([path, module]) => {
  return {
    path: path.replace("./routes", "").replace(".tsx", "").replace("index", ""),
    component: module.default,
  };
});

export default function App() {
  return (
    <div class="h-screen w-screen">
      <Router base="/breakfast">{routes}</Router>
      <Toaster />
    </div>
  );
}
