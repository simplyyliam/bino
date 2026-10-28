# Scanning and the mobile remote

Plan for barcode stickers on physical bins and a phone app that scans them. Nothing here is built yet. Written 2026-10-28; check the code before trusting any detail.

## The idea

Bino splits into two apps with one job each:

| App | Job | Who uses it |
| --- | --- | --- |
| `apps/desktop` | **Management.** Buildings, layouts, code formats, items, history, exports, printing labels. | Whoever runs the stores, at a desk |
| `apps/mobile` | **The remote.** Scan a sticker, see what's there, change stock, flag problems. Nothing else. | Anyone walking the shelves |

Both talk to the same API, so a change made on the phone shows on the desktop straight away (the API returns the history event and the store pushes it).

The mobile app should stay small. If a task needs more than a couple of taps or any typing beyond a number, it belongs on the desktop.

## What works today

- Every ICN has a **Code 39 barcode** on its ICN screen (`features/icn/Barcode.tsx`). A USB/Bluetooth scanner reads it and types the ICN (`ICN-000123`).
- `GET /api/icns/by-value/:value` already looks up an ICN from scanned text.
- `/tag/:icn` is a phone-sized standalone page for one ICN. Nothing links to it from a label yet (the barcode holds the ICN text, not a URL).
- `packages/store`'s fetch client already reads `EXPO_PUBLIC_API_URL`, so the mobile app can reuse the stores and client.
- `apps/mobile` is an untouched Expo starter (SDK 57, expo-router, React Native 0.86). It isn't wired to anything.

## Two kinds of label

| Label | Identifies | Stuck on | Barcode holds |
| --- | --- | --- | --- |
| **Bin sticker** (new) | A place | The physical bin | `BIN-000123` |
| **ICN tag** (exists) | A part | The part or its bag | `ICN-000123` |

The prefix tells the scanner which one it read, so one scan box handles both.

### Bin IDs: fixed, not the location code

Bin stickers should **not** encode the location code (`06/10/01/03/04`). Codes are generated from the building's code format and store number, so changing either renames every bin and every printed sticker goes stale.

Instead, give each bin a fixed, human-short ID:

- New column `Bin.tag String @unique` (e.g. `BIN-000123`), numbered like ICNs (`nextIcnValue` in `@bino/data` is the pattern to copy).
- Backfill existing bins in the migration, in a stable order (building, then position).
- Never reuse a number after a bin is deleted.
- Print the current location code as plain text under the barcode, so people can still read it. Reprint when the format changes. The barcode keeps working either way.

### Barcode format

- **Bin stickers: QR code.** Small stickers on bin fronts don't have room for Code 39, which gets wide fast. A QR code holds the full link `https://<app>/b/BIN-000123`, which means:
  - the Bino phone app reads it and opens the bin,
  - any phone camera opens the web page for that bin (a fallback for people without the app),
  - a USB scanner that reads QR types the link, and the desktop pulls the tag out of it.
- **ICN tags: keep Code 39.** It already works, existing labels stay valid, and parts usually have room. Add an optional QR (`https://<app>/tag/ICN-000123`) for phones.

Scanned text should be accepted in any of these shapes: `BIN-000123`, `ICN-000123`, or a Bino URL containing either. Put that parsing in `@bino/data` (`parseScan(text) → { kind: "bin" | "icn", value } | null`) so the desktop and mobile apps agree.

## Mobile app (the remote)

### Screens

Keep it to four. Big touch targets, one action per screen, same visual language as the desktop (grey canvas, white cards, near-black primary, `bin-*` colours for status only).

1. **Scan.** Full-screen camera with a framing box. Opens on launch. Manual entry ("Type a code") under it for damaged stickers.
2. **Bin.** Opens after scanning a bin sticker.
   - Header: location code, building, status (stocked / low / out / out of service, never colour alone).
   - One row per item: name, ICN, quantity with large − / + buttons and a "Set count" option for full recounts.
   - Actions: **Add Item** (scan an ICN tag or search), **Mark Out of Service** / **Back in Service**, **Report Problem** (a short note into history).
3. **Part.** Opens after scanning an ICN tag. Shows where it lives, how many are left and recent history, with the same − / + controls and **Move** (then scan the destination bin sticker).
4. **Recent.** What this phone changed today, each with **Undo**.

Every change is optimistic with an undo toast, the same as the desktop. No confirm dialogs except for something that can't be undone (and the remote shouldn't offer those).

