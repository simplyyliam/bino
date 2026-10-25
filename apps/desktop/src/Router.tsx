import { createBrowserRouter, type RouteObject } from "react-router-dom";
import type { ComponentType } from "react";
import { AppLayout } from "./pages/app";
import { StandaloneLayout } from "./pages/standalone";
import NotFound from "./components/NotFound";
import RouteError from "./components/RouteError";

// File-based routes, grouped by layout:
//   pages/app/**/page.tsx         → inside the app shell (sidebar, search, shortcuts)
//   pages/standalone/**/page.tsx  → full-screen, no app chrome
// Folders become URL segments and [param] folders become :param.
// e.g. pages/app/buildings/[buildingId]/page.tsx → /buildings/:buildingId

type PageModule = { default: ComponentType };

const pages = import.meta.glob<PageModule>("./pages/**/page.tsx", { eager: true });

const groups: Record<"app" | "standalone", RouteObject[]> = { app: [], standalone: [] };

for (const [file, module] of Object.entries(pages)) {
  const match = file.match(/^\.\/pages\/(app|standalone)\/(?:(.*)\/)?page\.tsx$/);
  if (!match) {
    console.warn(`[router] ${file} isn't inside pages/app or pages/standalone, so it was skipped`);
    continue;
  }
  const [, group, folder = ""] = match;
  const Page = module.default;
  const path = folder.replace(/\[([^\]]+)\]/g, ":$1");
  groups[group as keyof typeof groups].push(path ? { path, element: <Page /> } : { index: true, element: <Page /> });
}

export const Router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [...groups.app, { path: "*", element: <NotFound /> }],
  },
  {
    element: <StandaloneLayout />,
    errorElement: <RouteError />,
    children: groups.standalone,
  },
]);
