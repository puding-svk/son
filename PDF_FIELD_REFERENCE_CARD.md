# PDF Form Field Quick Reference Card

## 🎯 At a Glance

**Total Fields:** 122+ | **File Format:** Underscore-separated paths | **Type Safety:** TypeScript

---

## 📍 All Sections

### Section 1: Accident Date & Location
```
section1_dateOfAccident
section1_timeOfAccident
section1_location
section1_city
section1_state
```

### Section 2: Accident Information
```
section2_injuries              (yes/no)
section2_damageOtherVehicles  (yes/no)
section2_damageOtherItems     (yes/no)
section2_witnesses
```

---

## 🚗 Vehicle A Fields (replace `A` with `B` for Vehicle B)

### 6. Policyholder
```
vehicleA_policyholder_surname
vehicleA_policyholder_firstname
vehicleA_policyholder_address
vehicleA_policyholder_postalCode
vehicleA_policyholder_country
vehicleA_policyholder_phoneEmail
```

### 7. Vehicle
```
vehicleA_vehicle_vehicleType            (vehicle/trailer)
vehicleA_vehicle_make
vehicleA_vehicle_model
vehicleA_vehicle_registrationNumber
vehicleA_vehicle_countryOfRegistration
```

### 8. Insurance
```
vehicleA_insurance_insuranceCompanyName
vehicleA_insurance_policyNumber
vehicleA_insurance_greenCardNumber
vehicleA_insurance_greenCardValidFrom   (YYYY-MM-DD)
vehicleA_insurance_greenCardValidTo     (YYYY-MM-DD)
vehicleA_insurance_branch
vehicleA_insurance_branchAddress
vehicleA_insurance_branchCountry
vehicleA_insurance_branchPhone
vehicleA_insurance_comprehensiveInsurance (yes/no)
```

### 9. Driver
```
vehicleA_driver_surname
vehicleA_driver_firstname
vehicleA_driver_dateOfBirth             (YYYY-MM-DD)
vehicleA_driver_address
vehicleA_driver_country
vehicleA_driver_phone
vehicleA_driver_licenceNumber
vehicleA_driver_licenceCategory
vehicleA_driver_licenceValidUntil       (YYYY-MM-DD)
```

### 10. Damage & Circumstances

**Damage Description:**
```
vehicleA_visibleDamage
vehicleA_additionalNotes
```

**Circumstances (Checkboxes):**
```
vehicleA_circumstances_parked
vehicleA_circumstances_stopped
vehicleA_circumstances_openedDoor
vehicleA_circumstances_parking
vehicleA_circumstances_leavingParkingArea
vehicleA_circumstances_enteringParkingArea
vehicleA_circumstances_enteringRoundabout
vehicleA_circumstances_drivingRoundabout
vehicleA_circumstances_rearEndCollision
vehicleA_circumstances_drivingParallel
vehicleA_circumstances_changingLanes
vehicleA_circumstances_overtaking
vehicleA_circumstances_turningRight
vehicleA_circumstances_turningLeft
vehicleA_circumstances_reversing
vehicleA_circumstances_enteredOppositeLane
vehicleA_circumstances_comingFromRight
vehicleA_circumstances_failedToYield
```

---

## 🖊️ Signatures & Metadata
```
signatures_driverA       (Base64 PNG image)
signatures_driverB       (Base64 PNG image)
createdAt               (ISO 8601 datetime)
```

---

## 🔄 Type Conversions

| Internal Path Contains | Value Type | PDF Value |
|----------------------|-----------|-----------|
| `injuries`, `damages` | `'yes'` | "Áno" |
| `injuries`, `damages` | `'no'` | "Nie" |
| `vehicleType` | `'vehicle'` | "Motorové vozidlo" |
| `vehicleType` | `'trailer'` | "Prívес" |
| Any `circumstances.*` | `true` | "Yes" (checkbox checked) |
| Any `circumstances.*` | `false` | "Off" (checkbox unchecked) |

---

## 💻 Code Snippets

### Import Utilities
```typescript
import { 
  mapFormDataToPdf,
  toPdfFieldName,
  getValueByPath,
  boolToPdfCheckbox
} from './utils/pdfFormMapping';
```

### Fill PDF with Form Data
```typescript
const pdfData = mapFormDataToPdf(formData);
Object.entries(pdfData).forEach(([fieldName, value]) => {
  form.getField(fieldName).setText(String(value));
});
```

### Get Single Field Value
```typescript
const dateOfAccident = getValueByPath(formData, 'section1.dateOfAccident');
const surname = getValueByPath(formData, 'vehicleA.policyholder.surname');
```

### Convert Path to PDF Field Name
```typescript
const pdfName = toPdfFieldName('vehicleA.policyholder.surname');
// Result: 'vehicleA_policyholder_surname'
```

---

## 📋 Field Count by Section

| Section | Fields |
|---------|--------|
| Accident Info | 9 |
| Vehicle A (all sections) | 51 |
| Vehicle B (all sections) | 51 |
| Signatures | 2 |
| Metadata | 1 |
| **Total** | **122** |

---

## 🎯 Path Naming Pattern

```
[section]_[subsection]_[field]

Examples:
section1_dateOfAccident
vehicleA_policyholder_surname
vehicleA_insurance_policyNumber
vehicleA_circumstances_parked
signatures_driverA
```

---

## ✅ Checklist for PDF Template Creation

- [ ] Create form fields in PDF editor (Adobe, LibreOffice, etc.)
- [ ] Use exact names from this reference card
- [ ] Match field types: Text, Checkbox, etc.
- [ ] Test field names (case-sensitive!)
- [ ] Save as interactive PDF form
- [ ] Load in pdf-lib for testing
- [ ] Fill with sample data using `mapFormDataToPdf()`
- [ ] Verify all fields appear correctly
- [ ] Handle missing fields gracefully

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| `FORM_FIELDS_MAPPING.md` | Complete field reference with examples |
| `FORM_FIELDS_MAPPING.json` | Machine-readable configuration |
| `README_PDF_FORM_MAPPING.md` | Step-by-step implementation guide |
| `pdfFormMapping.ts` | TypeScript utility functions |
| This file | Quick reference card |

---

## 🚀 Get Started

1. **For Creating PDF Templates:**
   → Use field names from sections above

2. **For Programming:**
   → `import { mapFormDataToPdf } from './utils/pdfFormMapping'`

3. **For Full Details:**
   → Read `README_PDF_FORM_MAPPING.md`

---

## 🔗 Field Path Conversion Reference

Convert dot notation → underscore notation:

```
. → _
```

Examples:
- `section1.dateOfAccident` → `section1_dateOfAccident`
- `vehicleA.policyholder.surname` → `vehicleA_policyholder_surname`
- `vehicleB.insurance.policyNumber` → `vehicleB_insurance_policyNumber`
- `vehicleA.circumstances.parked` → `vehicleA_circumstances_parked`

---

**Version:** 1.0 | **Date:** Feb 2, 2026 | **Status:** Production Ready
