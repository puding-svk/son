import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { i18n } from '../i18n/config';
import VehicleSection from './VehicleSection';
import QRModal from './QRModal';
import { SignaturePad } from './SignaturePad';
import { SituationDraw } from './SituationDraw';
import { exportToPDFWithTemplate } from '../utils/pdfLibExport';
import type { AccidentReport } from '../utils/storage';
import './AccidentForm.css';

// Utility function to get default circumstances object
const getDefaultCircumstances = () => ({
  parked: false,
  stopped: false,
  openedDoor: false,
  parking: false,
  leavingParkingArea: false,
  enteringParkingArea: false,
  enteringRoundabout: false,
  drivingRoundabout: false,
  rearEndCollision: false,
  drivingParallel: false,
  changingLanes: false,
  overtaking: false,
  turningRight: false,
  turningLeft: false,
  reversing: false,
  enteredOppositeLane: false,
  comingFromRight: false,
  failedToYield: false,
});

// Utility function to get default date (current date in YYYY-MM-DD format)
const getDefaultDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function to get default time (current time rounded down to nearest 15min, minus 15min, in HH:MM format)
const getDefaultTime = (): string => {
  const now = new Date();
  let minutes = now.getMinutes();
  
  // Round down to nearest 15 minutes
  minutes = Math.floor(minutes / 15) * 15;
  
  // Subtract 15 minutes
  minutes -= 15;
  
  // Handle negative minutes (go to previous hour)
  if (minutes < 0) {
    minutes += 60;
    now.setHours(now.getHours() - 1);
  }
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  return `${hours}:${minutesStr}`;
};

interface FormState extends AccidentReport {
  section1: {
    dateOfAccident: string;
    timeOfAccident: string;
    state: string;
    city: string;
    location: string;
  };
  section2: {
    injuries: string; // 'yes' | 'no' | ''
    damageOtherVehicles: string; // 'yes' | 'no' | ''
    damageOtherItems: string; // 'yes' | 'no' | ''
    witnesses: string;
  };
}

const initialState: FormState = {
  section1: {
    dateOfAccident: getDefaultDate(),
    timeOfAccident: getDefaultTime(),
    state: '',
    city: '',
    location: '',
  },
  section2: {
    injuries: '',
    damageOtherVehicles: '',
    damageOtherItems: '',
    witnesses: '',
  },
  vehicleA: {
    policyholder: {
      surname: '',
      firstname: '',
      address: '',
      postalCode: '',
      country: '',
      phoneEmail: '',
    },
    vehicle: {
      vehicleType: 'vehicle',
      make: '',
      model: '',
      registrationNumber: '',
      countryOfRegistration: '',
    },
    insurance: {
      insuranceCompanyName: '',
      policyNumber: '',
      greenCardNumber: '',
      greenCardValidFrom: '',
      greenCardValidTo: '',
      branch: '',
      branchAddress: '',
      branchCountry: '',
      branchPhone: '',
      comprehensiveInsurance: '',
    },
    driver: {
      surname: '',
      firstname: '',
      dateOfBirth: '',
      address: '',
      country: '',
      phone: '',
      licenceNumber: '',
      licenceCategory: '',
      licenceValidUntil: '',
    },
    impactMarkers: [],
    visibleDamage: '',
    circumstances: getDefaultCircumstances(),
    additionalNotes: '',
  },
  vehicleB: {
    policyholder: {
      surname: '',
      firstname: '',
      address: '',
      postalCode: '',
      country: '',
      phoneEmail: '',
    },
    vehicle: {
      vehicleType: 'vehicle',
      make: '',
      model: '',
      registrationNumber: '',
      countryOfRegistration: '',
    },
    insurance: {
      insuranceCompanyName: '',
      policyNumber: '',
      greenCardNumber: '',
      greenCardValidFrom: '',
      greenCardValidTo: '',
      branch: '',
      branchAddress: '',
      branchCountry: '',
      branchPhone: '',
      comprehensiveInsurance: '',
    },
    driver: {
      surname: '',
      firstname: '',
      dateOfBirth: '',
      address: '',
      country: '',
      phone: '',
      licenceNumber: '',
      licenceCategory: '',
      licenceValidUntil: '',
    },
    impactMarkers: [],
    visibleDamage: '',
    circumstances: getDefaultCircumstances(),
    additionalNotes: '',
  },
  signatures: {
    driverA: '',
    driverB: '',
  },
  situationImage: '',
  createdAt: '',
};

const AccidentForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormState>(initialState);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; mode: 'generate' | 'scan' }>({
    isOpen: false,
    mode: 'generate',
  });
  const [savedMessage, setSavedMessage] = useState('');
  const [signaturePadOpen, setSignaturePadOpen] = useState<'A' | 'B' | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    section1: false,
    section2: false,
    situation: false,
    signatures: false,
  });

  // Auto-load form data from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('accidentFormDraft');
    if (savedDraft) {
      try {
        const loadedData = JSON.parse(savedDraft) as FormState;
        // Ensure both vehicles have circumstances object
        const vehicleA = {
          ...loadedData.vehicleA,
          circumstances: loadedData.vehicleA?.circumstances || getDefaultCircumstances(),
        };
        const vehicleB = {
          ...loadedData.vehicleB,
          circumstances: loadedData.vehicleB?.circumstances || getDefaultCircumstances(),
        };
        setFormData({
          ...loadedData,
          vehicleA,
          vehicleB,
        });
        console.log('Form data loaded from localStorage');
      } catch (error) {
        console.error('Failed to load form data from localStorage:', error);
        // If parsing fails, keep the initial state
      }
    }
  }, []); // Empty dependency array - run only on mount

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is now online');
    };
    const handleOffline = () => {
      console.log('App is now offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Log initial status
    if (!navigator.onLine) {
      console.log('App started in offline mode');
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(formData));
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setFormData(newData);

    // Auto-save to localStorage
    localStorage.setItem('accidentFormDraft', JSON.stringify(newData));
  };

  const handleLoadQR = (report: AccidentReport) => {
    // Ensure both vehicles have circumstances object
    const vehicleA = {
      ...report.vehicleA,
      circumstances: report.vehicleA.circumstances || getDefaultCircumstances(),
    };
    const vehicleB = {
      ...report.vehicleB,
      circumstances: report.vehicleB.circumstances || getDefaultCircumstances(),
    };

    setFormData({
      ...report,
      vehicleA,
      vehicleB,
      createdAt: new Date().toISOString(),
    });
    setSavedMessage(t('form.load') + ' successful!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleClearForm = () => {
    const confirmed = window.confirm(
      t('message.clearFormConfirm') || 'Are you sure you want to clear the form? This cannot be undone.'
    );
    if (confirmed) {
      // Reset form to initial state
      setFormData(initialState);
      // Clear localStorage
      localStorage.removeItem('accidentFormDraft');
      // Collapse all sections
      setExpandedSections({
        section1: false,
        section2: false,
        situation: false,
        signatures: false,
      });
      console.log('Form data cleared');
    }
  };

  const handleSignatureSave = (signatureData: string) => {
    if (signaturePadOpen === 'A') {
      // Update form state so signature is visible in the preview
      // Stored in localStorage via updateField
      updateField('signatures.driverA', signatureData);
    } else if (signaturePadOpen === 'B') {
      // Update form state so signature is visible in the preview
      // Stored in localStorage via updateField
      updateField('signatures.driverB', signatureData);
    }
    setSignaturePadOpen(null);
  };

  return (
    <div className="accident-form-container">
      <header className="form-header">
        <h1>{t('app.title')}</h1>
        <div className="header-controls">
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-select"
          >
            <option value="sk">Slovenčina</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      {savedMessage && <div className="success-message">{savedMessage}</div>}

      <form className="form-content">
        {/* Section 1: Accident Date and Location */}
        <section className="form-section section-neutral">
          <h2
            onClick={() => toggleSection('section1')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span>{expandedSections.section1 ? '▼' : '▶'}</span>
            {' '}
            {t('section1.title')}
          </h2>
          {expandedSections.section1 && (
            <>
              <div className="form-group">
                <label>{t('section1.dateOfAccident')}</label>
                <input
                  type="date"
                  value={formData.section1.dateOfAccident}
                  onChange={(e) => updateField('section1.dateOfAccident', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{t('section1.timeOfAccident')}</label>
                <input
                  type="time"
                  value={formData.section1.timeOfAccident}
                  onChange={(e) => updateField('section1.timeOfAccident', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{t('section1.state')}</label>
                <input
                  type="text"
                  value={formData.section1.state}
                  onChange={(e) => updateField('section1.state', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{t('section1.city')}</label>
                <input
                  type="text"
                  maxLength={40}
                  value={formData.section1.city}
                  onChange={(e) => updateField('section1.city', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{t('section1.location')}</label>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.section1.location}
                  onChange={(e) => updateField('section1.location', e.target.value)}
                />
              </div>
            </>
          )}
        </section>

        {/* Section 2: Accident Information */}
        <section className="form-section section-neutral">
          <h2
            onClick={() => toggleSection('section2')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span>{expandedSections.section2 ? '▼' : '▶'}</span>
            {' '}
            {t('section2.title')}
          </h2>
          {expandedSections.section2 && (
            <>
              <div className="form-group">
                <label className="question-label">{t('section2.injuries')}</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="injuries"
                      value="yes"
                      checked={formData.section2.injuries === 'yes'}
                      onChange={(e) => updateField('section2.injuries', e.target.value)}
                    />
                    {t('common.yes')}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="injuries"
                      value="no"
                      checked={formData.section2.injuries === 'no'}
                      onChange={(e) => updateField('section2.injuries', e.target.value)}
                    />
                    {t('common.no')}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="question-label">{t('section2.damageOtherVehicles')}</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="damageOtherVehicles"
                      value="yes"
                      checked={formData.section2.damageOtherVehicles === 'yes'}
                      onChange={(e) => updateField('section2.damageOtherVehicles', e.target.value)}
                    />
                    {t('common.yes')}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="damageOtherVehicles"
                      value="no"
                      checked={formData.section2.damageOtherVehicles === 'no'}
                      onChange={(e) => updateField('section2.damageOtherVehicles', e.target.value)}
                    />
                    {t('common.no')}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="question-label">{t('section2.damageOtherItems')}</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="damageOtherItems"
                      value="yes"
                      checked={formData.section2.damageOtherItems === 'yes'}
                      onChange={(e) => updateField('section2.damageOtherItems', e.target.value)}
                    />
                    {t('common.yes')}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="damageOtherItems"
                      value="no"
                      checked={formData.section2.damageOtherItems === 'no'}
                      onChange={(e) => updateField('section2.damageOtherItems', e.target.value)}
                    />
                    {t('common.no')}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>{t('section2.witnesses')}</label>
                <textarea
                  value={formData.section2.witnesses}
                  onChange={(e) => updateField('section2.witnesses', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </section>

        {/* Vehicle A Section */}
        <VehicleSection
          vehicleLabel="vehicleA"
          data={formData.vehicleA}
          onChange={(newData) => setFormData({ ...formData, vehicleA: newData })}
        />

        {/* Vehicle B Section */}
        <VehicleSection
          vehicleLabel="vehicleB"
          data={formData.vehicleB}
          onChange={(newData) => setFormData({ ...formData, vehicleB: newData })}
        />

        {/* Situation Drawing Section */}
        <section className="form-section section-neutral">
          <h2
            onClick={() => toggleSection('situation')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span>{expandedSections.situation ? '▼' : '▶'}</span>
            {' '}
            {t('situation.title') || 'Accident Situation (Bird\'s Eye View)'}
          </h2>
          {expandedSections.situation && (
            <SituationDraw
              situationImage={formData.situationImage}
              onSituationChange={(imageData) =>
                setFormData({ ...formData, situationImage: imageData })
              }
            />
          )}
        </section>

        {/* Signatures Section */}
        <section className="form-section section-neutral signatures-section">
          <h2
            onClick={() => toggleSection('signatures')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span>{expandedSections.signatures ? '▼' : '▶'}</span>
            {' '}
            {t('section.signatures') || 'Signatures'}
          </h2>
          {expandedSections.signatures && (
            <div className="signatures-container">
            {/* Driver A Signature */}
            <div className="signature-block signature-blue">
              <div className="signature-label">
                <h3>{t('signature.driverA') || 'Driver A'}</h3>
                <p className="signature-sublabel">{formData.vehicleA.driver.firstname} {formData.vehicleA.driver.surname}</p>
              </div>
              <div className="signature-canvas-wrapper">
                {formData.signatures.driverA ? (
                  <div className="signature-display">
                    <img src={formData.signatures.driverA} alt="Driver A Signature" className="signature-image" />
                    <button
                      className="signature-edit-btn"
                      onClick={() => setSignaturePadOpen('A')}
                      type="button"
                    >
                      ✏️ {t('common.edit') || 'Edit'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div 
                      className="signature-placeholder"
                      onClick={() => setSignaturePadOpen('A')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSignaturePadOpen('A');
                        }
                      }}
                    ></div>
                    <p className="signature-instruction">{t('signature.sign') || 'Sign here'}</p>
                  </>
                )}
              </div>
            </div>

            {/* Driver B Signature */}
            <div className="signature-block signature-yellow">
              <div className="signature-label">
                <h3>{t('signature.driverB') || 'Driver B'}</h3>
                <p className="signature-sublabel">{formData.vehicleB.driver.firstname} {formData.vehicleB.driver.surname}</p>
              </div>
              <div className="signature-canvas-wrapper">
                {formData.signatures.driverB ? (
                  <div className="signature-display">
                    <img src={formData.signatures.driverB} alt="Driver B Signature" className="signature-image" />
                    <button
                      className="signature-edit-btn"
                      onClick={() => setSignaturePadOpen('B')}
                      type="button"
                    >
                      ✏️ {t('common.edit') || 'Edit'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div 
                      className="signature-placeholder"
                      onClick={() => setSignaturePadOpen('B')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSignaturePadOpen('B');
                        }
                      }}
                    ></div>
                    <p className="signature-instruction">{t('signature.sign') || 'Sign here'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          )}
        </section>
      </form>

      {/* Form Controls */}
      <div className="form-controls">
        <button
          className="btn-primary"
          type="button"
          onClick={async () => {
            try {
              const fileName = `accident_report_${new Date().toISOString().split('T')[0]}.pdf`;
              await exportToPDFWithTemplate(fileName, formData, i18n.language);
            } catch (error) {
              console.error('PDF export failed:', error);
              alert(t('message.exportError') || 'Failed to export PDF');
            }
          }}
        >
          {t('common.generatePDF') || 'Generate PDF'}
        </button>
        <button
          className="btn-secondary btn-danger"
          type="button"
          onClick={handleClearForm}
          title={t('common.clearForm') || 'Clear Form'}
        >
          {t('common.clearForm') || 'Clear Form'}
        </button>
      </div>

      <QRModal
        isOpen={qrModal.isOpen}
        mode={qrModal.mode}
        report={formData}
        onLoadData={handleLoadQR}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
      />

      {signaturePadOpen && (
        <SignaturePad
          driverLabel={signaturePadOpen}
          driverName={
            signaturePadOpen === 'A'
              ? `${formData.vehicleA.driver.firstname} ${formData.vehicleA.driver.surname}`
              : `${formData.vehicleB.driver.firstname} ${formData.vehicleB.driver.surname}`
          }
          onClose={() => setSignaturePadOpen(null)}
          onSave={handleSignatureSave}
        />
      )}
    </div>
  );
};

export default AccidentForm;
