# Hisab Barabar Mobile

Expo React Native client for Hisab Barabar, a shared-expense tracker for Nepal. The backend lives in `../web-app` (Next.js).

## Requirements

- Node.js 20+
- Android Studio or Xcode for native builds
- A development build for native modules (Firebase, SecureStore, Localization, Camera)

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
| `npm test -- --runInBand` | Run Jest |
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
- Home loads only its visible Personal or Shared section. Returning to the foreground reuses fresh or in-flight queries; stale queries fetch normally. FCM token saves do not invalidate dashboard data. Pull-to-refresh, data mutations, and reconnects still force revalidation. `[cache] MISS` marks a transport fetch; `[cache] HIT` distinguishes fresh data, shared in-flight requests, and offline storage.
- Authenticated online startup and reconnection prepare offline expense support even when the queue is empty. Open the app online before going offline; backend capabilities remain valid for 24 hours and are saved with the account cache. Offline sync shows connection status, pending/review/synced counts and sync progress. Unsent changes can be discarded; attempted unresolved changes remain protected.
- The compact status chip opens Offline sync. Failed entries show the server's rejection message, not a generic membership error. Explicitly confirmed retries reuse the original key, payload and revision; they never create a fresh operation. Uncertain reservations can still require backend review. Backend idempotency errors log the failing stage for diagnosis.
- Group edits resize omitted payer amounts and equal/percentage/share allocations to the new total with cent-safe rounding; explicit allocations are still validated, and fixed unequal splits require explicit amounts. After deploying this backend fix, use **Retry with same reference** for old amount-only edits rejected for payer/split totals or participant mismatches. Only these pre-write 400 responses may be atomically reopened; successful, uncertain, create, and revision-conflicting requests remain protected.
- Group creation and editing accept `Multiple` or an omitted payer label when explicit payer rows identify valid group members. Unknown payer/participant references remain rejected, with the exact field in the error. Old generic membership rejections on edits without explicit allocations can be revalidated under the same reference; names/account IDs are never guessed or substituted for group member IDs.
- Resizing reads payer/split fields explicitly from Mongoose subdocuments (object spread loses their schema fields). After updating the backend, retry edits reporting `payers[i].name=undefined` or `splits[i].participant=undefined` with the same reference; only the known pre-write serialization rejection is reopened, not arbitrary invalid member IDs.
- Deploy the backend idempotency/capability update first, then rebuild the native app for `expo-network`, `expo-crypto`, and `expo-sqlite`. Expense snapshots, drafts, and the journal use unencrypted SQLite; other cached responses use AsyncStorage. SQLite operations share one queue to prevent overlapping transactions during parallel refreshes; absent HTTP status text is stored as an empty string. See `docs/CACHING_PLAN.md` for safeguards and release checks.
- Group invite QR codes encode the canonical HTTPS invite link and are scanned from **Join Group**; the existing manual invite-code option remains available. Profile photos can be taken or selected, then uploaded through the authenticated backend to its private R2 bucket. Rebuild the native app after adding or changing Expo camera/image-picker dependencies or permission configuration.

