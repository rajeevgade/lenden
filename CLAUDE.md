# LenDen — notes for Claude Code

Read `README.md` and `docs/SPEC.md` first. This file is the working agreement.

## What this is
A React Native (Expo SDK 54, Expo Router, TypeScript strict) app: a per-family gift ledger ("moi book") for Indian family functions. Local-only SQLite. V1 scope is fixed in the spec; do not add accounts, sync or AI without an explicit ask.

## State of the code
- Authored without a working `npm install` (registry was unreachable in the authoring session). Pure domain code (`src/domain`) is unit-tested and passes. Everything else was typechecked against module stubs only. **First job in a local session: `npm install && npx expo install --fix && npm run typecheck`, then run on a simulator and fix whatever the real types or runtime disagree with.** Expect small API drift in `expo-file-system/legacy`, `expo-image-picker` option names, and `@react-native-community/datetimepicker` props.
- Pinned versions in `package.json` are best-effort for SDK 54. `npx expo install --fix` is the source of truth.
- Placeholder icon/splash PNGs in `assets/` are generated maroon circles; replace later.

## Rules
- `app/` is routes only. Logic lives in `src/`.
- `src/domain` must stay free of React Native / Expo imports so `npm run test:domain` keeps running with plain Node.
- Money: integer minor units + currency code. No floats. See `src/domain/money.ts`.
- Strings go in `src/i18n/en.ts`. Keep the shape stable; a second language file must match it.
- Schema changes: append to `MIGRATIONS` in `src/db/migrations.ts` with the next version. Never edit a shipped migration.
- Don't introduce a UI kit or state library; the app is small on purpose.
- Rajeev commits and pushes himself after reviewing. Do not push from an automated run.

## Verification before calling anything done
1. `npm run typecheck` clean.
2. `npm run test:domain` green.
3. Manually on simulator: add family → add own event → quick-add 3 envelopes → open family, see balance and suggestion → add their event → add gift "we gave" and confirm suggestion shows → add outfit with photo → export family PDF → export backup → restore backup.
