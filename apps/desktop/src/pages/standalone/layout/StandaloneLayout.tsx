import { Outlet } from "react-router-dom";


export default function StandaloneLayout() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
