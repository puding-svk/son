/**
 * PDF Form Field Mapping Utility
 * 
 * This utility provides helpers for mapping form data to PDF form fields
 * when using pdf-lib to fill form templates.
 */

/**
 * Converts a dot-notation path to PDF field name format (with underscores)
 * 
 * @example
 * toPdfFieldName('vehicleA.policyholder.surname') // -> 'vehicleA_policyholder_surname'
 * toPdfFieldName('section1.dateOfAccident') // -> 'section1_dateOfAccident'
 */
export function toPdfFieldName(dotPath: string): string {
  return dotPath.replace(/\./g, '_');
}

/**
 * Gets a value from an object using dot notation path
 * 
 * @example
 * const date = getValueByPath(formData, 'section1.dateOfAccident');
 * const surname = getValueByPath(formData, 'vehicleA.policyholder.surname');
 */
export function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Sets a value in an object using dot notation path
 * 
 * @example
 * setValueByPath(formData, 'vehicleA.policyholder.surname', 'Novak');
 */
export function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Converts boolean value to checkbox state for PDF
 * Returns 'Yes' for true, 'Off' for false
 */
export function boolToPdfCheckbox(value: any): string {
  if (value === true || value === 'yes') {
    return 'Yes';
  }
  return 'Off';
}

/**
 * Converts form select value to display text
 */
export function selectValueToText(value: string, fieldType: string): string {
  if (fieldType === 'injuries' || fieldType === 'damageOtherVehicles' || fieldType === 'damageOtherItems' || fieldType === 'comprehensiveInsurance') {
    if (value === 'yes') return 'Áno';
    if (value === 'no') return 'Nie';
  }
  if (fieldType === 'vehicleType') {
    if (value === 'vehicle') return 'Motorové vozidlo';
    if (value === 'trailer') return 'Prívес';
  }
  return value;
}

/**
 * Configuration for all form fields
 * Used for bulk operations and form validation
 */
export const FORM_FIELDS_CONFIG: Record<string, string[]> = {
  section1: ['dateOfAccident', 'timeOfAccident', 'state', 'city', 'location'],
  section2: ['injuries', 'damageOtherVehicles', 'damageOtherItems', 'witnesses'],
  vehicleAPolicyholder: ['surname', 'firstname', 'address', 'postalCode', 'country', 'phoneEmail'],
  vehicleAVehicle: ['vehicleType', 'make', 'model', 'registrationNumber', 'countryOfRegistration'],
  vehicleAInsurance: [
    'insuranceCompanyName',
    'policyNumber',
    'greenCardNumber',
    'greenCardValidFrom',
    'greenCardValidTo',
    'branch',
    'branchAddress',
    'branchCountry',
    'branchPhone',
    'comprehensiveInsurance',
  ],
  vehicleADriver: ['surname', 'firstname', 'dateOfBirth', 'address', 'country', 'phone', 'licenceNumber', 'licenceCategory', 'licenceValidUntil'],
  vehicleADamage: ['visibleDamage', 'additionalNotes'],
  vehicleACircumstances: [
    'parked',
    'stopped',
    'openedDoor',
    'parking',
    'leavingParkingArea',
    'enteringParkingArea',
    'enteringRoundabout',
    'drivingRoundabout',
    'rearEndCollision',
    'drivingParallel',
    'changingLanes',
    'overtaking',
    'turningRight',
    'turningLeft',
    'reversing',
    'enteredOppositeLane',
    'comingFromRight',
    'failedToYield',
  ],
};

/**
 * Helper to generate all PDF field names for a given prefix
 * 
 * @example
 * getAllFieldNamesForPrefix('vehicleA_policyholder')
 * // -> ['vehicleA_policyholder_surname', 'vehicleA_policyholder_firstname', ...]
 */
export function getAllFieldNamesForPrefix(prefix: string): string[] {
  const [vehicle, section] = prefix.split('_');
  const configKey = `${vehicle}${section.charAt(0).toUpperCase()}${section.slice(1)}`;
  const config = FORM_FIELDS_CONFIG[configKey];
  
  if (!config) return [];
  
  return config.map((field: string) => `${prefix}_${field}`);
}

/**
 * Gets all form field paths for a specific section
 * 
 * @example
 * getAllFieldPathsForSection('vehicleA', 'policyholder')
 * // -> ['vehicleA.policyholder.surname', 'vehicleA.policyholder.firstname', ...]
 */
