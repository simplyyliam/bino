import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from "@hugeicons/core-free-icons"
export const SearchField = () => {
  return (
    <form className="flex items-center typeset-input px-2.5 py-1.5 gap-2 bg-accent rounded-[10px] border">
      <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={1.67}/>
      
      <input
        placeholder="Search by ICN, description or bin code..."
        className="min-w-70 focus:outline-none "
      />
    </form>
  );
};
