# Accident Report Form Fields Mapping

This document provides a complete mapping of all form fields with their internal names for PDF template integration using pdf-lib.

## Section 1: Accident Date and Location

| Label | Internal Path | Type | Example |
|-------|--------------|------|---------|
| Accident Date | `section1.dateOfAccident` | text (YYYY-MM-DD) | 2026-02-02 |
| Accident Time | `section1.timeOfAccident` | text (HH:MM) | 14:30 |
| Accident Location | `section1.location` | text | Street name and number |
| City/Village | `section1.city` | text | Bratislava |
| Country/State | `section1.state` | text | Slovakia |

---

## Section 2: Accident Information

| Label | Internal Path | Type | Possible Values |
|-------|--------------|------|-----------------|
| Are there injuries? | `section2.injuries` | select | 'yes' \| 'no' \| '' |
| Damage to other vehicles? | `section2.damageOtherVehicles` | select | 'yes' \| 'no' \| '' |
| Damage to other property? | `section2.damageOtherItems` | select | 'yes' \| 'no' \| '' |
| Witnesses (names and contacts) | `section2.witnesses` | text | Free text |

---

## Vehicle A & B Structure (Same for both)

### Section 6: Policyholder / Insured Person

**Prefix for Vehicle A:** `vehicleA.policyholder.`  
**Prefix for Vehicle B:** `vehicleB.policyholder.`

| Label | Internal Path (A) | Internal Path (B) | Type | Example |
|-------|------------------|------------------|------|---------|
| Surname | `vehicleA.policyholder.surname` | `vehicleB.policyholder.surname` | text | Novák |
| First name | `vehicleA.policyholder.firstname` | `vehicleB.policyholder.firstname` | text | Ján |
| Address | `vehicleA.policyholder.address` | `vehicleB.policyholder.address` | text | Street address |
| Postal Code | `vehicleA.policyholder.postalCode` | `vehicleB.policyholder.postalCode` | text | 81101 |
| Country | `vehicleA.policyholder.country` | `vehicleB.policyholder.country` | text | SK |
| Phone / Email | `vehicleA.policyholder.phoneEmail` | `vehicleB.policyholder.phoneEmail` | text | +421-2-xxx-xxxx |

---

### Section 7: Vehicle

**Prefix for Vehicle A:** `vehicleA.vehicle.`  
**Prefix for Vehicle B:** `vehicleB.vehicle.`

| Label | Internal Path (A) | Internal Path (B) | Type | Possible Values |
|-------|------------------|------------------|------|-----------------|
| Vehicle Type | `vehicleA.vehicle.vehicleType` | `vehicleB.vehicle.vehicleType` | select | 'vehicle' \| 'trailer' |
| Make | `vehicleA.vehicle.make` | `vehicleB.vehicle.make` | text | Skoda, Ford, BMW |
| Model | `vehicleA.vehicle.model` | `vehicleB.vehicle.model` | text | Octavia, Focus, X5 |
| Licence Plate Number | `vehicleA.vehicle.registrationNumber` | `vehicleB.vehicle.registrationNumber` | text | BA-123AB |
| Country of Registration | `vehicleA.vehicle.countryOfRegistration` | `vehicleB.vehicle.countryOfRegistration` | text | SK, CZ, PL |

---

### Section 8: Insurance Company

**Prefix for Vehicle A:** `vehicleA.insurance.`  
**Prefix for Vehicle B:** `vehicleB.insurance.`

| Label | Internal Path (A) | Internal Path (B) | Type | Example |
|-------|------------------|------------------|------|---------|
| Insurance Company Name | `vehicleA.insurance.insuranceCompanyName` | `vehicleB.insurance.insuranceCompanyName` | text | Allianz SK |
| Insurance Policy Number | `vehicleA.insurance.policyNumber` | `vehicleB.insurance.policyNumber` | text | 123456789 |
| Green Card Number | `vehicleA.insurance.greenCardNumber` | `vehicleB.insurance.greenCardNumber` | text | 1234567890 |
| Green Card Valid From | `vehicleA.insurance.greenCardValidFrom` | `vehicleB.insurance.greenCardValidFrom` | text (YYYY-MM-DD) | 2025-01-01 |
| Green Card Valid To | `vehicleA.insurance.greenCardValidTo` | `vehicleB.insurance.greenCardValidTo` | text (YYYY-MM-DD) | 2026-12-31 |
| Branch (Agent/Broker) | `vehicleA.insurance.branch` | `vehicleB.insurance.branch` | text | Agent name |
| Branch Address | `vehicleA.insurance.branchAddress` | `vehicleB.insurance.branchAddress` | text | Street address |
| Branch Country | `vehicleA.insurance.branchCountry` | `vehicleB.insurance.branchCountry` | text | SK |
| Branch Phone / Email | `vehicleA.insurance.branchPhone` | `vehicleB.insurance.branchPhone` | text | +421-2-xxx-xxxx |
| Comprehensive Insurance | `vehicleA.insurance.comprehensiveInsurance` | `vehicleB.insurance.comprehensiveInsurance` | select | 'yes' \| 'no' \| '' |