export function getAllFieldPathsForSection(vehicle: string, section: string): string[] {
  const configKey = `${vehicle}${section.charAt(0).toUpperCase()}${section.slice(1)}`;
  const config = FORM_FIELDS_CONFIG[configKey];
  
  if (!config) return [];
  
  return config.map((field: string) => `${vehicle}.${section}.${field}`);
}

/**
 * Maps entire form data to PDF field values
 * Returns object with PDF field names as keys and values ready for PDF insertion
 * 
 * @example
 * const pdfData = mapFormDataToPdf(formData);
 * // { 'section1_dateOfAccident': '2026-02-02', 'vehicleA_policyholder_surname': 'Novak', ... }
 */
export function mapFormDataToPdf(formData: any): Record<string, any> {
  const result: Record<string, any> = {};

  // Section 1
  FORM_FIELDS_CONFIG.section1.forEach((field: string) => {
    const path = `section1.${field}`;
    const value = getValueByPath(formData, path);
    if (value) {
      result[toPdfFieldName(path)] = value;
    }
  });

  // Section 2
  FORM_FIELDS_CONFIG.section2.forEach((field: string) => {
    const path = `section2.${field}`;
    const value = getValueByPath(formData, path);
    if (value && field !== 'injuries' && field !== 'damageOtherVehicles' && field !== 'damageOtherItems') {
      result[toPdfFieldName(path)] = value;
    } else if (value && (field === 'injuries' || field === 'damageOtherVehicles' || field === 'damageOtherItems')) {
      result[toPdfFieldName(path)] = selectValueToText(value, field);
    }
  });

  // Vehicle A and B
  ['vehicleA', 'vehicleB'].forEach(vehicle => {
    // Policyholder
    FORM_FIELDS_CONFIG.vehicleAPolicyholder.forEach((field: string) => {
      const path = `${vehicle}.policyholder.${field}`;
      const value = getValueByPath(formData, path);
      if (value) {
        result[toPdfFieldName(path)] = value;
      }
    });

    // Vehicle
    FORM_FIELDS_CONFIG.vehicleAVehicle.forEach((field: string) => {
      const path = `${vehicle}.vehicle.${field}`;
      const value = getValueByPath(formData, path);
      if (value) {
        result[toPdfFieldName(path)] = selectValueToText(value, field);
      }
    });

    // Insurance
    FORM_FIELDS_CONFIG.vehicleAInsurance.forEach((field: string) => {
      const path = `${vehicle}.insurance.${field}`;
      const value = getValueByPath(formData, path);
      if (value) {
        result[toPdfFieldName(path)] = field === 'comprehensiveInsurance' ? selectValueToText(value, field) : value;
      }
    });

    // Driver
    FORM_FIELDS_CONFIG.vehicleADriver.forEach((field: string) => {
      const path = `${vehicle}.driver.${field}`;
      const value = getValueByPath(formData, path);
      if (value) {
        result[toPdfFieldName(path)] = value;
      }
    });

    // Damage
    FORM_FIELDS_CONFIG.vehicleADamage.forEach((field: string) => {
      const path = `${vehicle}.${field}`;
      const value = getValueByPath(formData, path);
      if (value) {
        result[toPdfFieldName(path)] = value;
      }
    });

    // Circumstances (checkboxes)
    FORM_FIELDS_CONFIG.vehicleACircumstances.forEach((field: string) => {
      const path = `${vehicle}.circumstances.${field}`;
      const value = getValueByPath(formData, path);
      if (value) {
        result[toPdfFieldName(path)] = boolToPdfCheckbox(value);
      }
    });
  });

  // Signatures
  if (formData.signatures?.driverA) {
    result['signatures_driverA'] = formData.signatures.driverA;
  }
  if (formData.signatures?.driverB) {
    result['signatures_driverB'] = formData.signatures.driverB;
  }

  return result;
}

/**
 * Example usage with pdf-lib:
 * 
 * import { PDFDocument } from 'pdf-lib';
 * import { mapFormDataToPdf } from './pdfFormMapping';
 * 
 * const pdfDoc = await PDFDocument.load(templatePdfBytes);
 * const form = pdfDoc.getForm();
 * const pdfData = mapFormDataToPdf(formData);
 * 
 * Object.entries(pdfData).forEach(([fieldName, value]) => {
 *   try {
 *     const field = form.getField(fieldName);
 *     if (typeof value === 'string') {
 *       if (field instanceof PDFTextField) {
 *         field.setText(value);
 *       } else if (field instanceof PDFCheckBox) {
 *         field.check();
 *       }
 *     }
 *   } catch (e) {
 *     console.warn(`Field ${fieldName} not found in PDF template`);
 *   }
 * });
 * 
 * const pdfBytes = await pdfDoc.save();
 */
