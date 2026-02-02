# PDF Form Field Mapping - Complete Documentation

This document provides a quick reference to all available form field mapping resources for the Accident Report application.

## 📋 Available Resources

### 1. **FORM_FIELDS_MAPPING.md** - Complete Reference Guide
Location: `c:\repos\son\FORM_FIELDS_MAPPING.md`

A comprehensive markdown document containing:
- All 122+ form fields organized by section
- Internal path names (e.g., `vehicleA.policyholder.surname`)
- PDF field naming convention (e.g., `vehicleA_policyholder_surname`)
- Field types: text, select, checkbox, image, datetime
- Example values and usage patterns
- Quick reference lists for all vehicle sections
- Helper function examples

**Use this to:**
- Understand the complete form structure
- Create PDF templates with proper field names
- Document the API for other developers

---

### 2. **FORM_FIELDS_MAPPING.json** - Machine-Readable Configuration
Location: `c:\repos\son\FORM_FIELDS_MAPPING.json`

Structured JSON format containing:
- Hierarchical field definitions with metadata
- Field types, formats, and allowed values
- Field counts and statistics
- Easily parseable for automation or tools
- Programmatic access to field configurations

**Use this to:**
- Automate PDF form creation
- Build form validators
- Generate documentation automatically
- Create IDE autocomplete helpers

---

### 3. **pdfFormMapping.ts** - TypeScript Utility Module
Location: `c:\repos\son\src\utils\pdfFormMapping.ts`

Production-ready TypeScript code with functions:

#### Core Utilities
- `toPdfFieldName(dotPath)` - Convert internal paths to PDF field names
- `getValueByPath(obj, path)` - Get nested object values
- `setValueByPath(obj, path, value)` - Set nested object values

#### Data Conversion
- `boolToPdfCheckbox(value)` - Convert booleans to PDF checkbox values
- `selectValueToText(value, fieldType)` - Convert select options to display text

#### Bulk Operations
- `mapFormDataToPdf(formData)` - Complete form data to PDF mapping
- `getAllFieldNamesForPrefix(prefix)` - Get all PDF field names for a section
- `getAllFieldPathsForSection(vehicle, section)` - Get all internal paths

#### Configuration
- `FORM_FIELDS_CONFIG` - Field lists organized by section (Record<string, string[]>)

**Use this to:**
- Fill PDF forms programmatically with pdf-lib
- Access form field configuration in your application
- Convert between internal paths and PDF field names
- Handle type conversions for different field types

---

### 4. **README_PDF_FORM_MAPPING.md** - Implementation Guide
Location: `c:\repos\son\README_PDF_FORM_MAPPING.md`

Step-by-step guide covering:
- Overview and feature summary
- Getting started (3 main steps)
- Field types and their values
- Advanced usage examples
- Creating PDF templates (Adobe, LibreOffice, pdf-lib)
- Complete code examples
- Troubleshooting guide
- Best practices
- Integration with the application

**Use this to:**
- Learn how to implement PDF form filling
- Create and test your PDF templates
- Debug field mapping issues
- Integrate with the accident report application

---

## 🚀 Quick Start

### For PDF Template Creators

1. **Read:** `FORM_FIELDS_MAPPING.md` (Section "PDF Field Naming Convention for pdf-lib")
2. **Reference:** The complete field list for your template software (Adobe, LibreOffice, etc.)
3. **Create:** Form fields with names like `section1_dateOfAccident`, `vehicleA_policyholder_surname`, etc.
4. **Test:** Follow the "Creating the PDF Template" section in `README_PDF_FORM_MAPPING.md`

### For Developers

1. **Install:** No additional packages needed (uses pdf-lib)
2. **Import:** 
   ```typescript
   import { mapFormDataToPdf } from './utils/pdfFormMapping';
   ```
3. **Use:**
   ```typescript
   const pdfData = mapFormDataToPdf(formData);
   ```
4. **Reference:** Code examples in `README_PDF_FORM_MAPPING.md`

---

## 📊 Form Structure Overview

```
Total Fields: 122+

Section 1: Accident Date & Location
├── dateOfAccident (text)
├── timeOfAccident (text)
├── location (text)
├── city (text)
└── state (text)

Section 2: Accident Information
├── injuries (select: yes/no)
├── damageOtherVehicles (select: yes/no)
├── damageOtherItems (select: yes/no)
└── witnesses (text)

Vehicle A & B (x2)
├── Section 6: Policyholder Info (6 fields)
├── Section 7: Vehicle Info (5 fields)
├── Section 8: Insurance Info (10 fields)
├── Section 9: Driver Info (9 fields)
├── Section 10: Damage Info
│   ├── visibleDamage (text)
│   ├── additionalNotes (text)
│   ├── circumstances (18 checkboxes)
│   └── impactMarkers (array)
└── Total per vehicle: 51 fields

Signatures
├── driverA (image/base64)
└── driverB (image/base64)

Metadata
└── createdAt (datetime)
```

---

## 🔗 Field Naming Examples

### Internal Path → PDF Field Name