- Notification and payment preferences are validated and saved locally per signed-in account. App Settings and Notifications share the push and weekly-digest preferences; disabling push unregisters the active FCM token. Deploy the updated `PUT /users/fcm-token` route with the mobile app to support push opt-out. Email and digest delivery rules still require server integration. The backend supports one active push-enabled device per account. Payment methods start with cash only, not demo bank/wallet accounts; adding real bank/wallet details is not implemented.
- Startup notification initialization waits for auth restoration to finish; FCM uploads require the API's in-memory authenticated session. A 401 from a request sent without credentials does not clear a subsequently restored session.
- The Home bell opens received notifications; the inbox gear and Profile still open notification settings. Foreground, background, cold-start and opened FCM notifications are saved locally, newest receipt first, with duplicate message IDs ignored. History is scoped to the signed-in account and API server, survives restarts, and updates while open. `index.js` registers handlers before Expo Router starts.
- New receipts start unread; existing saved history is treated as already read without rewriting it. Tap a notification to mark it read, or use **Mark all as read** for all unread items, including those beyond the visible page. Opening the inbox alone changes nothing. Read updates persist locally and update the Home bell badge (visually capped at `99+`, with the full count announced to screen readers). A failed history read shows an unavailable count (`?`), never a misleading zero.
- The inbox initially shows 7 notifications; **Load more** adds 5 each time. **Clear all** requires confirmation and removes the current account's history on this device, including hidden pages; notifications arriving after confirmation opens are retained. Cleared content is replaced with minimal dismissed IDs so repeat push/open callbacks cannot recreate cards. Unread count covers the full remaining history. Clearing does not affect system-tray notifications, backend admin history, expenses or other devices. Pagination limits display only; AsyncStorage still reads the full history and retains dismissed IDs.
- Notification history is grouped into **Today**, **Yesterday**, and **Earlier** using local calendar dates, refreshing at midnight and on resume. Valid FCM `groupId` and optional `expenseId` fields enable **View group/expense** through existing authenticated detail screens. IDs must be 24-character hexadecimal server IDs; arbitrary URLs and routes are ignored. Missing/invalid destinations remain informational, and deleted/inaccessible details use the existing detail-screen error states. Previously saved messages cannot recover destination metadata that was not stored.
- History starts with this update: earlier notifications and pushes the OS never delivers to JavaScript cannot be recovered locally (including force-stopped apps; iOS delivery/configuration still needs device verification). Only notifications with title/body content received while an account is bound are saved; silent control messages are not inbox entries. History uses unencrypted AsyncStorage and is removed when app data is cleared or the app is uninstalled; it is not synchronized across devices.

- `GET /expenses/personal` includes `budget`, `summary.count`, and `summary.monthlySpent` for Home. Home and Personal Add Expense use auth state for identity and do not request `/users/profile` on entry; session restoration and profile screens still use it. Saving a personal expense refreshes identity only if auth state has no user. The client sends local month boundaries as ISO timestamps; spending includes the start and excludes the end. Deploy the backend update before the mobile update; older saved personal responses need an online refresh to include budget.

- Expense lists use `?page=1&limit=20` and a Load more button, not automatic scrolling requests. Home Personal loads 7 rows; Shared and group-detail previews load 5; Transactions and group expense lists load 20. Refresh starts at page 1. Groups themselves are not paginated.
- The backend returns `pageInfo: {page, limit, hasMore, nextPage}`; `nextPage` is a number or `null`. Counts, spend, budget and group balances cover the complete matching dataset, not just loaded rows. Cache logs include page/filter parameters.
- Deploy the paginated backend before the mobile update. Offline loading works only for previously downloaded pages; a missing page shows an error without discarding loaded rows. Partial pages never imply deleted expenses. Concurrent inserts/deletes can shift numbered pages and skip rows until refresh; repeated IDs are deduplicated.

- New installs start in Light mode. The welcome header's sun/moon button saves a Light or Dark override before sign-in. Profile → App Settings offers System, Light, and Dark; saved selections persist, and System follows the device appearance. The selection applies to screens, modals, navigation, and status bars. Rebuild the native client after changing `userInterfaceStyle` to `automatic` so system appearance changes are delivered.
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

Startup routes signed-in users to tabs and signed-out users to welcome. Welcome
checks `hasSeenWelcome` before rendering; returning users go to `/login`.
Get Started, login, and signup save the flag. A storage read failure shows a
retry prompt without displaying onboarding. Opening the link previews welcome
only before the flag is set; clearing app data resets the preview, but does not
clear pending offline expenses.

The native splash uses the balance-scales logo from
`assets/images/new_logo.png`, centered on black. Android splash drawables are
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
