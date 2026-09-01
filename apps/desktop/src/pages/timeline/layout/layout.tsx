import { TimelineSidebar } from "@/widgets";
import { SidebarInset, SidebarProvider } from "@bino/ui";
import { Outlet } from "react-router-dom";

export default function TimelineLayout() {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <TimelineSidebar/>
      <SidebarInset className="min-w-0 overflow-hidden rounded-lg">
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