---

### Section 9: Driver (According to driving licence)

**Prefix for Vehicle A:** `vehicleA.driver.`  
**Prefix for Vehicle B:** `vehicleB.driver.`

| Label | Internal Path (A) | Internal Path (B) | Type | Example |
|-------|------------------|------------------|------|---------|
| Surname | `vehicleA.driver.surname` | `vehicleB.driver.surname` | text | Novák |
| First name | `vehicleA.driver.firstname` | `vehicleB.driver.firstname` | text | Ján |
| Date of Birth | `vehicleA.driver.dateOfBirth` | `vehicleB.driver.dateOfBirth` | text (YYYY-MM-DD) | 1990-01-15 |
| Address | `vehicleA.driver.address` | `vehicleB.driver.address` | text | Street address |
| Country | `vehicleA.driver.country` | `vehicleB.driver.country` | text | SK |
| Phone | `vehicleA.driver.phone` | `vehicleB.driver.phone` | text | +421-9-xxx-xxxx |
| Licence Number | `vehicleA.driver.licenceNumber` | `vehicleB.driver.licenceNumber` | text | 123456789 |
| Licence Category | `vehicleA.driver.licenceCategory` | `vehicleB.driver.licenceCategory` | text | B, C, D |
| Licence Valid Until | `vehicleA.driver.licenceValidUntil` | `vehicleB.driver.licenceValidUntil` | text (YYYY-MM-DD) | 2030-12-31 |

---

### Section 10: Vehicle Damage

**Prefix for Vehicle A:** `vehicleA.`  
**Prefix for Vehicle B:** `vehicleB.`

#### Visible Damage Description

| Label | Internal Path (A) | Internal Path (B) | Type | Example |
|-------|------------------|------------------|------|---------|
| Visible Damage | `vehicleA.visibleDamage` | `vehicleB.visibleDamage` | text | Description of damage |

#### Additional Notes

| Label | Internal Path (A) | Internal Path (B) | Type | Example |
|-------|------------------|------------------|------|---------|
| Additional Notes | `vehicleA.additionalNotes` | `vehicleB.additionalNotes` | text | Free text notes |

#### Circumstances Checkboxes

**Prefix for Vehicle A:** `vehicleA.circumstances.`  
**Prefix for Vehicle B:** `vehicleB.circumstances.`

| Label | Internal Path (A) | Internal Path (B) | Type |
|-------|------------------|------------------|------|
| Parked | `vehicleA.circumstances.parked` | `vehicleB.circumstances.parked` | boolean |
| Stopped | `vehicleA.circumstances.stopped` | `vehicleB.circumstances.stopped` | boolean |
| Opened Door | `vehicleA.circumstances.openedDoor` | `vehicleB.circumstances.openedDoor` | boolean |
| Parking | `vehicleA.circumstances.parking` | `vehicleB.circumstances.parking` | boolean |
| Leaving Parking Area | `vehicleA.circumstances.leavingParkingArea` | `vehicleB.circumstances.leavingParkingArea` | boolean |
| Entering Parking Area | `vehicleA.circumstances.enteringParkingArea` | `vehicleB.circumstances.enteringParkingArea` | boolean |
| Entering Roundabout | `vehicleA.circumstances.enteringRoundabout` | `vehicleB.circumstances.enteringRoundabout` | boolean |
| Driving Roundabout | `vehicleA.circumstances.drivingRoundabout` | `vehicleB.circumstances.drivingRoundabout` | boolean |
| Rear End Collision | `vehicleA.circumstances.rearEndCollision` | `vehicleB.circumstances.rearEndCollision` | boolean |
| Driving Parallel | `vehicleA.circumstances.drivingParallel` | `vehicleB.circumstances.drivingParallel` | boolean |
| Changing Lanes | `vehicleA.circumstances.changingLanes` | `vehicleB.circumstances.changingLanes` | boolean |
| Overtaking | `vehicleA.circumstances.overtaking` | `vehicleB.circumstances.overtaking` | boolean |
| Turning Right | `vehicleA.circumstances.turningRight` | `vehicleB.circumstances.turningRight` | boolean |
| Turning Left | `vehicleA.circumstances.turningLeft` | `vehicleB.circumstances.turningLeft` | boolean |
| Reversing | `vehicleA.circumstances.reversing` | `vehicleB.circumstances.reversing` | boolean |
| Entered Opposite Lane | `vehicleA.circumstances.enteredOppositeLane` | `vehicleB.circumstances.enteredOppositeLane` | boolean |
| Coming From Right | `vehicleA.circumstances.comingFromRight` | `vehicleB.circumstances.comingFromRight` | boolean |
| Failed To Yield | `vehicleA.circumstances.failedToYield` | `vehicleB.circumstances.failedToYield` | boolean |

