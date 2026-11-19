# student-onboarding Specification

## Purpose

Collect student profiles at first sign-in and control access to the ride network through college email verification or an admin decision.

## Requirements

### Requirement: First-sign-in student profile

The Android app SHALL require a student to complete onboarding with a profile name and a valid mobile number. It SHALL prefill the profile from Google sign-in where available, retain the Google account email as the sign-in identity, and explain when the number is shared.

#### Scenario: A new student signs in

- **WHEN** a student signs in with Google for the first time
- **THEN** the app shows the onboarding form with the Google name and email and the profile photo when available
- **AND** it asks for a mobile number and explains that it is shared with the other student after a seat request is accepted

#### Scenario: A student returns with incomplete onboarding

- **WHEN** a signed-in student leaves onboarding before saving a valid name and number
- **THEN** the app resumes onboarding on return and the service blocks ride features

### Requirement: Automatic approval for college email

The system SHALL automatically approve a completed student profile when its Google sign-in email is verified and its exact domain is `rtu.ac.in`. Other completed profiles SHALL enter pending review.

#### Scenario: Verified student address

- **WHEN** a student completes onboarding using a Google-verified address on `rtu.ac.in`
- **THEN** the app unlocks the ride features without an admin decision

#### Scenario: Personal account or different domain

- **WHEN** a student completes onboarding using an email that does not meet the automatic approval rule
- **THEN** the app shows Pending and the completed profile appears in the Studio review queue

### Requirement: Profile-based admin review

Studio SHALL allow authorized admins to approve or reject pending profiles based on the displayed profile. A decision SHALL record the admin and decision time. The review flow SHALL work without document collection or an in-person check.

#### Scenario: Admin reviews a pending profile

- **WHEN** an authorized admin opens the pending review queue
- **THEN** they can see the student's profile name, Google sign-in email, and profile photo when available, and can approve or reject the profile

#### Scenario: Admin saves a decision

- **WHEN** an admin approves or rejects a pending profile
- **THEN** the system records the decision, who made it, and when
- **AND** the student's app shows the decision on refresh

### Requirement: Enforce student eligibility across ride actions

The system SHALL allow only signed-in students with completed onboarding and automatic or manual approval to access ride features. Pending and rejected users SHALL retain access to their verification status.

#### Scenario: Rejected student signs in again

- **WHEN** a rejected student returns with the same Google account
- **THEN** the app still shows Rejected and a direct attempt to use a ride feature is denied

#### Scenario: Admin-approved student returns

- **WHEN** a student with a manually approved profile returns to the app
- **THEN** the app grants access to the same ride features as a student approved automatically
