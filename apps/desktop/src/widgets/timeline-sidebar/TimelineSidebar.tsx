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
import { Building06Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useBuildingStore, useTimelineFilterStore } from "@bino/store";

export const TimelineSidebar = () => {
  const buildings = useBuildingStore((s) => s.buildings);
  const selectedBuildingId = useTimelineFilterStore((s) => s.selectedBuildingId);
  const setSelectedBuildingId = useTimelineFilterStore((s) => s.setSelectedBuildingId);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <h4 className="text-base!">Timeline</h4>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Buildings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedBuildingId === null}
                  onClick={() => setSelectedBuildingId(null)}
                >
                  <HugeiconsIcon icon={Building06Icon} size={18} strokeWidth={1.67} />
                  All Buildings
                </SidebarMenuButton>
              </SidebarMenuItem>
              {buildings.map((building) => (
                <SidebarMenuItem key={building.id}>
                  <SidebarMenuButton
                    isActive={selectedBuildingId === building.id}
                    onClick={() => setSelectedBuildingId(building.id)}
                  >
                    <HugeiconsIcon icon={Building06Icon} size={18} strokeWidth={1.67} />
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
