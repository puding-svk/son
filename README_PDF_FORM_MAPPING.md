# PDF Form Field Mapping Guide

This guide explains how to use the form field mapping utilities to create PDF templates with fillable form fields using pdf-lib.

## Overview

The accident report application provides a comprehensive mapping system that allows you to:
1. Map form data to PDF form fields
2. Create PDF templates with form fields that match the application data structure
3. Automatically fill PDF form fields with user-entered data

## Files Reference

### 1. **FORM_FIELDS_MAPPING.md**
Complete markdown documentation with:
- All form fields organized by section
- Internal path names for each field
- PDF field naming conventions
- Field types and examples
- Usage examples with code snippets

### 2. **FORM_FIELDS_MAPPING.json**
Machine-readable JSON configuration with:
- Complete field structure hierarchy
- Field metadata (type, format, options)
- Field counts and statistics
- Programmatic access to field definitions

### 3. **pdfFormMapping.ts**
TypeScript utility module with helper functions:
- `toPdfFieldName()` - Convert internal paths to PDF field names
- `getValueByPath()` - Get values from nested objects
- `setValueByPath()` - Set values in nested objects
- `mapFormDataToPdf()` - Complete form-to-PDF data mapping
- `boolToPdfCheckbox()` - Convert booleans to checkbox values
- `selectValueToText()` - Convert select values to display text
- Field configuration constants for bulk operations

## Getting Started

### Step 1: Review the Field List

Start with `FORM_FIELDS_MAPPING.md` to understand the structure. There are approximately **122 fillable fields** organized into:

- **Section 1**: Accident date and location (5 fields)
- **Section 2**: Accident information (4 fields)
- **Vehicle A & B**: Each contains:
  - Policyholder info (6 fields)
  - Vehicle info (5 fields)
  - Insurance info (10 fields)
  - Driver info (9 fields)
  - Damage description (2 fields)
  - Circumstances (18 checkboxes)
  - Impact markers (1 array field)
- **Signatures**: Driver A & B (2 fields)
- **Metadata**: Created date (1 field)

### Step 2: Create a PDF Template

Create your PDF template using Adobe Acrobat, LibreOffice, or another PDF editor. Add form fields with names matching the PDF field names convention:

**Naming Convention:**
Internal path → PDF field name (replace dots with underscores)

Examples:
- `section1.dateOfAccident` → `section1_dateOfAccident`
- `vehicleA.policyholder.surname` → `vehicleA_policyholder_surname`
- `vehicleB.driver.phone` → `vehicleB_driver_phone`
- `vehicleA.circumstances.parked` → `vehicleA_circumstances_parked` (checkbox)

### Step 3: Implement PDF Filling

Use the `mapFormDataToPdf()` utility with pdf-lib:

```typescript
import { PDFDocument } from 'pdf-lib';
import { mapFormDataToPdf } from './utils/pdfFormMapping';

// Load your PDF template
const pdfBytes = await fetch('path/to/template.pdf').then(res => res.arrayBuffer());
const pdfDoc = await PDFDocument.load(pdfBytes);
const form = pdfDoc.getForm();

// Map form data to PDF fields
const pdfData = mapFormDataToPdf(formData);

// Fill each field
Object.entries(pdfData).forEach(([fieldName, value]) => {
  try {
    const field = form.getField(fieldName);
    
    if (typeof value === 'string') {
      if (field instanceof PDFTextField) {
        field.setText(value);
      } else if (field instanceof PDFCheckBox) {
        field.check();
      }
    } else if (typeof value === 'boolean' && value) {
      if (field instanceof PDFCheckBox) {
        field.check();
      }
    }
  } catch (e) {
    console.warn(`Field ${fieldName} not found in PDF template`);
  }
});

// Save or download the filled PDF
const filledPdfBytes = await pdfDoc.save();
const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'filled_accident_report.pdf';
a.click();
```

## Field Types and Values

