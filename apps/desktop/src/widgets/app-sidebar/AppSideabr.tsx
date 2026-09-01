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
} from "@bino/ui";
import { useBuildingStore, useTimelineFilterStore } from "@bino/store";
import { useNavigate } from "react-router-dom";

export const AppSidebar = () => {
  const buildings = useBuildingStore((s) => s.buildings);
  const selectedBuildingId = useTimelineFilterStore((s) => s.selectedBuildingId);
  const navigate = useNavigate()

  return (
    <Sidebar>
      <SidebarHeader>
        <h4 className="text-base!">Bino</h4>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Buildings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {buildings.map((building) => (
                <SidebarMenuItem key={building.id}>
                  <SidebarMenuButton
                    isActive={selectedBuildingId === building.id}
                    onClick={() => navigate(`/buildings/${building.id}`)}
                  >
                    {building.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
