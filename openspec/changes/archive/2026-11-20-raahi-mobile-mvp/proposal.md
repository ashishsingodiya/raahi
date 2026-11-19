# Proposal

## Why

Students often pay for separate transport while other students travelling in the same direction have spare seats. Raahi gives them a verified student network for coordinating campus commutes and other local trips, with a working Android demo for submission.

## What Changes

- Make the Expo app the student experience. Collect the student's profile and mobile number during first-sign-in onboarding.
- Automatically approve Google-verified addresses on `rtu.ac.in`. Send other accounts to a minimal Studio queue for profile-based approval or rejection.
- Let students post scheduled bike and car rides between arbitrary map locations. Drivers select a route, a default pickup point, seat capacity, and either a free ride or a fixed price in rupees per seat.
- Show upcoming nearby rides using the student's location or a selected pin. Match requests by route direction, pickup and drop-off proximity, and time.
- Let riders request a seat with their chosen pickup and drop-off. Let drivers review both pins and accept or decline together. Confirm the price and share both contact numbers and meeting instructions on acceptance.
- Demonstrate the flow with an Android preview APK on two phones connected to a shared HTTPS backend. Riders settle any payment directly with drivers.

## Capabilities

### New Capabilities

- `student-onboarding` covers first-sign-in profile collection, student eligibility, and admin approval.
- `ride-offers` covers scheduled route publication, seat capacity, and pricing.
- `ride-discovery` covers map-based nearby search and route and time matching.
- `seat-requests` covers requested meeting points, booking decisions, capacity, and confirmed contact disclosure.

### Modified Capabilities

## Impact

- The Expo Android app gains student onboarding, map and ride screens, and booking screens.
- The Next.js app hosts the shared tRPC API and minimal Studio review queue.
- Better Auth provides sign-in. Drizzle and PostgreSQL store student profiles, review decisions, offers, and seat requests.
- Google Maps provides native map rendering, places, and routes for the test deployment. The billing-enabled Android key works in the development build. The signed Android preview build still needs verification.
