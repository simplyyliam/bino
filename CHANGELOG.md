# Changelog

## 2026-10-25 · The big redesign

A ground-up pass over the whole app: new design, fixed bugs, and the features you need for everyday upkeep.

### New

- **Overview** with a "Needs attention" list: anything out of stock, low, or out of service, with a link straight to the bin.
- **Low-stock alerts.** Set a number on any item in a bin and it flags itself when it drops to it.
- **Items page.** Every item, its total, and every bin it's in. Search, filter by category or by "low or out", sort, edit, delete.
- **Search anywhere** (`Ctrl/⌘ K` or `/`). Type an item, ICN, bin code or building and jump straight to the bin.
- **Move items between bins** (counts merge if the item's already there).
- **Undo** for removing items and for service changes.
- **Notes** on items in a bin.
- **Export to CSV** for a building, all items, or activity. Handy for stock-takes.
- **Tag page** (`/tag/ICN-…`): a clean, phone-friendly page for a part's label.
- **Keyboard shortcuts.** Press `?` to see them all.
- Right-click a bin for quick actions. Click a bin's code to copy it.
- New buildings can start with a set number of bins.
- Plain-language bin code editor with a live preview.
- Dark mode that follows your system, or pick one.

### Changed

- New look: soft, clean and calm, with a sidebar, white panels and pill buttons.
- The bin grid keeps its row and column labels pinned while you scroll, has a status legend that doubles as a filter, and you can arrow-key between bins.
- Bin details open in a side panel instead of covering the grid.
- Quantities use − / + steppers that save straight away.
- Activity is grouped by day and links to each bin, with filters for building and type of change.
- Error messages now say what went wrong instead of a generic failure.

### Fixed

- The building page crashed when a storage went from no bins to some bins.
- The timeline only ever showed the latest 50 events.
- Editing a code format only updated one building's codes, and could silently change other buildings.
- Deleting a building or bins had no confirmation, even when they still held items.
- "Mark out of stock" logged a separate history entry for every item.
- Typing a quantity sent a save on every keystroke, and an empty box saved as 0.
- Removing a bin's icon didn't actually remove it.
- Marking a bin out of service wasn't recorded in the history.
- Missing or bad input to the API returned a server error instead of a clear message.
- Two people creating ICNs at the same moment could collide.
- Fresh clones could skip building shared packages (committed build info).
- The page title said "desktop" and the theme was saved under another project's name.
