# Tasks

## 1. Android map and test environment

- [x] 1.1 Manually build and install an Android preview APK with the billing-enabled Maps SDK for Android key. Verify map rendering, pin placement, place search, a computed route, and foreground location on a physical phone. Native map rendering has been confirmed on the development variant.
- [x] 1.2 Configure the shared HTTPS URL and Google OAuth for the test environment and record the APK and backend setup. Verify the test server health endpoint from two phones and complete one Google sign-in from the APK.

## 2. Student onboarding and review

- [x] 2.1 Add the student profile migration and onboarding API with server-side validation, approval rules, and a student eligibility guard. Verify that Google-verified `rtu.ac.in` gets automatic approval and that an unverified address or a lookalike domain enters review.
- [x] 2.2 Build first-sign-in onboarding and approval state screens in Expo. Verify Google prefill, required mobile number, contact-sharing notice, interrupted onboarding, and routing after approval.
- [x] 2.3 Add the Studio pending queue and approve/reject actions with reviewer and time. Verify that a non-admin cannot access review actions and that approve and reject outcomes appear in the student app after refresh.

## 3. Publish and discover rides

- [x] 3.1 Add ride storage and server procedures for a route preview, publishing, and cancelling a ride. Verify the server rejects missing routes, invalid seats, invalid prices, and past departures. Verify free and paid offers retain the intended price.
- [x] 3.2 Build the mobile posting flow with place search, map pins, route selection, default pickup, departure, arrival estimate, vehicle, seats, pricing, and meeting instructions. Publish a campus trip and a local trip with arbitrary map locations and confirm the saved details.
- [x] 3.3 Implement route projection, ordered pickup/drop-off matching, and estimated pickup time. Verify cases for a partial route, late pickup, a pin outside the corridor, reversed pins, and a route that passes near a point twice.
- [x] 3.4 Build map and list discovery with current location, manual pickup, destination and time filters, and available seats and pricing. Verify that denial of location access still permits a search from a pin and that nearby rides headed the wrong way are excluded from a trip search.

## 4. Seat requests and confirmed details

- [x] 4.1 Add seat request storage and submission using both pins, shared route validation, and a price snapshot. Verify that duplicate, self, out-of-corridor, and reversed requests are rejected.
- [x] 4.2 Implement accept, decline, and cancellation with transactional capacity enforcement. Verify that concurrent attempts for the last seat can accept only one request and that repeated cancellation releases a confirmed seat only once.
- [x] 4.3 Build the rider status screens and driver request inbox with both pins displayed for review. Verify acceptance and rejection on separate accounts and confirm that a cancelled ride is removed from discovery and its requests show cancellation.
- [x] 4.4 Add confirmed contact and meeting details with participant-only access. Verify both numbers and the driver's instructions appear after acceptance, and verify that pending, declined, cancelled, and unrelated requests do not expose the other student's number.

## 5. Two-phone submission rehearsal

- [x] 5.1 Apply the migrations and run the preview APK on two Android phones against the shared test API. Confirm automatic approval on a college account, manual approval on a personal account, ride publication, location-based discovery, a custom pickup and drop-off request, acceptance, and mutual contact sharing.
- [x] 5.2 Confirm a priced seat shows the same amount in discovery and accepted details, and verify that the demo can be repeated with a free ride and a declined or cancelled request.
