import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from "@hugeicons/core-free-icons"
import { InputGroup, InputGroupAddon, InputGroupInput } from '@bino/ui';
export const SearchField = () => {
  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput placeholder="Search ICN, description or bin code..." />
      <InputGroupAddon>
        <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={1.67}/>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
    </InputGroup>
  );
};