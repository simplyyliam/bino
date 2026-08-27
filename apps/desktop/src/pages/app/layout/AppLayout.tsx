import { AppNavbar } from "@/widgets";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <AppNavbar/>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
