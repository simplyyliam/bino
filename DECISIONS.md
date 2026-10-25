# Decisions

Why things are the way they are. Newest first. Add to this when you make a call someone might later question.

---

### 2026-10-25 · Keep file-based routing with app and standalone layouts

Routes come from `pages/app/**/page.tsx` and `pages/standalone/**/page.tsx`. I briefly swapped this for an explicit route list during the redesign, which was a mistake: the layout groups are a deliberate part of the architecture. Standalone pages are for screens that shouldn't carry the app shell. The first one is `/tag/:icn`, the page a scanned part label opens on a phone.

### 2026-10-25 · SaaS shell: sidebar + inset panel

A light sidebar (search, Overview / Items / Activity, buildings list) around a white content panel, with a slim top bar per page. This is the convention people already know from Linear and Notion, and it puts building switching one click away. The sidebar collapses (`Ctrl/⌘ \`) so the bin grid can take the full width.

An earlier pass used a top navigation bar. It kept the grid wide but made switching buildings two clicks and felt less like a product.

### 2026-10-25 · Soft minimal visual language

Neutral grey canvas, white hairline containers, pill controls, regular/medium weights, divider-free lists. Taken from the style of the references in `docs/design` (not their layouts).

Pill buttons are a soft-UI choice; some SaaS guides argue for 6–8px radii instead. We went with pills because that's the feel asked for, and kept controls at standard heights (32–36px) so they still read as product UI, not marketing.

Research: Uiverse "Cirrus" design system, Superdesign soft-UI templates, Cloudflare's frontend-design-saas skill (the counterpoint), and general minimal-UI writing (Mockflow, UX Design Bootcamp).

### 2026-10-25 · Colour only means status

Greys for everything structural, one blue for selection/focus/links, and four status colours on bins. In a grid of 60+ bins, exceptions (low, out, out of service) need to jump out, so "stocked" is a calm grey rather than green. Every status also has a non-colour cue (dashed, dot, 0, hatching) per HIG › Color › Inclusive color.

### 2026-10-25 · Docked inspector instead of a modal sheet

Clicking a bin opens a panel beside the grid instead of a modal. You can click from bin to bin, or arrow through them, without closing anything. Selection lives in the URL (`?bin=`), so search results and alerts deep-link straight to a bin.

### 2026-10-25 · Undo over confirmation

Removing an item from a bin, or changing service state, happens immediately with an Undo toast (HIG › Alerts: don't alert for common undoable actions). Confirmation dialogs are only for irreversible loss: deleting a building, removing bins that still have items, deleting an item from the catalogue, deleting history.

### 2026-10-25 · Low-stock alerts per bin item (`BinItem.minQuantity`)

Low-stock alerts are the most useful feature in small-business inventory tools, so they got a schema change. The threshold sits on the bin item, not the item, because the same part can live in two bins with different needs. Needs a migration in production (`20261025120000_bin_item_min_quantity`).

### 2026-10-25 · Adding an item that's already in the bin tops it up

`POST /bins/:id/items` merges into the existing row (same item and same ICN) and logs a quantity change, instead of creating a confusing duplicate line.

### 2026-10-25 · Code formats are shared; editing one can fork it

Location systems are shared between buildings. Editing one used to silently change other buildings' codes. The editor now says who else uses the format and offers "Just this building", which copies the format and points the storage at the copy. The API regenerates bin codes whenever a format changes or a storage switches format.

### 2026-10-25 · One storage per building in the UI

The schema allows several storages per building, but every screen treats a building as one bin grid (`storageByBuilding`). Nothing needed more yet. If it ever does, the building page is where tabs would go.

### 2026-10-25 · Test against a local database, never production

The checked-in `.env` files point at the real Supabase database and the Render API. All testing during the redesign ran against a throwaway local Postgres.
