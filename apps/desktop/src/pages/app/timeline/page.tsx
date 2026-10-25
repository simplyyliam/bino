import { Navigate } from "react-router-dom";

// Old link from before the redesign.
export default function TimelineRedirect() {
  return <Navigate to="/activity" replace />;
}
