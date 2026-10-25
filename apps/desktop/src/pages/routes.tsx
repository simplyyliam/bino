import { Navigate, useParams } from "react-router-dom";
import BuildingPage from "./BuildingPage";

// Keyed by building so filters and search start fresh when you switch.
export function BuildingRoute() {
  const { buildingId } = useParams();
  return <BuildingPage key={buildingId} />;
}

// Old links from before the redesign still work.
export function LegacyBuildingTimeline() {
  const { buildingId } = useParams();
  return <Navigate to={`/activity?building=${buildingId}`} replace />;
}
