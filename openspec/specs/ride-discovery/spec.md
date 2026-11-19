# ride-discovery Specification

## Purpose

Help approved students find upcoming rides near their pickup and identify rides that can serve their requested trip and time.

## Requirements

### Requirement: Discover rides near the current or selected location

The app SHALL show nearby upcoming rides with available seats on a map and in a list. It SHALL use the student's current location when foreground permission is granted and allow a place search or map pin as an alternative.

#### Scenario: Student allows current location

- **WHEN** the student opens discovery and allows foreground location access
- **THEN** the app centers the map on their location and shows nearby upcoming rides with available seats

#### Scenario: Student searches from another location

- **WHEN** the student declines location access or chooses a different pickup
- **THEN** they can enter a place or move the pickup pin and search from the selected location

### Requirement: Match the requested trip in route order

When a student provides pickup, drop-off, and preferred time, Raahi SHALL include only available rides that pass within a configurable distance of both pins, serve the pickup before the drop-off, and have an estimated pickup time within the configured search window.

#### Scenario: Partial trip in the same direction

- **WHEN** the driver's route passes near the rider's pickup and then near the drop-off at a suitable time
- **THEN** the ride is eligible even if the rider starts and ends midway along the route

#### Scenario: Opposite direction or outside the corridor

- **WHEN** a ride reaches the requested drop-off before the pickup, misses the corridor at either point, or has a pickup estimate outside the requested time window
- **THEN** it does not appear as a match for that trip

### Requirement: Show booking information in results

The app SHALL show useful departure or estimated pickup time, destination, pickup information, available seats, vehicle type, and price for each match. It SHALL rank trip matches by pickup proximity and time fit.

#### Scenario: Rider compares matches

- **WHEN** multiple rides can serve the rider's trip
- **THEN** the rider can compare their pickup estimates, pickup locations, vehicle types, and per-seat prices before opening a ride
