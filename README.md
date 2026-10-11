# LenDen

*A digital moi book.* Track what you gave and what you received at every function, per family, so you always know what to give next time — and what you wore last time.

Local-first. No account, no server, no sync. SQLite on the phone, backups as a zip you keep yourself.

See [docs/SPEC.md](docs/SPEC.md) for the product spec.

## Run it

```bash
npm install
npx expo install --fix     # aligns native deps with the installed Expo SDK
npx expo start             # then press i (iOS simulator) or a (Android)
```

Camera, photo library, PDF export and backup sharing need a dev build or a physical device; Expo Go covers everything else.

```bash
npx expo run:ios           # dev build with all native modules
```

## Checks

```bash
npm run typecheck          # tsc --noEmit
npm run lint
npm run test:domain        # pure-TS unit tests for money + ledger math
```

## Layout

```
app/                Expo Router routes only — no business logic
  (tabs)/           Families · Events · Settings
  family/[id]       family ledger   · family/form
  event/[id]/       event detail    · event/[id]/quick-add · event/form
  entry/form        add / edit a gift
  outfit/form       add / edit what we wore
src/
  domain/           pure functions, no RN imports (money, ledger, dates). Unit tested.
  db/               expo-sqlite schema, migrations, repositories
  services/         photos, pdf export, backup/restore
  components/       shared UI
  hooks/            useFocusedQuery, settings context
  i18n/             all user-facing strings (en.ts)
  theme.ts          colors, spacing, type scale
```

## Conventions

- Money is integer minor units + ISO 4217 code. Never floats. `formatMoney` handles lakh grouping for INR.
- Dates are `YYYY-MM-DD` strings; no Date objects in the DB.
- Screens never hardcode strings — add to `src/i18n/en.ts`.
- Photos are stored under the app document directory; the DB stores the relative path.
- Schema changes = a new entry in `src/db/migrations.ts`; never edit an existing migration.
