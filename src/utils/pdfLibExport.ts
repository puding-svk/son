import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import skLocale from '../locales/sk.json';
import enLocale from '../locales/en.json';

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
    const templatePath = import.meta.env.BASE_URL + '_misc_files/sprava_o_nehode_temp5.pdf';
    const templateResponse = await fetch(templatePath);
    
    if (!templateResponse.ok) {
      throw new Error(`Failed to load PDF template: ${templateResponse.statusText}`);
    }

    const templateBuffer = await templateResponse.arrayBuffer();
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBuffer);
    const form = pdfDoc.getForm();

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
        
        // Try full month name first
        let monthName = currentLocale.months.full[monthIndex] || month;
        let formattedDate = `${day}. ${monthName} ${year}`;
        
        // If formatted date is too long, fall back to short month name
        if (formattedDate.length > 18) {
          monthName = currentLocale.months.short[monthIndex] || month;
          formattedDate = `${day}. ${monthName} ${year}`;
        }
        
        dateValue = formattedDate;
      }
      
      if (dateValue && dateOfAccidentField instanceof PDFTextField) {
        // Set font size to 80% of default (assuming default is 12pt, so 9.6pt)
        dateOfAccidentField.setFontSize(9.6);
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
        // Set same formatting as date field
        timeOfAccidentField.setFontSize(9.6);
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
        locationField.setFontSize(9.6);
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
        cityField.setFontSize(9.6);
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
        stateField.setFontSize(9.6);
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
        witnessesField.setFontSize(9.6);
        witnessesField.setText(witnessesValue);
      }
    } catch (error) {
      console.warn('Field section2_witnesses not found in PDF template:', error);
    }

    // Flatten the form so fields become immutable in the final PDF
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
