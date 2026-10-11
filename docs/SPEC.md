# LenDen — Product Spec (V1)

*Working name. लेन-देन = give-and-take.*

## 1. Problem

In many Indian households (and the diaspora), attending family functions comes with a reciprocal gift economy: cash envelopes (moi / chandlo / shagun / neg / chadivimpu), gold, sarees, sweets. The person who manages this — usually mom — keeps a paper notebook recording what each family gave *to us* and what *we gave* them, so the next gift is proportionate. Paper fails at lookup ("what did the Sharmas give at Ravi's wedding in 2019?"), at the event itself (200 envelopes in two hours), and at remembering what you wore to the last function of theirs.

## 2. Who it's for

- **Primary:** the household's gift-keeper. Often 50+, not a power user, wants big buttons and fast entry. May prefer Telugu/Tamil/Hindi/Gujarati UI later.
- **Secondary:** the adult child who sets it up and occasionally enters data on mom's behalf.

## 3. One-line pitch

A digital moi book: track what you gave and what you received, per family, across every function — so you always know what to give next time, and what you wore last time.

## 4. V1 scope

### Must have
1. **Families** — the unit of reciprocity. Name, relation, city/village, optional phone, notes.
2. **Events** — a function. Name, date, type (wedding, housewarming, naming, birthday, puja, engagement, retirement, funeral, other), host (a Family, or "us"), venue/city, notes.
3. **Entries** — a gift. Belongs to a Family and an Event. Direction: `gave` | `received`. Kind: `cash` | `item`. Cash: amount + currency. Item: description + optional estimated value in a currency. Optional note, optional photo.
4. **Family ledger** — timeline of all entries with that family, totals given vs received, net balance, and "last gift from them / to them".
5. **Suggest next gift** — on a family screen and when adding an entry: shows what they gave us most recently and at a comparable event type.
6. **Quick-add mode** — for your own function: pick the event once, then a tight loop of family (autocomplete) → amount → save, with large tap targets and haptic confirmation.
7. **Outfits** — per event, one or more "who wore what": person label (Mom, Dad, Priya…), photo, note. Family screen shows "what we wore to their functions".
8. **Search** — families by name/city; entries by amount or note.
9. **Export** — PDF of a family ledger or an event's gift list (the printable "book"), via share sheet.
10. **Backup / restore** — JSON export (data + photos as a zip) via share sheet; import replaces or merges.

### Explicit non-goals (V1)
- No accounts, no server, no sync. Local SQLite only.
- No reminders/calendar integration.
- No contacts import (V2).
- No multi-currency conversion; each entry stores its own currency, totals are shown per currency.
- No AI.

## 5. Data model

All IDs are UUID strings. Timestamps ISO-8601 UTC. Money is stored as **integer minor units** (paise, cents) + ISO 4217 currency code, so the app isn't INR-only.

```
families
  id, name, relation?, city?, phone?, notes?, created_at, updated_at

events
  id, name, type, date (YYYY-MM-DD), host_family_id? (null = our own event),
  venue?, notes?, created_at, updated_at

entries
  id, family_id, event_id, direction ('gave'|'received'),
  kind ('cash'|'item'), amount_minor? , currency (ISO 4217, default from settings),
  item_description?, photo_path?, note?, created_at, updated_at

outfits
  id, event_id, person_label, photo_path?, note?, created_at

settings (key/value)
  default_currency, locale, household_name
```

Derived (never stored):
- `family.totals[currency] = { gave, received, net }`
- `family.lastReceived`, `family.lastGave`
- `suggestion(family, eventType)` → most recent `received` entry from that family, preferring same event type.

Photos live in the app's document directory under `photos/`; DB stores the relative path.

## 6. Screens

Tabs: **Families** · **Events** · **Settings**

| Screen | Purpose |
|---|---|
| Families list | Search, alphabetical, shows net balance chip. FAB → new family. |
| Family detail | Header (totals per currency, net), "Suggest" card, timeline of entries grouped by event, outfits worn to their events, edit/delete. |
| Family form | Create/edit. |
| Events list | Upcoming / past sections. FAB → new event. |
| Event detail | Host, date, totals, entries list, outfits list, **Quick-add** button, export. |
| Event form | Create/edit. |
| Entry form | Family picker (autocomplete + inline create), direction toggle, cash/item toggle, amount keypad, currency, note, photo. Shows suggestion if direction = gave. |
| Quick-add | Full-screen loop for one event: family search → amount → Save & next. |
| Outfit form | Person label, photo (camera/library), note. |
| Settings | Default currency, household name, backup/restore, about. |

## 7. Architecture

- Expo (managed), Expo Router, TypeScript strict.
- `expo-sqlite` with a tiny migration runner; no ORM.
- Layers: `src/db` (schema, migrations, repositories) → `src/domain` (pure functions: money, ledger math, suggestions — unit tested, no RN imports) → `src/features/*` (screens + hooks) → `app/` (routes only).
- Strings in `src/i18n/en.ts`; screens never hardcode text.
- Photos: `expo-image-picker` + `expo-file-system`.
- PDF: `expo-print` + `expo-sharing`.
- Backup: JSON + photos zipped with `jszip`, shared with `expo-sharing`; restore via `expo-document-picker`.

## 8. V2 candidates
- Import families from phone contacts.
- Shared household (join code) with a small sync backend.
- Indian-language UI; Indic numbering (1,00,000) is already in the formatter.
- Upcoming-event reminders with suggested gift.
- Home-screen widget: "Next: Sharma housewarming — they gave ₹2,100 last time".
