# PDF-lib Export Implementation

## Overview
Basic PDF export functionality implemented using `pdf-lib` library with a PDF template approach.

**Status:** ✅ Complete  
**Date:** February 2, 2026  
**Version:** 1.0

---

## Implementation Details

### Files Created/Modified

#### 1. **src/utils/pdfLibExport.ts** (NEW)
TypeScript utility for PDF export using pdf-lib

**Key Features:**
- Loads PDF template from `_misc_files/sprava_o_nehode_temp2.pdf`
- Fills the `section1_dateOfAccident` field with form data
- Flattens form fields (makes them immutable)
- Generates final PDF and triggers download
- Error handling for missing fields and template

**Function Signature:**
```typescript
export const exportToPDFWithTemplate = async (
  fileName: string = 'accident_report.pdf',
  formData?: any
): Promise<void>
```

**Usage:**
```typescript
import { exportToPDFWithTemplate } from '../utils/pdfLibExport';

await exportToPDFWithTemplate('my_report.pdf', formData);
```

#### 2. **src/components/AccidentForm.tsx** (MODIFIED)
- Added import for `exportToPDFWithTemplate`
- Converted placeholder button to active export button
- Button now triggers PDF export with timestamp filename
- Error handling with user feedback

**Button Implementation:**
```tsx
<button
  className="btn-primary"
  type="button"
  onClick={async () => {
    try {
      const fileName = `accident_report_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportToPDFWithTemplate(fileName, formData);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(t('message.exportError') || 'Failed to export PDF');
    }
  }}
>
  {t('common.placeholder') || 'Export to PDF'}
</button>
```

#### 3. **public/_misc_files/sprava_o_nehode_temp2.pdf** (COPIED)
PDF template file with form fields, copied from `_misc_files/sprava_o_nehode_temp2.pdf`

**Location:** Accessible via `BASE_URL + '_misc_files/sprava_o_nehode_temp2.pdf'`

---

## Current Limitations

Only **one field** is currently implemented:
- `section1_dateOfAccident` - Date of accident field

### Fields NOT Yet Implemented:
- All other text fields
- Dropdown/select fields
- Checkbox fields
- Signature fields
- Impact marker data
- Additional notes and sections

---

## How It Works

1. **Template Loading**
   - Fetches PDF template from public folder
   - Uses `PDFDocument.load()` from pdf-lib

2. **Field Filling**
   - Gets form field by name: `section1_dateOfAccident`
   - Sets text value from form data
   - Type-safe using `PDFTextField` class

3. **PDF Generation**
   - Flattens form (makes fields read-only in final PDF)
   - Converts to bytes
   - Creates blob and download link
   - Triggers browser download

4. **Error Handling**
   - Graceful fallback if field not found
   - User-friendly error messages
   - Console warnings for debugging

---

## Dependencies

- **pdf-lib** (^3.x) - Already installed
  - Manages PDF form fields and manipulation
  - Type-safe field handling
  - Cross-browser compatible

---

## Testing the Implementation

1. Fill in the "Dátum nehody" (Date of Accident) field in the form
2. Click the "Export to PDF" button
3. Check downloaded PDF - the date should appear in the template field

---

## Next Steps for Full Implementation

To implement remaining fields, follow this pattern:

```typescript
// In pdfLibExport.ts, add:
try {
  const fieldName = form.getField('field_name') as PDFTextField;
  if (fieldName instanceof PDFTextField) {
    fieldName.setText(formData.path.to.value);
  }
} catch (error) {
  console.warn('Field not found:', error);
}
```

**Fields to Add:**
1. All Section 1 fields (time, location, city, state)
2. Section 2 fields (injuries, damages, witnesses)
3. Vehicle A/B sections (50+ fields each)
4. Checkbox fields (using `PDFCheckBox.check()`)
5. Dropdown fields (using `PDFDropdown.select()`)
6. Signature image embedding

---

## Build Status

✅ **TypeScript Compilation:** Passed  
✅ **Bundle Size:** 1,045.88 kB (minified)  
✅ **PDF Template:** Included in dist  
✅ **Ready for Testing:** Yes  

---

## File Structure
```
son/
├── src/
│   ├── components/
│   │   └── AccidentForm.tsx (modified)
│   └── utils/
│       └── pdfLibExport.ts (new)
├── public/
│   └── _misc_files/
│       └── sprava_o_nehode_temp2.pdf (copied)
└── dist/
    └── _misc_files/
        └── sprava_o_nehode_temp2.pdf (built)
```

---

## Notes

- The PDF template path uses `import.meta.env.BASE_URL` for environment-aware URL handling
- Form fields are flattened after filling, making the final PDF non-editable (as intended for reports)
- Timestamps are added to exported filenames for uniqueness
- Template must have form fields with exact names matching field references
- Verify PDF template contains the `section1_dateOfAccident` field before testing
