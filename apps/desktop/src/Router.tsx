import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import OverviewPage from "./pages/OverviewPage";
import BuildingPage from "./pages/BuildingPage";
import ActivityPage from "./pages/ActivityPage";
import IcnPage from "./pages/IcnPage";
import NotFoundPage from "./pages/NotFoundPage";

// Old links from before the redesign still work.
function LegacyBuildingTimeline() {
  const { buildingId } = useParams();
  return <Navigate to={`/activity?building=${buildingId}`} replace />;
}

export const Router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "buildings/:buildingId", element: <BuildingPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "icn/:icnValue", element: <IcnPage /> },
      { path: "timeline", element: <Navigate to="/activity" replace /> },
      { path: "building-timeline/:buildingId", element: <LegacyBuildingTimeline /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
