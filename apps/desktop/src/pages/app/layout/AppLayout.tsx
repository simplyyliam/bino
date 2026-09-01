import { AppSidebar } from "@/widgets";
import { SidebarProvider, SidebarInset } from "@bino/ui";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden rounded-lg">
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
