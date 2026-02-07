import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import skLocale from '../locales/sk.json';
import enLocale from '../locales/en.json';
import { getImpactMarkerImage, getSignatureImage } from './storage';

// Map locales for easy access
const locales = {
  sk: skLocale,
  en: enLocale,
};

/**
 * Export accident report to PDF using pdf-lib with a template
 * Currently only fills the section1_dateOfAccident field
 */
export const exportToPDFWithTemplate = async (
  fileName: string = 'accident_report.pdf',
  formData?: any,
  language: string = 'sk'
) => {
  try {
    // Fetch the PDF template
    const templatePath = import.meta.env.BASE_URL + '_misc_files/sprava_o_nehode_temp8.pdf';
    const templateResponse = await fetch(templatePath);
    
    if (!templateResponse.ok) {
      throw new Error(`Failed to load PDF template: ${templateResponse.statusText}`);
    }

    const templateBuffer = await templateResponse.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(templateBuffer);
    
    // Register fontkit to enable custom font support for Unicode characters
    pdfDoc.registerFontkit(fontkit);
    
    // Load a Unicode font that supports Slovak characters (č, š, ž, etc.)
    // Font file should be placed in public/fonts/NimbusSanL-Bol.otf
    let customFont;
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const fontResponse = await fetch(basePath + 'fonts/NimbusSanL-Bol.otf');
      if (fontResponse.ok) {
        const fontBytes = await fontResponse.arrayBuffer();
        customFont = await pdfDoc.embedFont(fontBytes);
        console.log('Custom font loaded successfully');
      } else {
        console.warn('Custom font not found, using default font');
      }
    } catch (error) {
      console.warn('Failed to load custom font:', error);
    }
    

    const form = pdfDoc.getForm();
    
    // Store custom font for later use in updateFieldAppearances
    const fontForAppearances = customFont;

    // Get form data from localStorage if not provided
    if (!formData) {
      formData = JSON.parse(localStorage.getItem('accidentReport') || '{}');
    }

    // Fill the section1_dateOfAccident field
    try {
      const dateOfAccidentField = form.getField('section1_dateOfAccident') as PDFTextField;
      let dateValue = formData.section1?.dateOfAccident || '';
      
      // Convert from YYYY-MM-DD to DD. MMMM YYYY format (with full month name from locale)
      if (dateValue && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        
        let monthName = currentLocale.months.full[monthIndex] || month;
        let formattedDate = `${day}. ${monthName} ${year}`;        
        
        dateValue = formattedDate;
      }
      
      if (dateValue && dateOfAccidentField instanceof PDFTextField) {
        // Align text to the right
        dateOfAccidentField.setAlignment(2); // 2 = right alignment
        dateOfAccidentField.setText(dateValue);
      }
    } catch (error) {
      console.warn('Field section1_dateOfAccident not found in PDF template:', error);
    }

    // Fill the section1_timeOfAccident field
    try {
      const timeOfAccidentField = form.getField('section1_timeOfAccident') as PDFTextField;
      const timeValue = formData.section1?.timeOfAccident || '';
      
      if (timeValue && timeOfAccidentField instanceof PDFTextField) {
        timeOfAccidentField.setAlignment(2); // right alignment
        // Time is already in HH:MM format, just use it as-is
        timeOfAccidentField.setText(timeValue);
      }
    } catch (error) {
      console.warn('Field section1_timeOfAccident not found in PDF template:', error);
    }

    // Fill the section2 injuries checkboxes
    try {
      const injuriesValue = formData.section2?.injuries || '';
      
      // Check the appropriate checkbox based on the injuries value
      if (injuriesValue === 'yes') {
        const injuriesYesField = form.getField('section2_injuries_yes');
        if (injuriesYesField instanceof PDFCheckBox) {
          injuriesYesField.check();
        }
      } else if (injuriesValue === 'no') {
        const injuriesNoField = form.getField('section2_injuries_no');
        if (injuriesNoField instanceof PDFCheckBox) {
          injuriesNoField.check();
        }
      }
    } catch (error) {
      console.warn('Section2 injuries checkboxes not found in PDF template:', error);
    }

    // Fill the section1_location field
    try {
      const locationField = form.getField('section1_location') as PDFTextField;
      const locationValue = formData.section1?.location || '';
      
      if (locationValue && locationField instanceof PDFTextField) {
        locationField.setText(locationValue);
      }
    } catch (error) {
      console.warn('Field section1_location not found in PDF template:', error);
    }

    // Fill the section1_city field
    try {
      const cityField = form.getField('section1_city') as PDFTextField;
      const cityValue = formData.section1?.city || '';
      
      if (cityValue && cityField instanceof PDFTextField) {
        cityField.setText(cityValue);
      }
    } catch (error) {
      console.warn('Field section1_city not found in PDF template:', error);
    }

    // Fill the section1_state field
    try {
      const stateField = form.getField('section1_state') as PDFTextField;
      const stateValue = formData.section1?.state || '';
      
      if (stateValue && stateField instanceof PDFTextField) {
        stateField.setText(stateValue);
      }
    } catch (error) {
      console.warn('Field section1_state not found in PDF template:', error);
    }

    // Fill the section2_damageOtherVehicles checkboxes
    try {
      const damageOtherVehiclesValue = formData.section2?.damageOtherVehicles || '';
      
      if (damageOtherVehiclesValue === 'yes') {
        const damageYesField = form.getField('section2_damageOtherVehicles_yes');
        if (damageYesField instanceof PDFCheckBox) {
          damageYesField.check();
        }
      } else if (damageOtherVehiclesValue === 'no') {
        const damageNoField = form.getField('section2_damageOtherVehicles_no');
        if (damageNoField instanceof PDFCheckBox) {
          damageNoField.check();
        }
      }
    } catch (error) {
      console.warn('Section2 damageOtherVehicles checkboxes not found in PDF template:', error);
    }

    // Fill the section2_damageOtherItems checkboxes
    try {
      const damageOtherItemsValue = formData.section2?.damageOtherItems || '';
      
      if (damageOtherItemsValue === 'yes') {
        const damageItemsYesField = form.getField('section2_damageOtherItems_yes');
        if (damageItemsYesField instanceof PDFCheckBox) {
          damageItemsYesField.check();
        }
      } else if (damageOtherItemsValue === 'no') {
        const damageItemsNoField = form.getField('section2_damageOtherItems_no');
        if (damageItemsNoField instanceof PDFCheckBox) {
          damageItemsNoField.check();
        }
      }
    } catch (error) {
      console.warn('Section2 damageOtherItems checkboxes not found in PDF template:', error);
    }

    // Fill the section2_witnesses field
    try {
      const witnessesField = form.getField('section2_witnesses') as PDFTextField;
      const witnessesValue = formData.section2?.witnesses || '';
      
      if (witnessesValue && witnessesField instanceof PDFTextField) {
        witnessesField.setText(witnessesValue);
      }
    } catch (error) {
      console.warn('Field section2_witnesses not found in PDF template:', error);
    }

    // ===== VEHICLE A FIELDS =====
    
    // Vehicle A - Policyholder
    try {
      const vehicleAPoliceholderSurname = form.getField('vehicleA_policyholder_surname') as PDFTextField;
      if (vehicleAPoliceholderSurname instanceof PDFTextField && formData.vehicleA?.policyholder?.surname) {
        vehicleAPoliceholderSurname.setText(formData.vehicleA.policyholder.surname);
      }
    } catch (error) {
      console.warn('Field vehicleA_policyholder_surname not found:', error);
    }

    try {
      const vehicleAPoliceholderFirstname = form.getField('vehicleA_policyholder_firstname') as PDFTextField;
      if (vehicleAPoliceholderFirstname instanceof PDFTextField && formData.vehicleA?.policyholder?.firstname) {
        vehicleAPoliceholderFirstname.setText(formData.vehicleA.policyholder.firstname);
      }
    } catch (error) {
      console.warn('Field vehicleA_policyholder_firstname not found:', error);
    }

    try {
      const vehicleAPoliceholderAddress = form.getField('vehicleA_policyholder_address') as PDFTextField;
      if (vehicleAPoliceholderAddress instanceof PDFTextField && formData.vehicleA?.policyholder?.address) {
        vehicleAPoliceholderAddress.setText(formData.vehicleA.policyholder.address);
      }
    } catch (error) {
      console.warn('Field vehicleA_policyholder_address not found:', error);
    }

    try {
      const vehicleAPoliceholderPostalCode = form.getField('vehicleA_policyholder_postalCode') as PDFTextField;
      if (vehicleAPoliceholderPostalCode instanceof PDFTextField && formData.vehicleA?.policyholder?.postalCode) {// center alignment
        vehicleAPoliceholderPostalCode.setText(formData.vehicleA.policyholder.postalCode);
      }
    } catch (error) {
      console.warn('Field vehicleA_policyholder_postalCode not found:', error);
    }

    try {
      const vehicleAPoliceholderCountry = form.getField('vehicleA_policyholder_country') as PDFTextField;
      if (vehicleAPoliceholderCountry instanceof PDFTextField && formData.vehicleA?.policyholder?.country) {
        vehicleAPoliceholderCountry.setText(formData.vehicleA.policyholder.country);
      }
    } catch (error) {
      console.warn('Field vehicleA_policyholder_country not found:', error);
    }

    try {
      const vehicleAPoliceholderPhoneEmail = form.getField('vehicleA_policyholder_phoneEmail') as PDFTextField;
      if (vehicleAPoliceholderPhoneEmail instanceof PDFTextField && formData.vehicleA?.policyholder?.phoneEmail) {
        vehicleAPoliceholderPhoneEmail.setText(formData.vehicleA.policyholder.phoneEmail);
      }
    } catch (error) {
      console.warn('Field vehicleA_policyholder_phoneEmail not found:', error);
    }

    // Vehicle A - Vehicle/Trailer (conditional based on vehicleType)
    const vehicleAType = formData.vehicleA?.vehicle?.vehicleType || 'vehicle';
    const vehicleAFieldPrefix = `vehicleA_${vehicleAType}`;
    
    // For vehicles, there's a combined make_model field; for trailers, there is no such field
    if (vehicleAType === 'vehicle') {
      // Vehicle case: use combined make_model field
      try {
        const vehicleAMakeModel = form.getField('vehicleA_vehicle_make_model') as PDFTextField;
        if (vehicleAMakeModel instanceof PDFTextField && (formData.vehicleA?.vehicle?.make || formData.vehicleA?.vehicle?.model)) {
          const make = formData.vehicleA.vehicle.make || '';
          const model = formData.vehicleA.vehicle.model || '';
          const combinedValue = `${make}${make && model ? ', ' : ''}${model}`.trim();
          vehicleAMakeModel.setText(combinedValue);
        }
      } catch (error) {
        console.warn('Field vehicleA_vehicle_make_model not found:', error);
      }
    }    

    try {
      const vehicleARegistrationNumber = form.getField(`${vehicleAFieldPrefix}_registrationNumber`) as PDFTextField;
      if (vehicleARegistrationNumber instanceof PDFTextField && formData.vehicleA?.vehicle?.registrationNumber) {
        vehicleARegistrationNumber.setText(formData.vehicleA.vehicle.registrationNumber);
      }
    } catch (error) {
      console.warn('Field vehicleA_vehicle_registrationNumber not found:', error);
    }

    try {
      const vehicleACountryOfRegistration = form.getField(`${vehicleAFieldPrefix}_countryOfRegistration`) as PDFTextField;
      if (vehicleACountryOfRegistration instanceof PDFTextField && formData.vehicleA?.vehicle?.countryOfRegistration) {
        vehicleACountryOfRegistration.setText(formData.vehicleA.vehicle.countryOfRegistration);
      }
    } catch (error) {
      console.warn(`Field ${vehicleAFieldPrefix}_countryOfRegistration not found:`, error);
    }

    // Vehicle A - Insurance
    try {
      const vehicleAInsuranceCompanyName = form.getField('vehicleA_insurance_insuranceCompanyName') as PDFTextField;
      if (vehicleAInsuranceCompanyName instanceof PDFTextField && formData.vehicleA?.insurance?.insuranceCompanyName) {
        vehicleAInsuranceCompanyName.setText(formData.vehicleA.insurance.insuranceCompanyName);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_insuranceCompanyName not found:', error);
    }

    try {
      const vehicleAInsurancePolicyNumber = form.getField('vehicleA_insurance_policyNumber') as PDFTextField;
      if (vehicleAInsurancePolicyNumber instanceof PDFTextField && formData.vehicleA?.insurance?.policyNumber) {
        vehicleAInsurancePolicyNumber.setText(formData.vehicleA.insurance.policyNumber);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_policyNumber not found:', error);
    }

    try {
      const vehicleAInsuranceGreenCardNumber = form.getField('vehicleA_insurance_greenCardNumber') as PDFTextField;
      if (vehicleAInsuranceGreenCardNumber instanceof PDFTextField && formData.vehicleA?.insurance?.greenCardNumber) {
        vehicleAInsuranceGreenCardNumber.setText(formData.vehicleA.insurance.greenCardNumber);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_greenCardNumber not found:', error);
    }

    // Format green card dates (YYYY-MM-DD to DD. MMM YYYY with localized short month)
    try {
      const vehicleAInsuranceGreenCardValidFrom = form.getField('vehicleA_insurance_greenCardValidFrom') as PDFTextField;
      let greenCardValidFromValue = formData.vehicleA?.insurance?.greenCardValidFrom || '';
      
      if (greenCardValidFromValue && greenCardValidFromValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = greenCardValidFromValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        greenCardValidFromValue = `${day}. ${monthName} ${year}`;
      }
      
      if (greenCardValidFromValue && vehicleAInsuranceGreenCardValidFrom instanceof PDFTextField) {
        vehicleAInsuranceGreenCardValidFrom.setText(greenCardValidFromValue);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_greenCardValidFrom not found:', error);
    }

    try {
      const vehicleAInsuranceGreenCardValidTo = form.getField('vehicleA_insurance_greenCardValidTo') as PDFTextField;
      let greenCardValidToValue = formData.vehicleA?.insurance?.greenCardValidTo || '';
      
      if (greenCardValidToValue && greenCardValidToValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = greenCardValidToValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        greenCardValidToValue = `${day}. ${monthName} ${year}`;
      }
      
      if (greenCardValidToValue && vehicleAInsuranceGreenCardValidTo instanceof PDFTextField) {
        vehicleAInsuranceGreenCardValidTo.setText(greenCardValidToValue);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_greenCardValidTo not found:', error);
    }

    try {
      const vehicleAInsuranceBranch = form.getField('vehicleA_insurance_branch') as PDFTextField;
      if (vehicleAInsuranceBranch instanceof PDFTextField && formData.vehicleA?.insurance?.branch) {
        vehicleAInsuranceBranch.setText(formData.vehicleA.insurance.branch);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_branch not found:', error);
    }

    try {
      const vehicleAInsuranceBranchAddress = form.getField('vehicleA_insurance_branchAddress') as PDFTextField;
      if (vehicleAInsuranceBranchAddress instanceof PDFTextField && formData.vehicleA?.insurance?.branchAddress) {
        vehicleAInsuranceBranchAddress.setText(formData.vehicleA.insurance.branchAddress);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_branchAddress not found:', error);
    }

    try {
      const vehicleAInsuranceBranchCountry = form.getField('vehicleA_insurance_branchCountry') as PDFTextField;
      if (vehicleAInsuranceBranchCountry instanceof PDFTextField && formData.vehicleA?.insurance?.branchCountry) {
        vehicleAInsuranceBranchCountry.setText(formData.vehicleA.insurance.branchCountry);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_branchCountry not found:', error);
    }

    try {
      const vehicleAInsuranceBranchPhone = form.getField('vehicleA_insurance_branchPhone') as PDFTextField;
      if (vehicleAInsuranceBranchPhone instanceof PDFTextField && formData.vehicleA?.insurance?.branchPhone) {
        vehicleAInsuranceBranchPhone.setText(formData.vehicleA.insurance.branchPhone);
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_branchPhone not found:', error);
    }

    // Comprehensive insurance checkbox pair
    try {
      const comprehensiveInsuranceValue = formData.vehicleA?.insurance?.comprehensiveInsurance || '';
      
      if (comprehensiveInsuranceValue === 'yes') {
        const comprehensiveInsuranceYesField = form.getField('vehicleA_insurance_comprehensiveInsurance_yes');
        if (comprehensiveInsuranceYesField instanceof PDFCheckBox) {
          comprehensiveInsuranceYesField.check();
        }
      } else if (comprehensiveInsuranceValue === 'no') {
        const comprehensiveInsuranceNoField = form.getField('vehicleA_insurance_comprehensiveInsurance_no');
        if (comprehensiveInsuranceNoField instanceof PDFCheckBox) {
          comprehensiveInsuranceNoField.check();
        }
      }
    } catch (error) {
      console.warn('Field vehicleA_insurance_comprehensiveInsurance checkboxes not found:', error);
    }

    // Vehicle A - Driver
    try {
      const vehicleADriverSurname = form.getField('vehicleA_driver_surname') as PDFTextField;
      if (vehicleADriverSurname instanceof PDFTextField && formData.vehicleA?.driver?.surname) {
        vehicleADriverSurname.setText(formData.vehicleA.driver.surname);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_surname not found:', error);
    }

    try {
      const vehicleADriverFirstname = form.getField('vehicleA_driver_firstname') as PDFTextField;
      if (vehicleADriverFirstname instanceof PDFTextField && formData.vehicleA?.driver?.firstname) {
        vehicleADriverFirstname.setText(formData.vehicleA.driver.firstname);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_firstname not found:', error);
    }

    // Format date of birth (YYYY-MM-DD to DD. MMMM YYYY with localized full month)
    try {
      const vehicleADriverDateOfBirth = form.getField('vehicleA_driver_dateOfBirth') as PDFTextField;
      let dateOfBirthValue = formData.vehicleA?.driver?.dateOfBirth || '';
      
      if (dateOfBirthValue && dateOfBirthValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateOfBirthValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        dateOfBirthValue = `${day}. ${monthName} ${year}`;
      }
      
      if (dateOfBirthValue && vehicleADriverDateOfBirth instanceof PDFTextField) {
        vehicleADriverDateOfBirth.setText(dateOfBirthValue);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_dateOfBirth not found:', error);
    }

    try {
      const vehicleADriverAddress = form.getField('vehicleA_driver_address') as PDFTextField;
      if (vehicleADriverAddress instanceof PDFTextField && formData.vehicleA?.driver?.address) {
        vehicleADriverAddress.setText(formData.vehicleA.driver.address);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_address not found:', error);
    }

    try {
      const vehicleADriverCountry = form.getField('vehicleA_driver_country') as PDFTextField;
      if (vehicleADriverCountry instanceof PDFTextField && formData.vehicleA?.driver?.country) {
        vehicleADriverCountry.setText(formData.vehicleA.driver.country);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_country not found:', error);
    }

    try {
      const vehicleADriverPhone = form.getField('vehicleA_driver_phone') as PDFTextField;
      if (vehicleADriverPhone instanceof PDFTextField && formData.vehicleA?.driver?.phone) {
        vehicleADriverPhone.setText(formData.vehicleA.driver.phone);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_phone not found:', error);
    }

    try {
      const vehicleADriverLicenceNumber = form.getField('vehicleA_driver_licenceNumber') as PDFTextField;
      if (vehicleADriverLicenceNumber instanceof PDFTextField && formData.vehicleA?.driver?.licenceNumber) {
        vehicleADriverLicenceNumber.setText(formData.vehicleA.driver.licenceNumber);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_licenceNumber not found:', error);
    }

    try {
      const vehicleADriverLicenceCategory = form.getField('vehicleA_driver_licenceCategory') as PDFTextField;
      if (vehicleADriverLicenceCategory instanceof PDFTextField && formData.vehicleA?.driver?.licenceCategory) {
        vehicleADriverLicenceCategory.setText(formData.vehicleA.driver.licenceCategory);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_licenceCategory not found:', error);
    }

    // Format licence valid until (YYYY-MM-DD to DD. MMMM YYYY with localized full month)
    try {
      const vehicleADriverLicenceValidUntil = form.getField('vehicleA_driver_licenceValidUntil') as PDFTextField;
      let licenceValidUntilValue = formData.vehicleA?.driver?.licenceValidUntil || '';
      
      if (licenceValidUntilValue && licenceValidUntilValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = licenceValidUntilValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        licenceValidUntilValue = `${day}. ${monthName} ${year}`;
      }
      
      if (licenceValidUntilValue && vehicleADriverLicenceValidUntil instanceof PDFTextField) {
        vehicleADriverLicenceValidUntil.setText(licenceValidUntilValue);
      }
    } catch (error) {
      console.warn('Field vehicleA_driver_licenceValidUntil not found:', error);
    }

    // Vehicle A - Visible Damage
    try {
      const vehicleAVisibleDamage = form.getField('vehicleA_visibleDamage') as PDFTextField;
      if (vehicleAVisibleDamage instanceof PDFTextField && formData.vehicleA?.visibleDamage) {
        vehicleAVisibleDamage.setText(formData.vehicleA.visibleDamage);
      }
    } catch (error) {
      console.warn('Field vehicleA_visibleDamage not found:', error);
    }

    // Vehicle A - Additional Notes
    try {
      const vehicleAAdditionalNotes = form.getField('vehicleA_additionalNotes') as PDFTextField;
      if (vehicleAAdditionalNotes instanceof PDFTextField && formData.vehicleA?.additionalNotes) {
        vehicleAAdditionalNotes.setText(formData.vehicleA.additionalNotes);
      } else {
        // Field is empty, clear any default appearance
        if (vehicleAAdditionalNotes instanceof PDFTextField) {
          vehicleAAdditionalNotes.setText('');
        }
      }
    } catch (error) {
      console.warn('Field vehicleA_additionalNotes not found:', error);
    }

    // Vehicle A - Circumstances checkboxes
    const vehicleACircumstancesCheckboxes = [
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
    ];

    let vehicleACheckedCircumstances = {} as { [key: string]: boolean };

    for (let checkbox of vehicleACircumstancesCheckboxes) {
      try {
        const formDataFieldState = formData.vehicleA?.circumstances?.[checkbox as keyof typeof formData.vehicleA.circumstances];
        if (checkbox === 'parked') checkbox = 'stopped'; // "parked" is updating the same target
        const fieldName = `vehicleA_circumstances_${checkbox}`;
        const field = form.getField(fieldName);
        if (field instanceof PDFCheckBox) {
          if (formDataFieldState) {
            field.check();
            vehicleACheckedCircumstances[checkbox] = true;
          }
        }
      } catch (error) {
        console.warn(`Field vehicleA_circumstances_${checkbox} not found:`, error);
      }
    }

    // Set the number of selected circumstances
    try {
      const vehicleACircumstancesNum = form.getField('vehicleA_circumstances_numOfSelected') as PDFTextField;
      if (vehicleACircumstancesNum instanceof PDFTextField) {
        vehicleACircumstancesNum.setAlignment(1); // 1 = center alignment
        vehicleACircumstancesNum.setText(Object.keys(vehicleACheckedCircumstances).length.toString());
      }
    } catch (error) {
      console.warn('Field vehicleA_circumstances_numOfSelected not found:', error);
    }

    // ===== VEHICLE B FIELDS =====
    
    // Vehicle B - Policyholder
    try {
      const vehicleBPoliceholderSurname = form.getField('vehicleB_policyholder_surname') as PDFTextField;
      if (vehicleBPoliceholderSurname instanceof PDFTextField && formData.vehicleB?.policyholder?.surname) {
        vehicleBPoliceholderSurname.setText(formData.vehicleB.policyholder.surname);
      }
    } catch (error) {
      console.warn('Field vehicleB_policyholder_surname not found:', error);
    }

    try {
      const vehicleBPoliceholderFirstname = form.getField('vehicleB_policyholder_firstname') as PDFTextField;
      if (vehicleBPoliceholderFirstname instanceof PDFTextField && formData.vehicleB?.policyholder?.firstname) {
        vehicleBPoliceholderFirstname.setText(formData.vehicleB.policyholder.firstname);
      }
    } catch (error) {
      console.warn('Field vehicleB_policyholder_firstname not found:', error);
    }

    try {
      const vehicleBPoliceholderAddress = form.getField('vehicleB_policyholder_address') as PDFTextField;
      if (vehicleBPoliceholderAddress instanceof PDFTextField && formData.vehicleB?.policyholder?.address) {
        vehicleBPoliceholderAddress.setText(formData.vehicleB.policyholder.address);
      }
    } catch (error) {
      console.warn('Field vehicleB_policyholder_address not found:', error);
    }

    try {
      const vehicleBPoliceholderPostalCode = form.getField('vehicleB_policyholder_postalCode') as PDFTextField;
      if (vehicleBPoliceholderPostalCode instanceof PDFTextField && formData.vehicleB?.policyholder?.postalCode) {
        vehicleBPoliceholderPostalCode.setText(formData.vehicleB.policyholder.postalCode);
      }
    } catch (error) {
      console.warn('Field vehicleB_policyholder_postalCode not found:', error);
    }

    try {
      const vehicleBPoliceholderCountry = form.getField('vehicleB_policyholder_country') as PDFTextField;
      if (vehicleBPoliceholderCountry instanceof PDFTextField && formData.vehicleB?.policyholder?.country) {
        vehicleBPoliceholderCountry.setText(formData.vehicleB.policyholder.country);
      }
    } catch (error) {
      console.warn('Field vehicleB_policyholder_country not found:', error);
    }

    try {
      const vehicleBPoliceholderPhoneEmail = form.getField('vehicleB_policyholder_phoneEmail') as PDFTextField;
      if (vehicleBPoliceholderPhoneEmail instanceof PDFTextField && formData.vehicleB?.policyholder?.phoneEmail) {
        vehicleBPoliceholderPhoneEmail.setText(formData.vehicleB.policyholder.phoneEmail);
      }
    } catch (error) {
      console.warn('Field vehicleB_policyholder_phoneEmail not found:', error);
    }

    // Vehicle B - Vehicle/Trailer (conditional based on vehicleType)
    const vehicleBType = formData.vehicleB?.vehicle?.vehicleType || 'vehicle';
    const vehicleBFieldPrefix = `vehicleB_${vehicleBType}`;
    
    // For vehicles, there's a combined make_model field; for trailers, there might be separate fields
    if (vehicleBType === 'vehicle') {
      // Vehicle case: use combined make_model field
      try {
        const vehicleBMakeModel = form.getField('vehicleB_vehicle_make_model') as PDFTextField;
        if (vehicleBMakeModel instanceof PDFTextField && (formData.vehicleB?.vehicle?.make || formData.vehicleB?.vehicle?.model)) {
          const make = formData.vehicleB.vehicle.make || '';
          const model = formData.vehicleB.vehicle.model || '';
          const combinedValue = `${make}${make && model ? ', ' : ''}${model}`.trim();
          vehicleBMakeModel.setText(combinedValue);
        }
      } catch (error) {
        console.warn('Field vehicleB_vehicle_make_model not found:', error);
      }
    } else {
      // Trailer case: use separate make and model fields if they exist
      try {
        const vehicleBMake = form.getField(`${vehicleBFieldPrefix}_make`) as PDFTextField;
        if (vehicleBMake instanceof PDFTextField && formData.vehicleB?.vehicle?.make) {
          vehicleBMake.setText(formData.vehicleB.vehicle.make);
        }
      } catch (error) {
        console.warn(`Field ${vehicleBFieldPrefix}_make not found:`, error);
      }

      try {
        const vehicleBModel = form.getField(`${vehicleBFieldPrefix}_model`) as PDFTextField;
        if (vehicleBModel instanceof PDFTextField && formData.vehicleB?.vehicle?.model) {
          vehicleBModel.setText(formData.vehicleB.vehicle.model);
        }
      } catch (error) {
        console.warn(`Field ${vehicleBFieldPrefix}_model not found:`, error);
      }
    }

    try {
      const vehicleBRegistrationNumber = form.getField(`${vehicleBFieldPrefix}_registrationNumber`) as PDFTextField;
      if (vehicleBRegistrationNumber instanceof PDFTextField && formData.vehicleB?.vehicle?.registrationNumber) {
        vehicleBRegistrationNumber.setText(formData.vehicleB.vehicle.registrationNumber);
      }
    } catch (error) {
      console.warn(`Field ${vehicleBFieldPrefix}_registrationNumber not found:`, error);
    }

    try {
      const vehicleBCountryOfRegistration = form.getField(`${vehicleBFieldPrefix}_countryOfRegistration`) as PDFTextField;
      if (vehicleBCountryOfRegistration instanceof PDFTextField && formData.vehicleB?.vehicle?.countryOfRegistration) {
        vehicleBCountryOfRegistration.setText(formData.vehicleB.vehicle.countryOfRegistration);
      }
    } catch (error) {
      console.warn(`Field ${vehicleBFieldPrefix}_countryOfRegistration not found:`, error);
    }

    // Vehicle B - Insurance
    try {
      const vehicleBInsuranceCompanyName = form.getField('vehicleB_insurance_insuranceCompanyName') as PDFTextField;
      if (vehicleBInsuranceCompanyName instanceof PDFTextField && formData.vehicleB?.insurance?.insuranceCompanyName) {
        vehicleBInsuranceCompanyName.setText(formData.vehicleB.insurance.insuranceCompanyName);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_insuranceCompanyName not found:', error);
    }

    try {
      const vehicleBInsurancePolicyNumber = form.getField('vehicleB_insurance_policyNumber') as PDFTextField;
      if (vehicleBInsurancePolicyNumber instanceof PDFTextField && formData.vehicleB?.insurance?.policyNumber) {
        vehicleBInsurancePolicyNumber.setText(formData.vehicleB.insurance.policyNumber);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_policyNumber not found:', error);
    }

    try {
      const vehicleBInsuranceGreenCardNumber = form.getField('vehicleB_insurance_greenCardNumber') as PDFTextField;
      if (vehicleBInsuranceGreenCardNumber instanceof PDFTextField && formData.vehicleB?.insurance?.greenCardNumber) {
        vehicleBInsuranceGreenCardNumber.setText(formData.vehicleB.insurance.greenCardNumber);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_greenCardNumber not found:', error);
    }

    // Format green card dates (YYYY-MM-DD to DD. MMM YYYY with localized short month)
    try {
      const vehicleBInsuranceGreenCardValidFrom = form.getField('vehicleB_insurance_greenCardValidFrom') as PDFTextField;
      let greenCardValidFromValue = formData.vehicleB?.insurance?.greenCardValidFrom || '';
      
      if (greenCardValidFromValue && greenCardValidFromValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = greenCardValidFromValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        greenCardValidFromValue = `${day}. ${monthName} ${year}`;
      }
      
      if (greenCardValidFromValue && vehicleBInsuranceGreenCardValidFrom instanceof PDFTextField) {
        vehicleBInsuranceGreenCardValidFrom.setText(greenCardValidFromValue);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_greenCardValidFrom not found:', error);
    }

    try {
      const vehicleBInsuranceGreenCardValidTo = form.getField('vehicleB_insurance_greenCardValidTo') as PDFTextField;
      let greenCardValidToValue = formData.vehicleB?.insurance?.greenCardValidTo || '';
      
      if (greenCardValidToValue && greenCardValidToValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = greenCardValidToValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        greenCardValidToValue = `${day}. ${monthName} ${year}`;
      }
      
      if (greenCardValidToValue && vehicleBInsuranceGreenCardValidTo instanceof PDFTextField) {
        vehicleBInsuranceGreenCardValidTo.setText(greenCardValidToValue);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_greenCardValidTo not found:', error);
    }

    try {
      const vehicleBInsuranceBranch = form.getField('vehicleB_insurance_branch') as PDFTextField;
      if (vehicleBInsuranceBranch instanceof PDFTextField && formData.vehicleB?.insurance?.branch) {
        vehicleBInsuranceBranch.setText(formData.vehicleB.insurance.branch);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_branch not found:', error);
    }

    try {
      const vehicleBInsuranceBranchAddress = form.getField('vehicleB_insurance_branchAddress') as PDFTextField;
      if (vehicleBInsuranceBranchAddress instanceof PDFTextField && formData.vehicleB?.insurance?.branchAddress) {
        vehicleBInsuranceBranchAddress.setText(formData.vehicleB.insurance.branchAddress);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_branchAddress not found:', error);
    }

    try {
      const vehicleBInsuranceBranchCountry = form.getField('vehicleB_insurance_branchCountry') as PDFTextField;
      if (vehicleBInsuranceBranchCountry instanceof PDFTextField && formData.vehicleB?.insurance?.branchCountry) {
        vehicleBInsuranceBranchCountry.setText(formData.vehicleB.insurance.branchCountry);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_branchCountry not found:', error);
    }

    try {
      const vehicleBInsuranceBranchPhone = form.getField('vehicleB_insurance_branchPhone') as PDFTextField;
      if (vehicleBInsuranceBranchPhone instanceof PDFTextField && formData.vehicleB?.insurance?.branchPhone) {
        vehicleBInsuranceBranchPhone.setText(formData.vehicleB.insurance.branchPhone);
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_branchPhone not found:', error);
    }

    // Comprehensive insurance checkbox pair
    try {
      const comprehensiveInsuranceValue = formData.vehicleB?.insurance?.comprehensiveInsurance || '';
      
      if (comprehensiveInsuranceValue === 'yes') {
        const comprehensiveInsuranceYesField = form.getField('vehicleB_insurance_comprehensiveInsurance_yes');
        if (comprehensiveInsuranceYesField instanceof PDFCheckBox) {
          comprehensiveInsuranceYesField.check();
        }
      } else if (comprehensiveInsuranceValue === 'no') {
        const comprehensiveInsuranceNoField = form.getField('vehicleB_insurance_comprehensiveInsurance_no');
        if (comprehensiveInsuranceNoField instanceof PDFCheckBox) {
          comprehensiveInsuranceNoField.check();
        }
      }
    } catch (error) {
      console.warn('Field vehicleB_insurance_comprehensiveInsurance checkboxes not found:', error);
    }

    // Vehicle B - Driver
    try {
      const vehicleBDriverSurname = form.getField('vehicleB_driver_surname') as PDFTextField;
      if (vehicleBDriverSurname instanceof PDFTextField && formData.vehicleB?.driver?.surname) {
        vehicleBDriverSurname.setText(formData.vehicleB.driver.surname);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_surname not found:', error);
    }

    try {
      const vehicleBDriverFirstname = form.getField('vehicleB_driver_firstname') as PDFTextField;
      if (vehicleBDriverFirstname instanceof PDFTextField && formData.vehicleB?.driver?.firstname) {
        vehicleBDriverFirstname.setText(formData.vehicleB.driver.firstname);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_firstname not found:', error);
    }

    // Format date of birth (YYYY-MM-DD to DD. MMMM YYYY with localized full month)
    try {
      const vehicleBDriverDateOfBirth = form.getField('vehicleB_driver_dateOfBirth') as PDFTextField;
      let dateOfBirthValue = formData.vehicleB?.driver?.dateOfBirth || '';
      
      if (dateOfBirthValue && dateOfBirthValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateOfBirthValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        dateOfBirthValue = `${day}. ${monthName} ${year}`;
      }
      
      if (dateOfBirthValue && vehicleBDriverDateOfBirth instanceof PDFTextField) {
        vehicleBDriverDateOfBirth.setText(dateOfBirthValue);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_dateOfBirth not found:', error);
    }

    try {
      const vehicleBDriverAddress = form.getField('vehicleB_driver_address') as PDFTextField;
      if (vehicleBDriverAddress instanceof PDFTextField && formData.vehicleB?.driver?.address) {
        vehicleBDriverAddress.setText(formData.vehicleB.driver.address);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_address not found:', error);
    }

    try {
      const vehicleBDriverCountry = form.getField('vehicleB_driver_country') as PDFTextField;
      if (vehicleBDriverCountry instanceof PDFTextField && formData.vehicleB?.driver?.country) {
        vehicleBDriverCountry.setText(formData.vehicleB.driver.country);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_country not found:', error);
    }

    try {
      const vehicleBDriverPhone = form.getField('vehicleB_driver_phone') as PDFTextField;
      if (vehicleBDriverPhone instanceof PDFTextField && formData.vehicleB?.driver?.phone) {
        vehicleBDriverPhone.setText(formData.vehicleB.driver.phone);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_phone not found:', error);
    }

    try {
      const vehicleBDriverLicenceNumber = form.getField('vehicleB_driver_licenceNumber') as PDFTextField;
      if (vehicleBDriverLicenceNumber instanceof PDFTextField && formData.vehicleB?.driver?.licenceNumber) {
        vehicleBDriverLicenceNumber.setText(formData.vehicleB.driver.licenceNumber);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_licenceNumber not found:', error);
    }

    try {
      const vehicleBDriverLicenceCategory = form.getField('vehicleB_driver_licenceCategory') as PDFTextField;
      if (vehicleBDriverLicenceCategory instanceof PDFTextField && formData.vehicleB?.driver?.licenceCategory) {
        vehicleBDriverLicenceCategory.setText(formData.vehicleB.driver.licenceCategory);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_licenceCategory not found:', error);
    }

    // Format licence valid until (YYYY-MM-DD to DD. MMMM YYYY with localized full month)
    try {
      const vehicleBDriverLicenceValidUntil = form.getField('vehicleB_driver_licenceValidUntil') as PDFTextField;
      let licenceValidUntilValue = formData.vehicleB?.driver?.licenceValidUntil || '';
      
      if (licenceValidUntilValue && licenceValidUntilValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = licenceValidUntilValue.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const currentLocale = locales[language as keyof typeof locales] || locales.sk;
        const monthName = currentLocale.months.full[monthIndex] || month;
        licenceValidUntilValue = `${day}. ${monthName} ${year}`;
      }
      
      if (licenceValidUntilValue && vehicleBDriverLicenceValidUntil instanceof PDFTextField) {
        vehicleBDriverLicenceValidUntil.setText(licenceValidUntilValue);
      }
    } catch (error) {
      console.warn('Field vehicleB_driver_licenceValidUntil not found:', error);
    }

    // Vehicle B - Visible Damage
    try {
      const vehicleBVisibleDamage = form.getField('vehicleB_visibleDamage') as PDFTextField;
      if (vehicleBVisibleDamage instanceof PDFTextField && formData.vehicleB?.visibleDamage) {
        vehicleBVisibleDamage.setText(formData.vehicleB.visibleDamage);
      }
    } catch (error) {
      console.warn('Field vehicleB_visibleDamage not found:', error);
    }

    // Vehicle B - Additional Notes
    try {
      const vehicleBAdditionalNotes = form.getField('vehicleB_additionalNotes') as PDFTextField;
      if (vehicleBAdditionalNotes instanceof PDFTextField && formData.vehicleB?.additionalNotes) {
        vehicleBAdditionalNotes.setText(formData.vehicleB.additionalNotes);
      } else {
        // Field is empty, clear any default appearance
        if (vehicleBAdditionalNotes instanceof PDFTextField) {
          vehicleBAdditionalNotes.setText('');
        }
      }
    } catch (error) {
      console.warn('Field vehicleB_additionalNotes not found:', error);
    }

    // Vehicle B - Circumstances checkboxes
    const vehicleBCircumstancesCheckboxes = [
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
    ];

    let vehicleBCheckedCircumstances = {} as Record<string, boolean>;

    for (let checkbox of vehicleBCircumstancesCheckboxes) {
      try {
        const formDataFieldState = formData.vehicleB?.circumstances?.[checkbox as keyof typeof formData.vehicleB.circumstances];
        if (checkbox === 'parked') checkbox = 'stopped';
        const fieldName = `vehicleB_circumstances_${checkbox}`;
        const field = form.getField(fieldName);
        if (field instanceof PDFCheckBox) {
          if (formDataFieldState) {      
            field.check();
            vehicleBCheckedCircumstances[checkbox] = true;
          }
        }
      } catch (error) {
        console.warn(`Field vehicleB_circumstances_${checkbox} not found:`, error);
      }
      
    }

    // Set the number of selected circumstances
    try {
      const vehicleBCircumstancesNum = form.getField('vehicleB_circumstances_numOfSelected') as PDFTextField;
      if (vehicleBCircumstancesNum instanceof PDFTextField) {
        vehicleBCircumstancesNum.setAlignment(1); // 1 = center alignment
        vehicleBCircumstancesNum.setText(Object.keys(vehicleBCheckedCircumstances).length.toString());
      }
    } catch (error) {
      console.warn('Field vehicleB_circumstances_numOfSelected not found:', error);
    }

    // ===== STRIKE THROUGH FIELDS FOR PARKED AND STOPPED =====

    const vehicleAParked = formData.vehicleA?.circumstances?.parked;
    const vehicleAStopped = formData.vehicleA?.circumstances?.stopped;
    const vehicleBParked = formData.vehicleB?.circumstances?.parked;
    const vehicleBStopped = formData.vehicleB?.circumstances?.stopped;

    // Check if any vehicle has parked or stopped selected
    const anyParked = vehicleAParked || vehicleBParked;
    const anyStopped = vehicleAStopped || vehicleBStopped;
    const anyParkedOrStopped = anyParked || anyStopped;

    try {
      const parkedStrikeThroughField = form.getField('parked_strikeThrough') as PDFTextField;
      if (parkedStrikeThroughField instanceof PDFTextField) {
        // Default to dashes
        let parkedText = '--------';
        
        // If any parked is selected clear parked
        if (anyParked) {
          parkedText = '';
        }
        // If no parked or stopped selected at all, clear parked
        else if (!anyParkedOrStopped) {
          parkedText = '';
        }
        // Otherwise keep the dashes (only parked selected, or parked selected but not all have stopped)
        
        parkedStrikeThroughField.setText(parkedText);
      }
    } catch (error) {
      console.warn('Field parked_strikeThrough not found:', error);
    }

    try {
      const stoppedStrikeThroughField = form.getField('stopped_strikeThrough') as PDFTextField;
      if (stoppedStrikeThroughField instanceof PDFTextField) {
        // Default to dashes
        let stoppedText = '--------';
        
        // If any stopped is selected clear stopped
        if (anyStopped) {
          stoppedText = '';
        }
        // If no parked or stopped selected at all, clear stopped
        else if (!anyParkedOrStopped) {
          stoppedText = '';
        }
        // Otherwise keep the dashes (only stopped selected, or stopped selected but not all have parked)
        
        stoppedStrikeThroughField.setText(stoppedText);
      }
    } catch (error) {
      console.warn('Field stopped_strikeThrough not found:', error);
    }

    // ===== IMPACT MARKERS (Vehicle A and B) =====
    
    // Get the first page for embedding images
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      console.warn('No pages in PDF to embed images');
      throw new Error('PDF has no pages');
    }
    const firstPage = pages[0];
    
    // Helper function to embed impact marker image
    const embedImpactMarkerImage = async (vehicleLabel: string, imageData: string | undefined) => {
      if (!imageData) {
        return; // No image data to embed
      }

      try {
        // Extract base64 data from data URL if necessary
        let base64Data = imageData;
        if (base64Data.startsWith('data:image/png;base64,')) {
          base64Data = base64Data.replace('data:image/png;base64,', '');
        }

        // Embed the PNG image
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const embeddedImage = await pdfDoc.embedPng(imageBytes);

        // Image dimensions (you can adjust these values)
        const imageWidth = 93;
        const imageHeight = 70;

        // Position coordinates (x, y) - adjust these to match your PDF layout
        // IMPORTANT: In PDF coordinates, y=0 is at the BOTTOM, not the top
        let xPosition: number;
        let yPosition: number;

        if (vehicleLabel === 'vehicleA') {
          // vehicleA position - adjust these coordinates
          xPosition = 30;    // Distance from left edge
          yPosition = 140;   // Distance from bottom edge
        } else {
          // vehicleB position - adjust these coordinates
          xPosition = 472;   // Distance from left edge
          yPosition = 140;   // Distance from bottom edge
        }

        // Draw the image on the page
        firstPage.drawImage(embeddedImage, {
          x: xPosition,
          y: yPosition,
          width: imageWidth,
          height: imageHeight,
        });

        console.log(`Embedded impact marker image for ${vehicleLabel} at position (${xPosition}, ${yPosition})`);
      } catch (error) {
        console.warn(`Failed to embed impact marker image for ${vehicleLabel}:`, error);
      }
    };

    // Embed impact marker images for both vehicles
    // Retrieve images from IndexedDB storage instead of form data
    const vehicleAImage = await getImpactMarkerImage('vehicleA');
    if (vehicleAImage) {
      await embedImpactMarkerImage('vehicleA', vehicleAImage);
    }

    const vehicleBImage = await getImpactMarkerImage('vehicleB');
    if (vehicleBImage) {
      await embedImpactMarkerImage('vehicleB', vehicleBImage);
    }

    // Helper function to embed situation drawing image
    const embedSituationDrawingImage = async (imageData: string | undefined) => {
      if (!imageData) {
        return; // No image data to embed
      }

      try {
        // Extract base64 data from data URL if necessary
        let base64Data = imageData;
        if (base64Data.startsWith('data:image/png;base64,')) {
          base64Data = base64Data.substring('data:image/png;base64,'.length);
        }
        
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Embed the image in the PDF
        const embeddedImage = await pdfDoc.embedPng(bytes);
        
        // Situation drawing dimensions and position
        const situationWidth = 335.9;
        const situationHeight = 157;
        
        // Position for situation drawing (customize as needed)
        const xPosition = 129.5;
        const yPosition = 80;
        
        firstPage.drawImage(embeddedImage, {
          x: xPosition,
          y: yPosition,
          width: situationWidth,
          height: situationHeight,
        });

        console.log(`Embedded situation drawing image at position (${xPosition}, ${yPosition})`);
      } catch (error) {
        console.warn('Failed to embed situation drawing image:', error);
      }
    };

    // Embed situation drawing image
    if (formData.situationImage) {
      await embedSituationDrawingImage(formData.situationImage);
    }

    // Helper function to embed signature image
    const embedSignatureImage = async (signatureLabel: 'driverA' | 'driverB', imageData: string | undefined) => {
      if (!imageData) {
        return; // No image data to embed
      }

      try {
        // Extract base64 data from data URL if necessary
        let base64Data = imageData;
        if (base64Data.startsWith('data:image/png;base64,')) {
          base64Data = base64Data.substring('data:image/png;base64,'.length);
        }
        
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Embed the image in the PDF
        const embeddedImage = await pdfDoc.embedPng(bytes);
        
        // Signature dimensions and positions
        const signatureWidth = 80;
        const signatureHeight = 35;
        
        let xPosition: number;
        let yPosition: number;
        
        // Signature positions (customize as needed)
        if (signatureLabel === 'driverA') {
          xPosition = 215;
          yPosition = 23;
        } else {
          xPosition = 298;
          yPosition = 23;
        }
        
        firstPage.drawImage(embeddedImage, {
          x: xPosition,
          y: yPosition,
          width: signatureWidth,
          height: signatureHeight,
        });

        console.log(`Embedded signature image for ${signatureLabel} at position (${xPosition}, ${yPosition})`);
      } catch (error) {
        console.warn(`Failed to embed signature image for ${signatureLabel}:`, error);
      }
    };

    // Embed signature images for both drivers
    // Retrieve images from IndexedDB storage instead of form data
    const driverASignature = await getSignatureImage('driverA');
    if (driverASignature) {
      await embedSignatureImage('driverA', driverASignature);
    }

    const driverBSignature = await getSignatureImage('driverB');
    if (driverBSignature) {
      await embedSignatureImage('driverB', driverBSignature);
    }

    // Update field appearances with custom font (if loaded) to properly render Slovak characters
    if (fontForAppearances) {
      form.updateFieldAppearances(fontForAppearances);
    }

    // Flatten the form so that filled fields become part of the document content
    // This makes the PDF read-only and embeds all form data into the page
    form.flatten();

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    // Use type assertion to handle Uint8Array compatibility
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
