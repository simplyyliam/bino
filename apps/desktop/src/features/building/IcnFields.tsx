import { ICN_MAX_LENGTH } from "@bino/data";
import { Input, Label, cn } from "@bino/ui";
import type { IcnDraft } from "@/lib/icn";

type IcnFieldsProps = {
  draft: IcnDraft;
  onChange: (draft: IcnDraft) => void;
  next: string;
  problem: string | null;
  autoFocus?: boolean;
};

export function IcnFields({ draft, onChange, next, problem, autoFocus }: IcnFieldsProps) {
  const set = (key: keyof IcnDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...draft, [key]: key === "value" ? e.target.value.toUpperCase() : e.target.value });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="icn-value">ICN</Label>
        <Input
          id="icn-value"
          autoFocus={autoFocus}
          value={draft.value}
          onChange={set("value")}
          maxLength={ICN_MAX_LENGTH}
          placeholder={next}
          aria-invalid={!!problem}
          aria-describedby="icn-value-hint"
          autoComplete="off"
          spellCheck={false}
          className="font-mono tabular-nums placeholder:font-mono"
        />
        <p id="icn-value-hint" className={cn("text-xs", problem ? "text-destructive" : "text-muted-foreground")}>
          {problem ?? (draft.value.trim() ? "This exact number goes on the tag." : `Type the number from the part's tag, or leave it blank to use ${next}.`)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input aria-label="Manufacturer" value={draft.manufacturer} onChange={set("manufacturer")} placeholder="Manufacturer" />
        <Input aria-label="Part number" value={draft.partNumber} onChange={set("partNumber")} placeholder="Part number" />
        <Input aria-label="Serial number" value={draft.serialNumber} onChange={set("serialNumber")} placeholder="Serial number" className="col-span-2" />
      </div>
    </div>
  );
}