#### Impact Markers

| Label | Internal Path (A) | Internal Path (B) | Type | Structure |
|-------|------------------|------------------|------|-----------|
| Impact Markers | `vehicleA.impactMarkers` | `vehicleB.impactMarkers` | array | Array of `ImpactArrow` objects |

**ImpactArrow Structure:**
```typescript
{
  id: string;           // Unique identifier
  x: number;           // X coordinate (0-500)
  y: number;           // Y coordinate (0-500)
  rotation: number;    // Rotation in degrees (0-360)
}
```

---

## Signatures

| Label | Internal Path | Type | Format |
|-------|--------------|------|--------|
| Driver A Signature | `signatures.driverA` | image | Base64 PNG string |
| Driver B Signature | `signatures.driverB` | image | Base64 PNG string |

---

## Metadata

| Field | Internal Path | Type | Example |
|-------|--------------|------|---------|
| Created At | `createdAt` | datetime | ISO 8601 string |

---

## PDF Field Naming Convention for pdf-lib

When creating form fields in your PDF template, use the following naming convention to map them directly to the form data:

### Naming Format
For simple fields, use the internal path with dots replaced by underscores:
- `section1_dateOfAccident`
- `vehicleA_policyholder_surname`
- `vehicleB_vehicle_registrationNumber`

### Complete List for PDF Field Names

#### Section 1
- `section1_dateOfAccident`
- `section1_timeOfAccident`
- `section1_location`
- `section1_city`
- `section1_state`

#### Section 2
- `section2_injuries`
- `section2_damageOtherVehicles`
- `section2_damageOtherItems`
- `section2_witnesses`

#### Vehicle A - Section 6 (Policyholder)
- `vehicleA_policyholder_surname`
- `vehicleA_policyholder_firstname`
- `vehicleA_policyholder_address`
- `vehicleA_policyholder_postalCode`
- `vehicleA_policyholder_country`
- `vehicleA_policyholder_phoneEmail`

#### Vehicle A - Section 7 (Vehicle)
- `vehicleA_vehicle_vehicleType`
- `vehicleA_vehicle_make`
- `vehicleA_vehicle_model`
- `vehicleA_vehicle_registrationNumber`
- `vehicleA_vehicle_countryOfRegistration`

#### Vehicle A - Section 8 (Insurance)
- `vehicleA_insurance_insuranceCompanyName`
- `vehicleA_insurance_policyNumber`
- `vehicleA_insurance_greenCardNumber`
- `vehicleA_insurance_greenCardValidFrom`
- `vehicleA_insurance_greenCardValidTo`
- `vehicleA_insurance_branch`
- `vehicleA_insurance_branchAddress`
- `vehicleA_insurance_branchCountry`
- `vehicleA_insurance_branchPhone`
- `vehicleA_insurance_comprehensiveInsurance`

#### Vehicle A - Section 9 (Driver)
- `vehicleA_driver_surname`
- `vehicleA_driver_firstname`
- `vehicleA_driver_dateOfBirth`
- `vehicleA_driver_address`
- `vehicleA_driver_country`
- `vehicleA_driver_phone`
- `vehicleA_driver_licenceNumber`
- `vehicleA_driver_licenceCategory`
- `vehicleA_driver_licenceValidUntil`

