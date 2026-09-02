import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuAction,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@bino/ui";
import { useBuildingStore, useTimelineFilterStore } from "@bino/store";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../app-theme-toggle/ThemeToggle";
import { Plus } from "lucide-react";
import { CreateBuildingDialog } from "@/features/home";

export const AppSidebar = () => {
  const buildings = useBuildingStore((s) => s.buildings);
  const deleteBuilding = useBuildingStore((s) => s.deleteBuilding);
  const selectedBuildingId = useTimelineFilterStore((s) => s.selectedBuildingId);
  const navigate = useNavigate()

  return (
    <Sidebar>
      <SidebarHeader>
        <h4 className="text-base!">Bino</h4>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Building
            <CreateBuildingDialog
              trigger={
                <SidebarMenuAction>
                  <Plus/> <span className="sr-only">Add Project</span>
                </SidebarMenuAction>
              }
            />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {buildings.map((building) => (
                <SidebarMenuItem key={building.id}>
                  <ContextMenu>
                    <ContextMenuTrigger render={
                      <SidebarMenuButton
                        isActive={selectedBuildingId === building.id}
                        onClick={() => navigate(`/buildings/${building.id}`)}
                      >
                        {building.name}
                      </SidebarMenuButton>
                    } />
                    <ContextMenuContent>
                      <ContextMenuItem variant="destructive" onClick={() => deleteBuilding(building.id)}>Delete</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
};
