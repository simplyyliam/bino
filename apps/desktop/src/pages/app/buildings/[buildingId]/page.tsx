import { useParams } from "react-router-dom";
import { BuildingPage } from "./BuildingPage";

// Keyed by building so filters and search start fresh when you switch.
export default function BuildingRoute() {
  const { buildingId } = useParams();
  return <BuildingPage key={buildingId} />;
}
