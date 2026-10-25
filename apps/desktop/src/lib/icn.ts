import { useMemo } from "react";
import { icnProblem, nextIcnValue, normalizeIcn } from "@bino/data";
import { useItemStore } from "@bino/store";

export type IcnDraft = { value: string; manufacturer: string; partNumber: string; serialNumber: string };

export const emptyIcn: IcnDraft = { value: "", manufacturer: "", partNumber: "", serialNumber: "" };

// The next automatic number, plus what's wrong (if anything) with a typed one.
export function useIcnCheck(draft: IcnDraft) {
  const icns = useItemStore((s) => s.icns);
  const next = useMemo(() => nextIcnValue(icns.map((i) => i.value)), [icns]);
  const value = normalizeIcn(draft.value);

  let problem: string | null = null;
  if (value) {
    problem = icnProblem(value);
    if (!problem && icns.some((i) => i.value.toUpperCase() === value)) problem = `${value} is already in use.`;
  }
  return { next, value: value || undefined, problem };
}

// The fields sent with createICN.
export const icnPayload = (draft: IcnDraft, value: string | undefined) => ({
  value,
  metadata: { manufacturer: draft.manufacturer, partNumber: draft.partNumber, serialNumber: draft.serialNumber },
});