### Text Fields
- Accept any string value
- Examples: names, addresses, phone numbers, license numbers
- No special formatting applied

### Select/Dropdown Fields
These have specific allowed values:

```
Injuries: 'yes' | 'no'
Damage to other vehicles: 'yes' | 'no'
Damage to other property: 'yes' | 'no'
Comprehensive Insurance: 'yes' | 'no'
Vehicle Type: 'vehicle' | 'trailer'
```

### Checkboxes
Boolean fields (true/false) representing circumstances checked:
- parked, stopped, openedDoor, parking
- leavingParkingArea, enteringParkingArea
- enteringRoundabout, drivingRoundabout
- rearEndCollision, drivingParallel
- changingLanes, overtaking
- turningRight, turningLeft
- reversing, enteredOppositeLane
- comingFromRight, failedToYield

### Date Fields
Format: `YYYY-MM-DD`
- Examples: 2026-02-02, 1990-01-15, 2030-12-31

### Time Fields
Format: `HH:MM` (24-hour)
- Examples: 14:30, 09:15, 23:59

### Image Fields (Signatures)
- Stored as Base64 PNG strings
- Convert to image before inserting into PDF:

```typescript
import { PDFDocument, PDFPage } from 'pdf-lib';

const signatureBase64 = formData.signatures.driverA;
const signatureBytes = Uint8Array.from(atob(signatureBase64.split(',')[1]), c => c.charCodeAt(0));
const embeddedImage = await pdfDoc.embedPng(signatureBytes);

const page = pdfDoc.getPage(0);
page.drawImage(embeddedImage, {
  x: 50,
  y: 500,
  width: 80,
  height: 30,
});
```

## Advanced Usage

### Get All Fields for a Section

```typescript
import { getAllFieldPathsForSection } from './utils/pdfFormMapping';

// Get all policyholder fields for Vehicle A
const fields = getAllFieldPathsForSection('vehicleA', 'policyholder');
// Returns: ['vehicleA.policyholder.surname', 'vehicleA.policyholder.firstname', ...]
```

### Convert Internal Path to PDF Field Name

```typescript
import { toPdfFieldName } from './utils/pdfFormMapping';

const pdfFieldName = toPdfFieldName('vehicleA.policyholder.surname');
// Returns: 'vehicleA_policyholder_surname'
```

### Get Nested Value by Path

```typescript
import { getValueByPath } from './utils/pdfFormMapping';

const dateOfAccident = getValueByPath(formData, 'section1.dateOfAccident');
const surname = getValueByPath(formData, 'vehicleA.policyholder.surname');
```

## Creating the PDF Template

### Using Adobe Acrobat

1. Open your form template in Acrobat
2. Go to **Tools → Prepare Form**
3. For each field, add a form field:
   - Select appropriate field type (Text, Checkbox, etc.)
   - Right-click → Properties
   - Set the field **Name** using the PDF field naming convention
   - Configure font, size, and alignment
4. Save as **PDF (interactive forms)** or **PDF Form** format

### Using LibreOffice Draw

1. Open your form template
2. Go to **Form → Design Mode** (to enable form editing)
3. Insert form controls for each field:
   - Insert → Form Control → Text Box, Checkbox, etc.
   - Right-click → Properties
   - Set the name using the PDF field naming convention
4. Save as PDF with embedded forms

### Using PDF-lib Programmatically

You can also create form fields programmatically:

```typescript
import { PDFDocument } from 'pdf-lib';

const pdfDoc = await PDFDocument.load(templateBytes);
const form = pdfDoc.getForm();

// Add text field
form.createTextField('section1_dateOfAccident');
const dateField = form.getTextField('section1_dateOfAccident');
dateField.setText('2026-02-02');

// Add checkbox
form.createCheckBox('vehicleA_circumstances_parked');
const checkbox = form.getCheckBox('vehicleA_circumstances_parked');
checkbox.check();

const filledPdf = await pdfDoc.save();
```

