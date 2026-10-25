import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import OverviewPage from "./pages/OverviewPage";
import { BuildingRoute, LegacyBuildingTimeline } from "./pages/routes";
import ActivityPage from "./pages/ActivityPage";
import IcnPage from "./pages/IcnPage";
import ItemsPage from "./pages/ItemsPage";
import NotFoundPage from "./pages/NotFoundPage";

export const Router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "buildings/:buildingId", element: <BuildingRoute /> },
      { path: "items", element: <ItemsPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "icn/:icnValue", element: <IcnPage /> },
      { path: "timeline", element: <Navigate to="/activity" replace /> },
      { path: "building-timeline/:buildingId", element: <LegacyBuildingTimeline /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
