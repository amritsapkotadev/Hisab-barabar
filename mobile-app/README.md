# Hisab Barabar Mobile

Expo React Native client for Hisab Barabar, a shared-expense tracker for Nepal. The backend lives in `../web-app` (Next.js).

## Requirements

- Node.js 20+
- Android Studio or Xcode for native builds
- A development build for native modules (Firebase, SecureStore, Localization)

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_URL` in `.env` to the API base URL. It is required in development:

- Android emulator: `http://10.0.2.2:3000/api`
- iOS simulator: `http://localhost:3000/api`
- Physical device: `http://<computer-LAN-IP>:3000/api`

In release builds, the app defaults to `https://hisabbarabar.qzz.io/api` when the variable is unset.

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start Metro |
| `npm run dev` | Start Metro without telemetry |
| `npm run android` / `npm run ios` | Build and run the native app |
| `npm run lint` | Run ESLint |
| `npm test -- --runInBand` | Run Jest (46 tests) |
| `npx tsc --noEmit` | Typecheck |
| `npm run build:android` / `npm run build:ios` | EAS builds |

## Structure

- `app/` — Expo Router routes (tabs, auth, group, expense, profile)
- `components/` — shared UI, including `Toast`, `ErrorMessage`, and confirmation modals
- `contexts/AuthContext.tsx` — auth state, token lifecycle, 401 handling
- `services/api.ts` — axios client with auth interceptor and shared data adapter
- `services/dataClient.ts` — account/server-scoped TanStack cache, cancellation, and durable expense-create journal
- `services/tokenStorage.ts` — SecureStore with AsyncStorage fallback
- `services/notifications.ts` — FCM/Notifee setup and group topic subscription
- `i18n/` — English/Nepali translations (device default, persisted choice)
- `utils/invite.ts` / `utils/navigation.ts` — invite URLs and post-auth routing

## Notes

- Shared reads are fresh for 30 seconds and saved for up to 24 hours offline. Pending expense creates are journaled locally and safely replayed with the same idempotency key; they do not affect balances until confirmed. Profile -> Offline sync shows pending/failed entries and synced receipts. Other writes and settlement reads require internet.
- Deploy the backend idempotency/capability update first, then rebuild the native app for `expo-network` and `expo-crypto`. Cache and journal use unencrypted AsyncStorage; logout removes cached server data but retains same-account pending entries. See `docs/CACHING_PLAN.md` for safeguards and release checks.

- Notification and payment preferences are validated and saved locally per signed-in account. They are not synced to the backend; email/push delivery rules still require server integration. Payment methods start with cash only, not demo bank/wallet accounts; adding real bank/wallet details is not implemented.

- `GET /expenses/personal` includes `summary.count` and `summary.monthlySpent` for Home. The client sends local month boundaries as ISO timestamps; spending includes the start and excludes the end. Deploy the backend update before the mobile update.

- Appearance follows the device by default. Profile → App Settings offers System, Light, and Dark; the selection is saved locally and applies to screens, modals, navigation, and status bars. Rebuild the native client after changing `userInterfaceStyle` to `automatic` so system appearance changes are delivered.
- Invite links use `https://hisabbarabar.qzz.io/join/<groupId>` and open the `hisabbarabar://` scheme.
- If SecureStore or Localization modules are missing at runtime, the app falls back gracefully; rebuild the dev client after adding native modules.
- See `docs/PLAN.md` for the production-readiness backlog.

## Testing welcome and splash screens

The welcome screen is available at `hisabbarabar://welcome`. On a connected
Android device or emulator, open it with:

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d 'hisabbarabar://welcome' com.hisabbarabar.app
```

Startup currently routes signed-in users to tabs and signed-out users to login,
not welcome. Welcome writes `hasSeenWelcome` when Get Started or Sign In is
pressed, but startup does not read that flag. Opening the link previews welcome
without clearing app data or pending offline expenses; its buttons open signup
or login.

The native splash uses the purple balance-scales logo from
`assets/images/logo.jpeg`, centered on white. Android splash drawables are
generated alongside the Expo splash plugin configuration because the native
Android project is checked in. Rebuild/install the native app after splash
changes; restarting Metro or an OTA update cannot change the native splash.
For a representative splash test, cold-launch a preview/release build from the
launcher rather than Expo Go or the development-client loading screen.

## Android APKs without EAS

The reusable `Android testing APKs` GitHub Actions workflow builds two
downloadable APKs using Node, Java 17, the Android SDK, and the checked-in Gradle
project. Mobile CI calls it automatically after typecheck, lint, and tests pass
for a push to `main`. Pull requests run checks only. No EAS login or Expo token
is required.

1. Commit and push the mobile implementation, native resources, lockfile, and
   `.github/workflows/android-apk.yml`. The workflow must exist on the default
   branch before GitHub shows its Run workflow button.
2. In GitHub, enable Actions if needed, then open the Mobile CI run for your push
   to `main`. Its APK job starts after checks pass. To build manually instead,
   select Actions -> Android testing APKs -> Run workflow and choose a branch.
3. After the run succeeds, download an artifact from the run's summary and unzip
   it. Transfer the APK to your Android phone and allow installation from the
   browser or file manager when prompted.

Artifacts:

- `hisab-barabar-development-<run>`: native development client; run
  `npx expo start --dev-client` on your computer and connect over the same Wi-Fi.
  Configure your local `EXPO_PUBLIC_API_URL` before starting Metro; the running
  development bundle uses that value.
- `hisab-barabar-standalone-testing-<run>`: includes the JavaScript bundle and
  uses `https://hisabbarabar.qzz.io/api`; no Metro or computer connection is needed.
  This is the live backend, so use dedicated test accounts and disposable groups.

Both use the existing debug signing key and application ID, so they replace one
another rather than installing side by side. These are testing APKs, not
production-signed Play Store releases. Updating an existing install requires its
signing certificate to match; do not uninstall or clear storage to fix a mismatch
while offline expenses or drafts remain on the device.

The Android Firebase client configuration and test keystore are currently checked
in, so this workflow needs no additional secrets. Never supply backend service
account keys, database credentials, or production signing keys to this workflow.
GitHub-hosted runner availability and Actions minutes depend on repository/account
settings. Artifacts expire after seven days.
