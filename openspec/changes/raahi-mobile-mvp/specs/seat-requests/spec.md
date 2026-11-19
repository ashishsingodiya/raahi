## Purpose

Let students agree on a seat and meeting points, coordinate after acceptance, and see whether a request is still active.

## ADDED Requirements

### Requirement: Request one seat with two meeting points

An approved rider SHALL be able to request one seat on another student's available ride using the default or a custom pickup and the driver's destination or a custom drop-off. The system SHALL validate both pins against the allowed corridor and route order and record the price shown at submission.

#### Scenario: Rider proposes two custom points

- **WHEN** the rider submits valid pickup and drop-off pins in travel order after reviewing the price
- **THEN** the app shows a Pending request and the driver can review both pins on the route with the request details

#### Scenario: Invalid or duplicate request

- **WHEN** the rider submits pins outside the allowed corridor, reverses the pickup and drop-off, requests their own ride, or already has an active request for that ride
- **THEN** the system rejects the submission and preserves any existing request

### Requirement: Decide the request and reserve capacity

The ride owner SHALL be able to accept or decline a pending request as a single decision covering both meeting points. Acceptance SHALL reserve one seat for the entire ride and SHALL succeed only while a seat remains and the ride is available.

#### Scenario: Driver accepts

- **WHEN** the owner accepts a pending request with a seat available
- **THEN** both students see Accepted and available capacity decreases by one

#### Scenario: Two requests compete for the last seat

- **WHEN** the driver attempts to accept two pending requests for the last seat
- **THEN** at most one acceptance succeeds and the system reports that the other request could not be accepted

#### Scenario: Driver declines

- **WHEN** the owner declines a pending request
- **THEN** both students can see that it was declined and capacity is unchanged

### Requirement: Share contact and meeting details after acceptance

The system SHALL expose each student's mobile number to the other participant only for an accepted, uncancelled request. The confirmation SHALL show the agreed pickup, drop-off, estimated pickup time, recorded price, and any meeting instructions supplied by the driver.

#### Scenario: Confirmed students coordinate

- **WHEN** either participant opens an accepted request
- **THEN** they see the other participant's number and the confirmed meeting and price details

#### Scenario: Unauthorized contact access

- **WHEN** a third party asks for contact details or a participant opens a pending, declined, or cancelled request
- **THEN** the response omits the other student's number

### Requirement: Cancel a seat request

Either participant SHALL be able to cancel a future pending or accepted request. Cancelling an accepted request SHALL release the reserved seat for an active ride.

#### Scenario: Rider releases a confirmed seat

- **WHEN** the rider cancels an accepted request on an upcoming active ride
- **THEN** both students see Cancelled and the seat becomes available once
