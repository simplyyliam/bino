import { BuildingCard, CreateBuildingDialog } from "@/features/home";
import { IconButton } from "@/shared/components";
import { useBuildingStore } from "@bino/store"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@bino/ui";
import { Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Home() {
  const buildings = useBuildingStore((s) => s.buildings);

  return (
    <div className="flex items-center justify-center w-full h-full typeset typeset-docs">
      <div className="flex flex-col gap-3">
        <div>
          <h3>Hello John</h3>
          <h3>
            <span className="text-primary/35">There are</span> 3 storage
            buildings, <span className="text-primary/35">with</span> 486 bins{" "}
            <span className="text-primary/35">in total.</span>
          </h3>
          {buildings.length > 0 && (
            <CreateBuildingDialog
              trigger={
                <IconButton Label="Add building" />
              }
            />
          )}
        </div>

        <div className={buildings.length > 0 ? "columns-2 gap-1.5" : "w-full"}>
          {buildings.length > 0 ? (
            buildings.map((building) => (
              <BuildingCard key={building.id} building={building} />
            ))
          ) : (
            <div className="flex items-center justify-center w-full min-h-60 rounded-2xl border border-dashed border-primary/20">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={Home01Icon} />
                  </EmptyMedia>

                  <EmptyTitle>Buildings</EmptyTitle>
                  <EmptyDescription>No buildings found</EmptyDescription>
                </EmptyHeader>

                <EmptyContent>
                  <CreateBuildingDialog
                    trigger={
                      <IconButton variant="default" Label="Add building" />
                    }
                  />
                </EmptyContent>
              </Empty>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}