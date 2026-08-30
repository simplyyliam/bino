import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from "@hugeicons/core-free-icons"
import { InputGroup, InputGroupAddon, InputGroupInput } from '@bino/ui';
import { useSearchStore, useBinStore } from '@bino/store';
import { useMemo } from 'react';

export const SearchField = () => {
  const { searchQuery, setSearchQuery } = useSearchStore();
  const { bins } = useBinStore();

  const matchingBins = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    return bins.filter((bin) => {
      return (
        bin.locationCode.toLowerCase().includes(query) ||
        bin.name.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, bins]);

  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput
        placeholder="Search ICN, description or bin code..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <InputGroupAddon>
        <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={1.67}/>
      </InputGroupAddon>
      {searchQuery.trim() && (
        <InputGroupAddon align="inline-end">
          {matchingBins.length} {matchingBins.length === 1 ? 'result' : 'results'}
        </InputGroupAddon>
      )}
    </InputGroup>
  );
};