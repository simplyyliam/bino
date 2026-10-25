import React, { useState, useMemo, useEffect } from "react";
import type { LocationSystem, LocationLevel, LocationMappingRule } from "@bino/types";
import { generateLocationCode } from "@bino/data";
import { useLocationSystemStore, useBinStore } from "@bino/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
  Input,
  Label,
  Badge,
} from "@bino/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Delete02Icon, Settings02Icon } from "@hugeicons/core-free-icons";

interface LocationSystemEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId: string;
  storageId?: string;
  trigger?: React.ReactElement;
  onSaved?: (system: LocationSystem) => void;
}

export function LocationSystemEditorDialog({
  open,
  onOpenChange,
  systemId,
  storageId,
  trigger,
  onSaved,
}: LocationSystemEditorDialogProps) {
  const { locationSystems, updateLocationSystem, addLocationSystem } = useLocationSystemStore();
  const fetchBins = useBinStore((state) => state.fetchBins);

  const initialSystem = useMemo(() => {
    return (
      locationSystems.find((s) => s.id === systemId) ||
      locationSystems[0] || {
        id: crypto.randomUUID(),
        name: "Custom Location System",
        usesExistingCodes: true,
        separator: "/",
        paddingWidth: 2,
        levels: [
          { id: "lvl-1", name: "Row", order: 0, userManaged: true },
          { id: "lvl-2", name: "Column", order: 1, userManaged: true },
        ],
        mappingRules: [
          { levelId: "lvl-1", canonicalField: "row", startValue: 1 },
          { levelId: "lvl-2", canonicalField: "column", startValue: 1 },
        ],
        gridConfig: {
          rowCanonicalField: "row",
          columnCanonicalField: "column",
          rowPrefix: "R",
          columnPrefix: "C",
          racksPerColumn: 5,
          maxColumns: 20,
        },
      }
    );
  }, [locationSystems, systemId]);

  const [systemState, setSystemState] = useState<LocationSystem>(initialSystem);

  // Sync state when systemId changes or dialog opens
  useEffect(() => {
    if (open) {
      const found = locationSystems.find((s) => s.id === systemId);
      if (found) {
        setSystemState(JSON.parse(JSON.stringify(found)));
      }
    }
  }, [open, systemId, locationSystems]);

  // Live preview sample code calculation
  const sampleCode = useMemo(() => {
    try {
      return generateLocationCode(
        { level: 0, row: 0, column: 0, position: 0 },
        systemState
      );
    } catch {
      return "Invalid configuration";
    }
  }, [systemState]);

  // Live sample code for second bin in column 2, row 2
  const sampleCode2 = useMemo(() => {
    try {
      return generateLocationCode(
        { level: 0, row: 1, column: 1, position: 0 },
        systemState
      );
    } catch {
      return "";
    }
  }, [systemState]);

  const handleUpdateLevelName = (index: number, newName: string) => {
    setSystemState((prev) => {
      const updatedLevels = [...prev.levels];
      updatedLevels[index] = { ...updatedLevels[index], name: newName };
      return { ...prev, levels: updatedLevels };
    });
  };

  const handleUpdateMappingRule = (
    index: number,
    field: "type" | "canonicalField" | "fixedValue" | "startValue",
    value: any
  ) => {
    setSystemState((prev) => {
      const updatedRules = [...prev.mappingRules];
      const currentRule = updatedRules[index] || {
        levelId: prev.levels[index]?.id || `lvl-${index}`,
        canonicalField: "row",
        startValue: 1,
      };

      if (field === "type") {
        if (value === "fixed") {
          updatedRules[index] = {
            ...currentRule,
            fixedValue: currentRule.fixedValue ?? 1,
          };
        } else {
          const { fixedValue, ...rest } = currentRule;
          updatedRules[index] = {
            ...rest,
            canonicalField: rest.canonicalField || "row",
            startValue: rest.startValue ?? 1,
          };
        }
      } else if (field === "fixedValue") {
        updatedRules[index] = {
          ...currentRule,
          fixedValue: Number(value) || 0,
        };
      } else if (field === "startValue") {
        updatedRules[index] = {
          ...currentRule,
          startValue: Number(value) || 1,
        };
      } else if (field === "canonicalField") {
        updatedRules[index] = {
          ...currentRule,
          canonicalField: value,
        };
      }

      return { ...prev, mappingRules: updatedRules };
    });
  };

  const handleAddLevel = () => {
    const newId = `lvl-${Date.now()}`;
    const newLevel: LocationLevel = {
      id: newId,
      name: `Level ${systemState.levels.length + 1}`,
      order: systemState.levels.length,
      userManaged: true,
    };
    const newRule: LocationMappingRule = {
      levelId: newId,
      canonicalField: "row",
      startValue: 1,
    };

    setSystemState((prev) => ({
      ...prev,
      levels: [...prev.levels, newLevel],
      mappingRules: [...prev.mappingRules, newRule],
    }));
  };

  const handleRemoveLevel = (index: number) => {
    if (systemState.levels.length <= 1) return;
    const levelToRemove = systemState.levels[index];

    setSystemState((prev) => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index),
      mappingRules: prev.mappingRules.filter((r) => r.levelId !== levelToRemove.id),
    }));
  };

  const handleSave = async () => {
    try {
      const existing = locationSystems.find((s) => s.id === systemState.id);
      if (existing) {
        await updateLocationSystem(systemState.id, {
          name: systemState.name,
          separator: systemState.separator,
          paddingWidth: systemState.paddingWidth,
          levels: systemState.levels,
          mappingRules: systemState.mappingRules,
          gridConfig: systemState.gridConfig,
        });
      } else {
        await addLocationSystem(systemState);
      }

      // Recalculate existing bins in the active storage if attached
      if (storageId) {
        await fetchBins();
      }

      onSaved?.(systemState);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save location system:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <div onClick={() => onOpenChange(true)}>{trigger}</div>}

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Settings02Icon} className="size-5 text-primary" />
            <DialogTitle className="text-lg">Location System & Hierarchy Editor</DialogTitle>
          </div>
          <DialogDescription>
            Customize your store levels, separator rules, and grid axis labels. Bino translates these into your physical location codes automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Live Code Preview Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/40 border border-border gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Live Location Code Preview
            </span>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-mono text-xl font-bold text-primary">
                {sampleCode}
              </span>
              {sampleCode2 && (
                <span className="font-mono text-sm text-muted-foreground">
                  → Next: <span className="text-foreground">{sampleCode2}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {systemState.levels.length} Levels
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              Pad: {systemState.paddingWidth} digits
            </Badge>
          </div>
        </div>

        {/* System Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="system-name" className="text-xs">System Name</Label>
            <Input
              id="system-name"
              value={systemState.name}
              onChange={(e) =>
                setSystemState((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Warehouse 5-Tier"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label htmlFor="separator" className="text-xs">Separator</Label>
              <Input
                id="separator"
                value={systemState.separator}
                onChange={(e) =>
                  setSystemState((prev) => ({ ...prev, separator: e.target.value }))
                }
                placeholder="e.g. / or -"
                className="h-8 text-xs font-mono text-center"
              />
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <Label htmlFor="padding" className="text-xs">Digits</Label>
              <select
                id="padding"
                aria-label="Code Padding Digits"
                value={systemState.paddingWidth}
                onChange={(e) =>
                  setSystemState((prev) => ({
                    ...prev,
                    paddingWidth: Number(e.target.value),
                  }))
                }
                className="h-8 text-xs rounded-md border border-input bg-background px-2 font-mono"
              >
                <option value={1}>1 (e.g. 1)</option>
                <option value={2}>2 (e.g. 01)</option>
                <option value={3}>3 (e.g. 001)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Levels & Mapping Rules List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Hierarchy Levels & Rules
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Define what each segment in your location code represents (Fixed prefix or Dynamic grid axis).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLevel}
              className="h-7 text-xs gap-1.5"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
              Add Level
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {systemState.levels.map((level, index) => {
              const rule =
                systemState.mappingRules.find((r) => r.levelId === level.id) ||
                systemState.mappingRules[index] || {
                  levelId: level.id,
                  canonicalField: "row",
                  startValue: 1,
                };
              const isFixed = rule.fixedValue !== undefined;

              return (
                <div
                  key={level.id || index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border border-border/80 bg-card/50 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-28">
                    <span className="font-mono text-muted-foreground w-5 text-right font-medium">
                      {index + 1}.
                    </span>
                    <Input
                      value={level.name}
                      onChange={(e) => handleUpdateLevelName(index, e.target.value)}
                      placeholder={`Level ${index + 1}`}
                      className="h-7 text-xs font-medium w-28"
                    />
                  </div>

                  {/* Rule Type Selector */}
                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <select
                      aria-label={`Mapping type for ${level.name}`}
                      value={isFixed ? "fixed" : "dynamic"}
                      onChange={(e) =>
                        handleUpdateMappingRule(index, "type", e.target.value)
                      }
                      className="h-7 text-xs rounded border border-input bg-background px-2"
                    >
                      <option value="dynamic">Dynamic Grid Axis</option>
                      <option value="fixed">Fixed Constant Value</option>
                    </select>

                    {isFixed ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-muted-foreground text-[11px]">Value:</span>
                        <Input
                          type="number"
                          value={rule.fixedValue}
                          onChange={(e) =>
                            handleUpdateMappingRule(index, "fixedValue", e.target.value)
                          }
                          className="h-7 text-xs font-mono w-20"
                          placeholder="e.g. 6"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-muted-foreground text-[11px]">Maps to:</span>
                        <select
                          aria-label={`Canonical coordinate mapping for ${level.name}`}
                          value={rule.canonicalField}
                          onChange={(e) =>
                            handleUpdateMappingRule(index, "canonicalField", e.target.value)
                          }
                          className="h-7 text-xs rounded border border-input bg-background px-2 font-mono"
                        >
                          <option value="row">Shelf / Row</option>
                          <option value="column">Column</option>
                          <option value="level">Building Level</option>
                          <option value="position">Position / Sub-slot</option>
                        </select>

                        <span className="text-muted-foreground text-[11px]">Start:</span>
                        <Input
                          type="number"
                          value={rule.startValue}
                          onChange={(e) =>
                            handleUpdateMappingRule(index, "startValue", e.target.value)
                          }
                          className="h-7 text-xs font-mono w-16"
                          min={0}
                        />
                      </div>
                    )}

                    {systemState.levels.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveLevel(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid Axis Labels & Capacity Configuration */}
        <div className="flex flex-col gap-3 pt-1 border-t border-border/60">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Grid Axis Labels & Physical Capacity
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="row-prefix" className="text-xs">Row Axis Prefix</Label>
              <Input
                id="row-prefix"
                value={systemState.gridConfig?.rowPrefix ?? "L"}
                onChange={(e) =>
                  setSystemState((prev) => ({
                    ...prev,
                    gridConfig: {
                      ...prev.gridConfig,
                      rowPrefix: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. L, R, S"
                className="h-8 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Shown as L01, L02...
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="col-prefix" className="text-xs">Col Axis Prefix</Label>
              <Input
                id="col-prefix"
                value={systemState.gridConfig?.columnPrefix ?? ""}
                onChange={(e) =>
                  setSystemState((prev) => ({
                    ...prev,
                    gridConfig: {
                      ...prev.gridConfig,
                      columnPrefix: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. C, B (or none)"
                className="h-8 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Shown as 01, 02...
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="racks-per-col" className="text-xs">Bins Per Column</Label>
              <Input
                id="racks-per-col"
                type="number"
                min={1}
                max={20}
                value={systemState.gridConfig?.racksPerColumn ?? 5}
                onChange={(e) =>
                  setSystemState((prev) => ({
                    ...prev,
                    gridConfig: {
                      ...prev.gridConfig,
                      racksPerColumn: Math.max(1, Number(e.target.value) || 1),
                    },
                  }))
                }
                className="h-8 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Shelves per column (e.g. 5)
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="max-cols" className="text-xs">Max Columns</Label>
              <Input
                id="max-cols"
                type="number"
                min={1}
                max={50}
                value={systemState.gridConfig?.maxColumns ?? 18}
                onChange={(e) =>
                  setSystemState((prev) => ({
                    ...prev,
                    gridConfig: {
                      ...prev.gridConfig,
                      maxColumns: Math.max(1, Number(e.target.value) || 1),
                    },
                  }))
                }
                className="h-8 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Max columns limit (e.g. 18)
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSave}>
            Save & Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