#### Vehicle A - Section 10 (Damage)
- `vehicleA_visibleDamage`
- `vehicleA_additionalNotes`
- `vehicleA_circumstances_parked`
- `vehicleA_circumstances_stopped`
- `vehicleA_circumstances_openedDoor`
- `vehicleA_circumstances_parking`
- `vehicleA_circumstances_leavingParkingArea`
- `vehicleA_circumstances_enteringParkingArea`
- `vehicleA_circumstances_enteringRoundabout`
- `vehicleA_circumstances_drivingRoundabout`
- `vehicleA_circumstances_rearEndCollision`
- `vehicleA_circumstances_drivingParallel`
- `vehicleA_circumstances_changingLanes`
- `vehicleA_circumstances_overtaking`
- `vehicleA_circumstances_turningRight`
- `vehicleA_circumstances_turningLeft`
- `vehicleA_circumstances_reversing`
- `vehicleA_circumstances_enteredOppositeLane`
- `vehicleA_circumstances_comingFromRight`
- `vehicleA_circumstances_failedToYield`

#### Vehicle B - All sections (repeat same structure as Vehicle A but replace "vehicleA" with "vehicleB")
- `vehicleB_policyholder_surname`
- `vehicleB_policyholder_firstname`
- `vehicleB_policyholder_address`
- `vehicleB_policyholder_postalCode`
- `vehicleB_policyholder_country`
- `vehicleB_policyholder_phoneEmail`
- `vehicleB_vehicle_vehicleType`
- `vehicleB_vehicle_make`
- `vehicleB_vehicle_model`
- `vehicleB_vehicle_registrationNumber`
- `vehicleB_vehicle_countryOfRegistration`
- `vehicleB_insurance_insuranceCompanyName`
- `vehicleB_insurance_policyNumber`
- `vehicleB_insurance_greenCardNumber`
- `vehicleB_insurance_greenCardValidFrom`
- `vehicleB_insurance_greenCardValidTo`
- `vehicleB_insurance_branch`
- `vehicleB_insurance_branchAddress`
- `vehicleB_insurance_branchCountry`
- `vehicleB_insurance_branchPhone`
- `vehicleB_insurance_comprehensiveInsurance`
- `vehicleB_driver_surname`
- `vehicleB_driver_firstname`
- `vehicleB_driver_dateOfBirth`
- `vehicleB_driver_address`
- `vehicleB_driver_country`
- `vehicleB_driver_phone`
- `vehicleB_driver_licenceNumber`
- `vehicleB_driver_licenceCategory`
- `vehicleB_driver_licenceValidUntil`
- `vehicleB_visibleDamage`
- `vehicleB_additionalNotes`
- `vehicleB_circumstances_parked`
- `vehicleB_circumstances_stopped`
- `vehicleB_circumstances_openedDoor`
- `vehicleB_circumstances_parking`
- `vehicleB_circumstances_leavingParkingArea`
- `vehicleB_circumstances_enteringParkingArea`
- `vehicleB_circumstances_enteringRoundabout`
- `vehicleB_circumstances_drivingRoundabout`
- `vehicleB_circumstances_rearEndCollision`
- `vehicleB_circumstances_drivingParallel`
- `vehicleB_circumstances_changingLanes`
- `vehicleB_circumstances_overtaking`
- `vehicleB_circumstances_turningRight`
- `vehicleB_circumstances_turningLeft`
- `vehicleB_circumstances_reversing`
- `vehicleB_circumstances_enteredOppositeLane`
- `vehicleB_circumstances_comingFromRight`
- `vehicleB_circumstances_failedToYield`

#### Signatures
- `signatures_driverA`
- `signatures_driverB`

#### Metadata
- `createdAt`

---

## Usage Examples

### For JavaScript/TypeScript Mapping

```javascript
// Helper function to get field value by path
function getValueByPath(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

// Example usage
const dateOfAccident = getValueByPath(formData, 'section1.dateOfAccident');
const vehicleAmake = getValueByPath(formData, 'vehicleA.vehicle.make');
const driverBphone = getValueByPath(formData, 'vehicleB.driver.phone');
```

### For PDF Field Mapping with pdf-lib

```javascript
// Convert internal path to PDF field name
function toPdfFieldName(internalPath) {
  return internalPath.replace(/\./g, '_');
}

// Fill form field in PDF
const pdfFieldName = toPdfFieldName('vehicleA.policyholder.surname');
form.getField(pdfFieldName).setText(formData.vehicleA.policyholder.surname);
```

---

## Notes

- All text fields can accept any string value
- Boolean fields (circumstances) should store `true` or `false`
- Date fields should use `YYYY-MM-DD` format
- Time fields should use `HH:MM` format (24-hour)
- The `impactMarkers` array contains objects with coordinates and rotation
- Signatures are stored as Base64 PNG image strings
- Empty fields should use empty string `''` or appropriate default value
