# ride-offers Specification

## Purpose

Let approved students publish scheduled bike or car trips with spare seats, a planned route, a pickup option, and clear pricing.

## Requirements

### Requirement: Publish a scheduled ride with a selected route

An approved driver SHALL be able to publish a ride with a start, destination, selected driving route, future departure time, estimated arrival time, default pickup point, vehicle type, and available seat count. The driver SHALL be able to add meeting instructions.

#### Scenario: Offer a local ride

- **WHEN** an approved student selects a start and destination by place search or map pins, selects a route and default pickup point, and submits valid ride details
- **THEN** Raahi publishes the ride with its route, schedule, and free seat count
- **AND** the start and destination can be any supported local map locations, including campus, home, and other destinations

#### Scenario: Invalid ride details

- **WHEN** the departure is in the past, the ride has no valid route, the default pickup is outside the allowed route corridor, or seat capacity is invalid for the vehicle
- **THEN** the system rejects publication and identifies what needs correction

### Requirement: Choose free or paid seats

The driver SHALL be able to publish a ride as free or set one fixed positive price in rupees per seat. The same price SHALL apply to each accepted seat, including partial trips. Raahi SHALL display the charge before a rider submits a request. Students SHALL settle payment directly.

#### Scenario: Free ride

- **WHEN** a driver publishes a ride as free
- **THEN** search and request confirmation show Free

#### Scenario: Paid ride

- **WHEN** a driver publishes a ride with a price of ₹50 and a rider views it or requests a seat
- **THEN** the app shows ₹50 per seat and explains that payment goes directly to the driver

### Requirement: Cancel a published ride

The ride owner SHALL be able to cancel a future ride. Cancellation SHALL remove it from discovery and show it as cancelled to affected riders.

#### Scenario: Driver cancels a ride with active requests

- **WHEN** the driver cancels a ride with pending or accepted requests
- **THEN** the affected requests show that the ride was cancelled
- **AND** the system prevents new requests and acceptance of existing pending requests
