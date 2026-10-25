# Bino

Bin storage manager for keeping track of what's in every bin across a few buildings. Built for day-to-day upkeep by someone who isn't technical, so every screen should be obvious without explanation.

## Layout

pnpm monorepo.

| Path | What |
| --- | --- |
| `apps/desktop` | The web app. Vite, React 19 (with the React Compiler), Tailwind v4, react-router 7 |
| `apps/api` | Express + Prisma on Postgres (Supabase in prod, Render hosts the API) |
| `apps/mobile` | Untouched Expo starter. Not wired up to anything yet |
| `packages/types` | Shared TS types. Built to `dist` with `tsc -b` |
| `packages/data` | Location-code engine (`generateLocationCode`, `getNextBinLocation`) and the default code formats. Built to `dist`, the API imports the build |
| `packages/store` | Zustand stores + the fetch client. Imported from source |
| `packages/ui` | base-ui primitives styled with Tailwind, plus `globals.css` (all design tokens live here) |

## Running locally

```sh
pnpm install
pnpm api dev        # needs DATABASE_URL + DIRECT_URL
pnpm desktop dev    # VITE_API_URL=http://localhost:3001 to use the local API
```

The checked-in `.env` files point at **production**. When testing changes that write data, run the API against a local Postgres instead and start the desktop with `VITE_API_URL=http://localhost:3001`.

After changing `packages/types` or `packages/data`, rebuild them (`cd apps/api && npx tsc -b`) or the API keeps using the old `dist`.

New migrations live in `apps/api/prisma/migrations`. Production needs `pnpm api prisma:deploy` before the new API code goes out.

## Desktop app structure

```
src/
  Router.tsx            file-based routes, see below
  pages/app/**          pages inside the app shell (sidebar, search, shortcuts)
  pages/standalone/**   full-screen pages with no app chrome (e.g. /tag/:icn)
  components/           shared app UI (TopBar, Page, Sidebar, LocationTag, ...)
  features/<area>/      pieces that belong to one screen
  lib/                  domain logic and helpers, no JSX-heavy code
```

**Routing.** `pages/<group>/<path>/page.tsx` becomes a route in that group's layout. `[param]` folders become `:param`. Each group has its own `layout/`. Use `standalone` for anything that shouldn't show the sidebar (printouts, scanned labels, one-off info screens).

**Data.** Everything loads once on startup (`useAppStore.load`). Screens read through `useInventory()` in `lib/inventory.ts`, which indexes stores into maps and works out each bin's status. Don't filter raw store arrays inside render loops.

**Bin status** is derived, never stored: `service` (out of service) → `empty` (no items) → `out` (everything at 0) → `low` (any item at 0 or at/below its alert) → `stocked`.

**Mutations** are optimistic with rollback where it's safe. The API returns the history event it recorded and the store pushes it with `pushEvent`, so the timeline never needs a refetch.

## UI conventions

- Soft minimal: grey canvas, white containers with hairline `shadow-card`, `rounded-2xl` cards, pill buttons. Neutral greys only.
- Colour is spent on bin status (`bin-*` tokens) and the blue accent (`accent-blue`) for selection, focus and links. Primary buttons are near-black.
- Weights: regular and medium. Semibold only for tiny glyph letters.
- 13px body (`text-[13px]`), `text-xs` for meta. Numbers that change get `tabular-nums`.
- Status is never colour alone: empty is dashed, low has a dot, out shows 0, out of service is hatched.
- Undo toast for anything reversible (removing an item, service changes). `ConfirmDialog` only for things that can't be undone (deleting a building, removing bins that still hold items).
- Every page: `<TopBar crumbs actions />`, optional `<Toolbar>`, then `<Page>` or a full-bleed body.
- Buttons and menu items use Title Case ("Add Item", "Edit Layout"); descriptions use sentence case.
- Dialog forms live in an inner `…Form` component so they mount fresh each time the dialog opens. Don't reset state in effects.
- Keyboard: `useHotkey` / `useGoToShortcuts` in `lib/hotkeys.ts`. Keep `ShortcutsDialog` in sync when adding one.

## Git

Feature branches (`feat/…`, `fix/…`, `chore/…`, `docs/…`) merged into `main` with `--no-ff`. Short conventional commits, e.g. `fix(api): validate quantities`, with a few bullets when needed. Record notable product or architecture calls in `DECISIONS.md` and user-facing changes in `CHANGELOG.md`.

Design inspiration images go in `docs/design/` (gitignored). Take the style, not the layouts.
