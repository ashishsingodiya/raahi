# Design

## Context

The starter already has an Expo app, Google sign-in through Better Auth, the Next.js Studio shell, a shared tRPC router, and Drizzle with PostgreSQL. Student functionality will live in the Android app. Every installation of the preview APK connects to the same HTTPS backend and database that Studio uses.

## Goals / Non-Goals

**Goals**

- Prove the map stack on an Android phone early and keep independent onboarding and booking work moving during that check.
- Apply eligibility, route validation, seat capacity, and contact disclosure on the server.
- Make the full two-phone flow demonstrable with a small test deployment and no Google Maps billing setup.

**Non-Goals**

- App store distribution, a student-facing website, or an iOS submission build.
- Live vehicle tracking, turn-by-turn navigation, in-app payment, or seat resale across separate legs of a route.

## Decisions

### Keep student profiles separate from sign-in accounts

Add a student profile keyed to the Better Auth user ID. Onboarding prefills the Google name, email, and optional photo. Collect a display name and mobile number, normalize the number as an international contact number, and mark onboarding complete only after server validation. The Google account email remains the sign-in identity. This is the initial field set for the MVP.

Store approval status and approval source on the student profile. Determine automatic approval using the server-side verified email and an exact, case-insensitive domain comparison. Store the reviewer and timestamp for manual decisions. Use the existing Better Auth permissions to protect Studio and a separate student eligibility check on ride procedures. This keeps both approval paths available to regular student accounts and preserves a signed-in status screen for pending and rejected accounts.

### Prove Google Maps in the Android preview APK

Test a preview APK against the shared HTTPS backend on a physical phone. Verify that the actual Demo Key supports the native Android map and that Places and Compute Routes respond. Reuse the repo's Android preview app identity and configure Android key restrictions to match the package and signing certificate where applicable. Keep server-side provider credentials out of the APK and source control.

Use `react-native-maps` for the native Google map and `expo-location` for foreground location. Keep place search and route acquisition behind tRPC. If the issued key lacks native Maps SDK access, test a hosted Google Maps JavaScript view inside the Expo app through a WebView on Android. The student workflow remains in the installed app. If neither approach passes on a physical phone, surface the blocker before relying on the selected demo key for submission.

Limit Places calls with debounced search and request only the fields the UI uses. Compute a route when a driver requests a preview or changes route inputs. Reuse eligible route data within Google Maps Platform limits. Keep provider-derived data on a defined expiry and refresh path and store only what applicable terms permit. Nearby ride lookups and seat decisions use Raahi's own records.

### Match using the planned route and scheduled time

Store the user's confirmed start, destination, default pickup, departure, estimated duration, vehicle type, and seat capacity on the ride. Use the selected route's ordered geometry and distance along it to evaluate requests. Compare each submitted pin to nearby route segments and require an eligible pickup projection before an eligible drop-off projection. Using ordered segment positions also handles routes that pass near the same place twice. Preserve the student's chosen pin for driver review.

Use a demo default of 500 m from the route and a configurable 30-minute window on either side of the requested pickup time. Estimate pickup time from departure and progress along the selected route. The estimate uses route timing data where available and otherwise prorates the planned duration by distance along the route. It is presented as an estimate. Rank by distance from pickup to the route and time difference. Use an explicit pin if location permission is unavailable.

For the demo, use PostgreSQL to filter out cancelled, departed, and full rides and narrow the candidate set by time and a route bounding box. Score the remaining candidates on the server. Share route validation between discovery and seat requests so both apply the same proximity and order rules. A spatial database extension can be reconsidered if the candidate volume grows.

### Serialize capacity changes per ride

Store the requested pins, estimated pickup time, price in paise, and decision status on the request. Use an active-request uniqueness constraint for each ride and rider. Lock the ride row in the same database transaction as acceptance or cancellation, recheck eligibility and current capacity, and update the request and reservation together. One accepted request uses one seat for the full ride. Use terminal-state checks so repeat submissions cannot spend or release capacity twice.

Build public ride and request responses with explicit field lists. Fetch the other participant's number for confirmation only after checking that the viewer belongs to an accepted request and that the ride and request have not been cancelled. Return both meeting pins and the driver's instructions in that confirmation. Keep contact numbers out of discovery, pending requests, and the Studio review queue.

## Risks / Trade-offs

- Demo Key support and daily limits → Test the actual credential in a signed APK and keep provider calls separate from ordinary discovery refreshes.
- Distance to the route can include a pin across a physical barrier → Show both proposed pins to the driver before acceptance so the driver can decline an unsuitable meeting point.
- Approximate pickup time can vary with traffic → Label it as estimated and include meeting instructions for coordination.
- Whole-ride capacity can leave an empty seat on part of a trip → Use one reservation rule for the demo and keep the agreed pickup and drop-off on each request.

## Migration Plan

1. Add the profile, ride, and request schema with a forward migration. Existing sign-in accounts complete onboarding on their next mobile sign-in.
2. Apply the migration to the shared test database. Deploy the matching Next.js backend and configure Google OAuth for the test origin.
3. Configure the Expo preview build with the HTTPS base URL and install the APK on the demo phones.
4. If the preview deployment needs rollback, restore the previous backend and APK together. Keep the additive database tables for later reactivation.