## Field Mapping Examples

### Complete Vehicle A Example

```typescript
const vehicleAData = {
  // Policyholder (Section 6)
  'vehicleA_policyholder_surname': formData.vehicleA.policyholder.surname,
  'vehicleA_policyholder_firstname': formData.vehicleA.policyholder.firstname,
  'vehicleA_policyholder_address': formData.vehicleA.policyholder.address,
  'vehicleA_policyholder_postalCode': formData.vehicleA.policyholder.postalCode,
  'vehicleA_policyholder_country': formData.vehicleA.policyholder.country,
  'vehicleA_policyholder_phoneEmail': formData.vehicleA.policyholder.phoneEmail,
  
  // Vehicle (Section 7)
  'vehicleA_vehicle_vehicleType': formData.vehicleA.vehicle.vehicleType === 'vehicle' ? 'Motorové vozidlo' : 'Prívес',
  'vehicleA_vehicle_make': formData.vehicleA.vehicle.make,
  'vehicleA_vehicle_model': formData.vehicleA.vehicle.model,
  'vehicleA_vehicle_registrationNumber': formData.vehicleA.vehicle.registrationNumber,
  'vehicleA_vehicle_countryOfRegistration': formData.vehicleA.vehicle.countryOfRegistration,
  
  // ... and so on for insurance, driver, damage, circumstances
};
```

## Troubleshooting

### Field Not Found Error

If you get "Field not found in PDF template":
1. Check the PDF field names match exactly (case-sensitive)
2. Verify the field exists in your PDF template
3. Use `form.getFields()` to list all available fields in the PDF

### Values Not Appearing in PDF

1. Ensure the field type matches the data (text field for text, checkbox for boolean)
2. Check that the value is not empty or null
3. Verify the PDF template is in interactive form mode

### Checkbox Not Checking

Use the helper function to ensure proper format:

```typescript
import { boolToPdfCheckbox } from './utils/pdfFormMapping';

const checkboxValue = boolToPdfCheckbox(formData.vehicleA.circumstances.parked);
// Returns 'Yes' for true, 'Off' for false
```

## Best Practices

1. **Consistent Naming**: Always use the underscore naming convention for PDF fields
2. **Field Organization**: Group related fields together in your PDF template
3. **Validation**: Check for null/empty values before filling fields
4. **Error Handling**: Wrap PDF filling in try-catch to handle missing fields gracefully
5. **Testing**: Test with sample data to ensure all fields are properly mapped
6. **Documentation**: Keep track of custom PDF template field names if you add additional fields

## Integration with Application

To integrate PDF filling into the application:

```typescript
// In AccidentForm.tsx or your PDF export component
import { mapFormDataToPdf } from '../utils/pdfFormMapping';

const handleExportPDFWithTemplate = async () => {
  try {
    // Fetch the PDF template
    const templateResponse = await fetch('/templates/accident_report_template.pdf');
    const templateBytes = await templateResponse.arrayBuffer();
    
    // Load and fill the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    const pdfData = mapFormDataToPdf(formData);
    
    // Fill fields
    Object.entries(pdfData).forEach(([fieldName, value]) => {
      try {
        const field = form.getField(fieldName);
        // ... set field value
      } catch (e) {
        console.warn(`Field ${fieldName} not found`);
      }
    });
    
    // Save/download
    const filledPdf = await pdfDoc.save();
    // ... download logic
  } catch (error) {
    console.error('Error filling PDF:', error);
  }
};
```

## Summary

The form field mapping system provides:
- ✅ Complete field inventory (122+ fields)
- ✅ Internal path documentation for developers
- ✅ PDF field naming conventions for template creators
- ✅ Utility functions for programmatic access
- ✅ Type-safe TypeScript implementation
- ✅ Examples and best practices

Use this guide to create professional, pre-filled accident report PDFs that maintain data consistency between the web application and exported documents.
