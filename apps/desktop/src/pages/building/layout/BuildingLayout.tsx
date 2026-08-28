import { BuildingNavbar } from "@/widgets";
import { Outlet } from "react-router-dom";

export default function BuildingLayout() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <BuildingNavbar/>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
