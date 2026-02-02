# Code Cleanup Analysis Report

Generated: January 31, 2026

## Summary
This project has **moderate code cleanup opportunities** with unused npm packages, unused storage functions, and no significant commented-out dead code.

---

## 1. UNUSED NPM PACKAGES

### Package: `lz-string` (^1.5.0)
**Status:** ❌ **UNUSED - Can be safely removed**

**Details:**
- Imported in `package.json` as a dependency
- **No imports found** in any TypeScript/React files
- Search results show 0 matches across all `.ts` and `.tsx` files
- The project uses `pako` (gzip/ungzip) instead for compression

**Recommendation:** Remove from `package.json`

```json
// Remove this line:
"lz-string": "^1.5.0",
```

---

## 2. UNUSED FUNCTIONS IN `storage.ts`

### Unused Storage Functions

#### 1. `reportToJSON()` - Line 172
**Status:** ❌ **UNUSED**
```typescript
export const reportToJSON = (report: AccidentReport): string => {
  return JSON.stringify(report);
};
```
- **Used by:** 0 files
- **Why unused:** Project uses direct `JSON.stringify()` calls instead
- **Can be removed:** Yes, safely

#### 2. `jsonToReport()` - Line 176
**Status:** ❌ **UNUSED**
```typescript
export const jsonToReport = (json: string): AccidentReport => {
  return JSON.parse(json);
};
```
- **Used by:** 0 files
- **Why unused:** Project uses direct `JSON.parse()` calls instead
- **Can be removed:** Yes, safely

#### 3. `exportReportJSON()` - Line 191
**Status:** ❌ **UNUSED**
```typescript
export const exportReportJSON = (report: AccidentReport): void => {
  const dataStr = JSON.stringify(report, null, 2);
  // ... blob download logic
};
```
- **Used by:** 0 files
- **Why unused:** The app handles JSON export differently (inline in components)
- **Note:** A similar pattern exists inline in `AccidentForm.tsx` (handleSaveJSON)
- **Can be removed:** Yes, safely

#### 4. `saveReport()` - Line 135
**Status:** ❌ **UNUSED**
```typescript
export const saveReport = async (report: AccidentReport): Promise<number> => {
  const db = await initializeDB();
  // ... saves to IndexedDB
};
```
- **Used by:** 0 files
- **Why unused:** Full accident reports are not persisted to IndexedDB, only templates
- **Can be removed:** Yes, safely

#### 5. `getReport()` - Line 147
**Status:** ❌ **UNUSED**
```typescript
export const getReport = async (id: number): Promise<AccidentReport | undefined> => {
  // ... retrieves from IndexedDB
};
```
- **Used by:** 0 files
- **Why unused:** Not used with accident reports
- **Can be removed:** Yes, safely

#### 6. `getAllReports()` - Line 159
**Status:** ❌ **UNUSED**
```typescript
export const getAllReports = async (): Promise<AccidentReport[]> => {
  // ... retrieves all from IndexedDB
};
```
- **Used by:** 0 files
- **Why unused:** No UI feature to list saved reports
- **Can be removed:** Yes, safely

---

### Functions That ARE Used ✅

These should be kept:
- `initializeDB()` - Used by all template functions
- `compressVehicleData()` - Used by `VehicleModal.tsx` (QR generation)
- `decompressVehicleData()` - Used by `VehicleModal.tsx` and `QRModal.tsx` (QR scanning)
- `compressReport()` - Used by `QRModal.tsx` (full accident report QR)
- `decompressReport()` - Used by `QRModal.tsx` (scanning accident report QR)
- `saveVehicleTemplate()` - Used by `VehicleModal.tsx`
- `getVehicleTemplate()` - Used by `VehicleModal.tsx`
- `getAllVehicleTemplates()` - Used by `VehicleModal.tsx`
- `deleteVehicleTemplate()` - Used by `VehicleModal.tsx`

---

## 3. UNUSED IMPORTS IN COMPONENTS

### No unused imports detected ✅

All imported modules and functions are actively used:
- **React** - Used for component definitions
- **useTranslation** - Used for i18n in all components
- **Component imports** - All imported components are rendered
- **Type imports** - All imported types are used

---

## 4. DEAD CODE & COMMENTED CODE

### Status: ✅ No significant dead code found

The project is relatively clean:
- **Commented-out code blocks:** None found
- **Unreachable code:** None found
- **Console logs:** Present but intentional (debugging aids)
  - Example: `console.log()` in `VehicleModal.tsx` (camera/QR debugging)

---

## 5. UNUSED COMPONENT EXPORTS/FUNCTIONS

### `AccidentForm.tsx` - All used ✅
- All local functions are used
- All state variables serve a purpose

### `VehicleModal.tsx` - All used ✅
- All handler functions are bound to UI events
- All state variables are necessary

### `VehicleSection.tsx` - All used ✅
- Component properly utilized by `AccidentForm.tsx`
- All functions have clear purpose

### `QRModal.tsx` - All used ✅
- All functions are event handlers
- Component imported and used by `AccidentForm.tsx`

### `ImpactMarker.tsx` - All used ✅
- All functions handle canvas interactions
- Component imported and used by `VehicleSection.tsx`

---

## 6. SUMMARY OF REMOVABLE ITEMS

### Safe to Remove (6 items in storage.ts):
1. ❌ `reportToJSON()` function
2. ❌ `jsonToReport()` function
3. ❌ `exportReportJSON()` function
4. ❌ `saveReport()` function
5. ❌ `getReport()` function
6. ❌ `getAllReports()` function

### Safe to Remove (1 package):
1. ❌ `lz-string` npm package

### Total Code Reduction: ~70 lines + npm package

---

## 7. CLEANUP CHECKLIST

- [ ] Remove `lz-string` from `package.json`
- [ ] Run `npm install` to clean up node_modules
- [ ] Remove unused storage functions from `src/utils/storage.ts`
- [ ] Run `npm run lint` to verify no regressions
- [ ] Test QR generation/scanning (uses remaining compress/decompress functions)
- [ ] Test vehicle template save/load functionality