```
section1.dateOfAccident → section1_dateOfAccident
section1.timeOfAccident → section1_timeOfAccident

section2.injuries → section2_injuries
section2.witnesses → section2_witnesses

vehicleA.policyholder.surname → vehicleA_policyholder_surname
vehicleA.policyholder.firstname → vehicleA_policyholder_firstname
vehicleA.vehicle.make → vehicleA_vehicle_make
vehicleA.insurance.policyNumber → vehicleA_insurance_policyNumber
vehicleA.driver.licenceNumber → vehicleA_driver_licenceNumber
vehicleA.circumstances.parked → vehicleA_circumstances_parked
vehicleA.visibleDamage → vehicleA_visibleDamage
vehicleA.additionalNotes → vehicleA_additionalNotes

vehicleB.policyholder.surname → vehicleB_policyholder_surname
(Same pattern for vehicleB - all fields prefixed with vehicleB)

signatures.driverA → signatures_driverA
signatures.driverB → signatures_driverB
```

---

## 💡 Common Use Cases

### Use Case 1: Create PDF Template in Adobe Acrobat
1. Open your form template PDF
2. Tools → Prepare Form
3. Add text fields with names like `section1_dateOfAccident`
4. Add checkboxes with names like `vehicleA_circumstances_parked`
5. Reference `FORM_FIELDS_MAPPING.md` for all field names

### Use Case 2: Fill PDF Form Programmatically
```typescript
import { PDFDocument } from 'pdf-lib';
import { mapFormDataToPdf } from './utils/pdfFormMapping';

const pdfBytes = await fetch('template.pdf').then(r => r.arrayBuffer());
const doc = await PDFDocument.load(pdfBytes);
const form = doc.getForm();
const data = mapFormDataToPdf(formData);

Object.entries(data).forEach(([name, value]) => {
  try {
    form.getField(name).setText(String(value));
  } catch (e) {
    console.warn(`Field ${name} not found`);
  }
});

await doc.save();
```

### Use Case 3: Validate Form Before PDF Export
```typescript
import { getValueByPath, FORM_FIELDS_CONFIG } from './utils/pdfFormMapping';

function validateForm(formData) {
  const errors = [];
  
  FORM_FIELDS_CONFIG.section1.forEach(field => {
    const value = getValueByPath(formData, `section1.${field}`);
    if (!value) {
      errors.push(`Missing: section1.${field}`);
    }
  });
  
  return errors;
}
```

### Use Case 4: Generate Field List for Documentation
```typescript
import { FORM_FIELDS_CONFIG } from './utils/pdfFormMapping';

function generateFieldList() {
  Object.entries(FORM_FIELDS_CONFIG).forEach(([section, fields]) => {
    console.log(`\n${section}:`);
    fields.forEach(field => {
      console.log(`  - ${field}`);
    });
  });
}
```

---

## 🔧 Integration Checklist

- [ ] Review `FORM_FIELDS_MAPPING.md` for complete field list
- [ ] Create PDF template with appropriate form fields
- [ ] Use correct PDF field naming convention (underscore-separated)
- [ ] Test field names match exactly (case-sensitive)
- [ ] Import `mapFormDataToPdf` from `pdfFormMapping.ts`
- [ ] Add pdf-lib to project if not already installed
- [ ] Implement PDF filling logic in your export handler
- [ ] Test with sample data
- [ ] Handle missing fields gracefully
- [ ] Document any custom fields added to the template

---

## 📝 Key Numbers

| Metric | Count |
|--------|-------|
| Total form fields | 122+ |
| Section 1 fields | 5 |
| Section 2 fields | 4 |
| Policyholder fields per vehicle | 6 |
| Vehicle fields per vehicle | 5 |
| Insurance fields per vehicle | 10 |
| Driver fields per vehicle | 9 |
| Circumstances checkboxes per vehicle | 18 |
| Fields per vehicle (total) | 51 |
| Signature fields | 2 |
| Metadata fields | 1 |
| **Total (both vehicles)** | **122+** |

---

## 📚 Related Files

### Source Code
- `src/utils/pdfFormMapping.ts` - Utility functions (production code)
- `src/utils/pdfExport.ts` - Current PDF export implementation
- `src/components/AccidentForm.tsx` - Main form component

### Configuration
- `FORM_FIELDS_MAPPING.json` - Machine-readable field definitions
- `FORM_FIELDS_MAPPING.md` - Human-readable field reference

### Documentation
- `README_PDF_FORM_MAPPING.md` - Complete implementation guide
- This file - Quick reference and overview

---

## 🎯 Next Steps

1. **Choose your approach:**
   - Option A: Create PDF template with form fields, use `mapFormDataToPdf()` to fill
   - Option B: Use current generation method and enhance it

2. **For Option A (Recommended):**
   - Create PDF template using `FORM_FIELDS_MAPPING.md` as reference
   - Implement pdf-lib integration using `README_PDF_FORM_MAPPING.md`
   - Test with sample data
   - Replace current PDF export implementation

3. **For Option B:**
   - Continue enhancing `pdfExport.ts` with additional features
   - Use field paths from `FORM_FIELDS_MAPPING.ts` for consistency
   - Keep documentation updated with changes

---

## 📞 Support

For detailed information on any topic:
- **Field definitions:** See `FORM_FIELDS_MAPPING.md`
- **Implementation:** See `README_PDF_FORM_MAPPING.md`
- **Code usage:** See `pdfFormMapping.ts` with JSDoc comments
- **Machine access:** See `FORM_FIELDS_MAPPING.json`

---

Generated: February 2, 2026
Accident Report Application v1.0
