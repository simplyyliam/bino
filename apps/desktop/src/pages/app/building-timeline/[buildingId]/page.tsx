import { Navigate, useParams } from "react-router-dom";

// Old link from before the redesign; the building timeline is now a filter on Activity.
export default function BuildingTimelineRedirect() {
  const { buildingId } = useParams();
  return <Navigate to={`/activity?building=${buildingId}`} replace />;
}