### Scanning in Expo

- `expo-camera`'s `CameraView` with `barcodeScannerSettings={{ barcodeTypes: ["qr", "code39"] }}` reads both label types. No extra scanning library needed.
- Debounce repeated reads of the same code (the camera fires many times a second). Give a short haptic tick (`expo-haptics`) on a good read.
- Torch toggle for dark aisles.
- Bluetooth ring scanners (HID) can also pair with the phone and type into a focused hidden input. Supporting that is the same code as the desktop "scan anywhere" listener below.

### Code sharing

- Reuse `@bino/types`, `@bino/data` (status logic, `parseScan`) and `packages/store` (client + stores).
- Don't share UI components. `@bino/ui` is base-ui + Tailwind for the DOM; the phone gets its own few React Native components styled to match.
- `apps/mobile` currently has its own `package-lock.json`. Remove it and install through pnpm with the rest of the monorepo before starting.
- Loading the whole inventory on launch (as the desktop does) is fine at today's size. If it grows, add `GET /api/bins/by-tag/:tag` returning the bin with its items, and load per scan.

### Offline

Signal in sheds and warehouses is often patchy. Plan for it from the start:

- Queue changes locally when a save fails for network reasons, show a small "3 changes waiting" pill, and retry in order when back online.
- Send quantity changes as **deltas** ("−2") rather than absolute values, so two people changing the same bin offline don't overwrite each other. Recounts ("Set count") are the exception and should say so in history.
- The API's history event becomes the receipt. Drop the queued item when it arrives.

## Desktop changes

- **Scan anywhere.** A hidden listener for HID scanners: characters arriving faster than a person types (under ~30ms apart) and ending in Enter, while no text field is focused. Run it through `parseScan` and jump to the bin (selected, inspector open) or the ICN screen. Add it next to the other global shortcuts in `AppLayout` and list it in `ShortcutsDialog`.
- **Print stickers.** From a building, **Print Bin Stickers** opens a standalone print page (`pages/standalone/print/...`, no app chrome) laid out for a sticker sheet. Pick all bins, a row, or the selected ones. Same for ICN tags from the Items page.
  - Start with one common sheet size and a 2-column preview; add sizes when someone needs them.
  - Each sticker: QR, `BIN-000123`, location code, building name.
- **Bin tag in the inspector.** Show `BIN-000123` with a copy button and **Print Sticker**.

## API changes

- Migration: `Bin.tag` (unique) + backfill. Needs `pnpm api prisma:deploy` before the API ships.
- `GET /api/bins/by-tag/:tag` → bin with items (mirrors `icns/by-value`).
- Stock changes that accept a delta (e.g. `PATCH /api/bin-items/:id` with `{ change: -2 }` alongside the existing absolute `quantity`).
- Record the source on history events (`source: "desktop" | "mobile"`) so the timeline can show "from the phone".

## Before the phone app goes out: sign-in

The API currently has **no authentication** (open CORS, no tokens). That's survivable for one desktop on a known machine; it isn't for a phone app that can be installed anywhere and talks to a public URL.

Minimum before shipping mobile:

- Sign-in for people (Supabase Auth fits, since the database is already on Supabase), with the API checking a token on every request.
- Store who made each change on the history event, so the timeline says who moved what.
- Optionally a simple role split: desktop managers can do everything, remote users can only change stock and service status.

## Build order

1. **Bin tags.** Migration, backfill, `parseScan` in `@bino/data`, show the tag in the bin inspector.
2. **Desktop scan anywhere.** Works with a cheap USB scanner and the existing ICN barcodes on day one.
3. **Print stickers.** Bin sticker sheets (QR) and ICN tags.
4. **Sign-in** on the API and desktop.
5. **Mobile remote.** Scan → Bin → Part → Recent, online only.
6. **Offline queue** with delta updates.
7. Nice to have: `/b/:tag` web fallback page for phones without the app (reuse the standalone tag page's layout).

Each step is useful on its own, so it can stop at any point.

## Open questions

- Sticker size and printer: sheets on an office printer, or a label printer (Brother/Zebra roll)? Decides the print layout.
- Should a bin sticker survive a bin being deleted and re-added in the same spot (reuse the tag), or always get a new one?
- Who should be allowed to use the remote, and does each person need their own sign-in or is a shared device login enough?
- Do parts need ICN tags at all once bins have stickers, or only for parts that move between bins?
