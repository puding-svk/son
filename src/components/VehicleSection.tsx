import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { VehicleModal } from './VehicleModal';
import { ImpactMarker, type ImpactArrow } from './ImpactMarker';
import { saveImpactMarkerImage } from '../utils/storage';
import './VehicleSection.css';

interface VehicleData {
  policyholder: {
    surname: string;
    firstname: string;
    address: string;
    postalCode: string;
    country: string;
    phoneEmail: string;
  };
  vehicle: {
    vehicleType: 'vehicle' | 'trailer';
    make: string;
    model: string;
    registrationNumber: string;
    countryOfRegistration: string;
  };
  insurance: {
    insuranceCompanyName: string;
    policyNumber: string;
    greenCardNumber: string;
    greenCardValidFrom: string;
    greenCardValidTo: string;
    branch: string;
    branchAddress: string;
    branchCountry: string;
    branchPhone: string;
    comprehensiveInsurance: string;
  };
  driver: {
    surname: string;
    firstname: string;
    dateOfBirth: string;
    address: string;
    country: string;
    phone: string;
    licenceNumber: string;
    licenceCategory: string;
    licenceValidUntil: string;
  };
  impactMarkers: ImpactArrow[];
  visibleDamage: string;
  circumstances: {
    parked: boolean;
    stopped: boolean;
    openedDoor: boolean;
    parking: boolean;
    leavingParkingArea: boolean;
    enteringParkingArea: boolean;
    enteringRoundabout: boolean;
    drivingRoundabout: boolean;
    rearEndCollision: boolean;
    drivingParallel: boolean;
    changingLanes: boolean;
    overtaking: boolean;
    turningRight: boolean;
    turningLeft: boolean;
    reversing: boolean;
    enteredOppositeLane: boolean;
    comingFromRight: boolean;
    failedToYield: boolean;
  };
  additionalNotes: string;
}

interface VehicleSectionProps {
  vehicleLabel: 'vehicleA' | 'vehicleB';
  data: VehicleData;
  onChange: (newData: VehicleData) => void;
}

const VehicleSection: React.FC<VehicleSectionProps> = ({ vehicleLabel, data, onChange }) => {
  const { t } = useTranslation();
  const [vehicleModal, setVehicleModal] = useState<{ isOpen: boolean; mode: 'save' | 'load' | 'qr' }>({
    isOpen: false,
    mode: 'save',
  });
  const [impactMarkers, setImpactMarkers] = useState<ImpactArrow[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vehicleHeader: false,
  });
  
  const vehicleRadioRef = useRef<HTMLInputElement>(null);
  const trailerRadioRef = useRef<HTMLInputElement>(null);
  
  // Initialize impact markers from data
  useEffect(() => {
    if (data.impactMarkers && data.impactMarkers.length > 0) {
      setImpactMarkers(data.impactMarkers);
    } else {
      setImpactMarkers([]);
    }
  }, [data.impactMarkers]);
  
  // Sync radio button checked state with data
  useEffect(() => {
    if (vehicleRadioRef.current) {
      const shouldCheck = data.vehicle.vehicleType === 'vehicle';
      if (vehicleRadioRef.current.checked !== shouldCheck) {
        vehicleRadioRef.current.checked = shouldCheck;
      }
    }
    if (trailerRadioRef.current) {
      const shouldCheck = data.vehicle.vehicleType === 'trailer';
      if (trailerRadioRef.current.checked !== shouldCheck) {
        trailerRadioRef.current.checked = shouldCheck;
      }
    }
  }, [data.vehicle.vehicleType]);
  
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className={`vehicle-section ${vehicleLabel === 'vehicleA' ? 'section-blue' : 'section-yellow'}`}>
      <div className="vehicle-section-header">
        <h3
          onClick={() => toggleSection('vehicleHeader')}
          style={{ cursor: 'pointer', userSelect: 'none', flex: 1 }}
        >
          <span>{expandedSections.vehicleHeader ? '▼' : '▶'}</span>
          {' '}
          {vehicleLabel === 'vehicleA' ? t('vehicle.titleA') : t('vehicle.titleB')}
        </h3>
        <button
          type="button"
          className="btn-load-top"
          onClick={() => setVehicleModal({ isOpen: true, mode: 'load' })}
        >
          {t('modal.loadVehicle') || 'Load'}
        </button>
      </div>

      {expandedSections.vehicleHeader && (
        <>
          {/* SECTION 6: POLICYHOLDER / INSURED PERSON */}
      <fieldset>
        <legend>{t('vehicle.section6')}</legend>

        <div className="form-group">
          <label>{t('vehicle.policyholderSurname')}</label>
          <input
            type="text"
            value={data.policyholder.surname}
            onChange={(e) => updateField('policyholder.surname', e.target.value)}
            placeholder={t('vehicle.surnamePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.policyholderFirstname')}</label>
          <input
            type="text"
            value={data.policyholder.firstname}
            onChange={(e) => updateField('policyholder.firstname', e.target.value)}
            placeholder={t('vehicle.firstnamePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.policyholderAddress')}</label>
          <input
            type="text"
            value={data.policyholder.address}
            onChange={(e) => updateField('policyholder.address', e.target.value)}
            placeholder={t('vehicle.addressPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.policyholderPostalCode')}</label>
          <input
            type="text"
            value={data.policyholder.postalCode}
            onChange={(e) => updateField('policyholder.postalCode', e.target.value)}
            placeholder={t('vehicle.postalCodePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.policyholderCountry')}</label>
          <input
            type="text"
            value={data.policyholder.country}
            onChange={(e) => updateField('policyholder.country', e.target.value)}
            placeholder={t('vehicle.countryPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.policyholderPhoneEmail')}</label>
          <input
            type="text"
            value={data.policyholder.phoneEmail}
            onChange={(e) => updateField('policyholder.phoneEmail', e.target.value)}
            placeholder={t('vehicle.phoneEmailPlaceholder')}
          />
        </div>
      </fieldset>

      {/* SECTION 7: VEHICLE TYPE */}
      <fieldset>
        <legend>{t('vehicle.section7')}</legend>

        <div className="form-group">
          <label className="question-label">{t('vehicle.vehicleType')}</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                ref={vehicleRadioRef}
                type="radio"
                name={`vehicleType-${vehicleLabel}`}
                value="vehicle"
                checked={data.vehicle.vehicleType === 'vehicle'}
                onChange={(e) => {
                  updateField('vehicle.vehicleType', e.target.value as 'vehicle' | 'trailer');
                }}
              />
              {t('vehicle.vehicle')}
            </label>
            <label className="radio-label">
              <input
                ref={trailerRadioRef}
                type="radio"
                name={`vehicleType-${vehicleLabel}`}
                value="trailer"
                checked={data.vehicle.vehicleType === 'trailer'}
                onChange={(e) => {
                  updateField('vehicle.vehicleType', e.target.value as 'vehicle' | 'trailer');
                }}
              />
              {t('vehicle.trailer')}
            </label>
          </div>
        </div>

        {/* Make and Model - only for Vehicle type */}
        {data.vehicle.vehicleType === 'vehicle' && (
          <>
            <div className="form-group">
              <label>{t('vehicle.make')}</label>
              <input
                type="text"
                value={data.vehicle.make}
                onChange={(e) => updateField('vehicle.make', e.target.value)}
                placeholder={t('vehicle.makePlaceholder')}
              />
            </div>

            <div className="form-group">
              <label>{t('vehicle.model')}</label>
              <input
                type="text"
                value={data.vehicle.model}
                onChange={(e) => updateField('vehicle.model', e.target.value)}
                placeholder={t('vehicle.modelPlaceholder')}
              />
            </div>
          </>
        )}

        {/* Registration Number and Country - for both */}
        <div className="form-group">
          <label>{t('vehicle.registrationNumber')}</label>
          <input
            type="text"
            value={data.vehicle.registrationNumber}
            onChange={(e) => updateField('vehicle.registrationNumber', e.target.value)}
            placeholder={t('vehicle.registrationNumberPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.countryOfRegistration')}</label>
          <input
            type="text"
            value={data.vehicle.countryOfRegistration}
            onChange={(e) => updateField('vehicle.countryOfRegistration', e.target.value)}
            placeholder={t('vehicle.countryOfRegistrationPlaceholder')}
          />
        </div>
      </fieldset>

      {/* SECTION 8: INSURANCE COMPANY */}
      <fieldset>
        <legend>{t('vehicle.section8')}</legend>

        <div className="form-group">
          <label>{t('vehicle.insuranceCompanyName')}</label>
          <input
            type="text"
            value={data.insurance.insuranceCompanyName}
            onChange={(e) => updateField('insurance.insuranceCompanyName', e.target.value)}
            placeholder={t('vehicle.insuranceCompanyNamePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.policyNumber')}</label>
          <input
            type="text"
            value={data.insurance.policyNumber}
            onChange={(e) => updateField('insurance.policyNumber', e.target.value)}
            placeholder={t('vehicle.policyNumberPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.greenCardNumber')}</label>
          <input
            type="text"
            value={data.insurance.greenCardNumber}
            onChange={(e) => updateField('insurance.greenCardNumber', e.target.value)}
            placeholder={t('vehicle.greenCardNumberPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.greenCardValidFrom')}</label>
          <input
            type="date"
            value={data.insurance.greenCardValidFrom}
            onChange={(e) => updateField('insurance.greenCardValidFrom', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.greenCardValidTo')}</label>
          <input
            type="date"
            value={data.insurance.greenCardValidTo}
            onChange={(e) => updateField('insurance.greenCardValidTo', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.branch')}</label>
          <input
            type="text"
            value={data.insurance.branch}
            onChange={(e) => updateField('insurance.branch', e.target.value)}
            placeholder={t('vehicle.branchPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.branchAddress')}</label>
          <input
            type="text"
            value={data.insurance.branchAddress}
            onChange={(e) => updateField('insurance.branchAddress', e.target.value)}
            placeholder={t('vehicle.branchAddressPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.branchCountry')}</label>
          <input
            type="text"
            value={data.insurance.branchCountry}
            onChange={(e) => updateField('insurance.branchCountry', e.target.value)}
            placeholder={t('vehicle.branchCountryPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.branchPhone')}</label>
          <input
            type="text"
            value={data.insurance.branchPhone}
            onChange={(e) => updateField('insurance.branchPhone', e.target.value)}
            placeholder={t('vehicle.branchPhonePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label className="question-label">{t('vehicle.comprehensiveInsurance')}</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="comprehensiveInsurance"
                value="yes"
                checked={data.insurance.comprehensiveInsurance === 'yes'}
                onChange={(e) => updateField('insurance.comprehensiveInsurance', e.target.value)}
              />
              {t('common.yes')}
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="comprehensiveInsurance"
                value="no"
                checked={data.insurance.comprehensiveInsurance === 'no'}
                onChange={(e) => updateField('insurance.comprehensiveInsurance', e.target.value)}
              />
              {t('common.no')}
            </label>
          </div>
        </div>
      </fieldset>

      {/* SECTION 9: DRIVER */}
      <fieldset>
        <legend>{t('vehicle.section9')}</legend>

        <div className="form-group">
          <label>{t('vehicle.surname')}</label>
          <input
            type="text"
            value={data.driver.surname}
            onChange={(e) => updateField('driver.surname', e.target.value)}
            placeholder={t('vehicle.surnamePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.firstname')}</label>
          <input
            type="text"
            value={data.driver.firstname}
            onChange={(e) => updateField('driver.firstname', e.target.value)}
            placeholder={t('vehicle.firstnamePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.dateOfBirth')}</label>
          <input
            type="date"
            value={data.driver.dateOfBirth}
            onChange={(e) => updateField('driver.dateOfBirth', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.address')}</label>
          <input
            type="text"
            value={data.driver.address}
            onChange={(e) => updateField('driver.address', e.target.value)}
            placeholder={t('vehicle.addressPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.country')}</label>
          <input
            type="text"
            value={data.driver.country}
            onChange={(e) => updateField('driver.country', e.target.value)}
            placeholder={t('vehicle.countryPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.phone')}</label>
          <input
            type="text"
            value={data.driver.phone}
            onChange={(e) => updateField('driver.phone', e.target.value)}
            placeholder={t('vehicle.phonePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.licenceNumber')}</label>
          <input
            type="text"
            value={data.driver.licenceNumber}
            onChange={(e) => updateField('driver.licenceNumber', e.target.value)}
            placeholder={t('vehicle.licenceNumberPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.licenceCategory')}</label>
          <input
            type="text"
            value={data.driver.licenceCategory}
            onChange={(e) => updateField('driver.licenceCategory', e.target.value)}
            placeholder={t('vehicle.licenceCategoryPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('vehicle.licenceValidUntil')}</label>
          <input
            type="date"
            value={data.driver.licenceValidUntil}
            onChange={(e) => updateField('driver.licenceValidUntil', e.target.value)}
          />
        </div>
      </fieldset>

      {/* SECTION 10: VEHICLE CIRCUMSTANCES */}
      <fieldset>
        <legend>{t('vehicle.section10')}</legend>
        <ImpactMarker
          arrows={impactMarkers}
          onArrowsChange={(newArrows, imageData) => {
            setImpactMarkers(newArrows);
            updateField('impactMarkers', newArrows);
            // Save impact marker image to IndexedDB instead of form data
            if (imageData) {
              saveImpactMarkerImage(vehicleLabel, imageData).catch(error => 
                console.error('Failed to save impact marker image:', error)
              );
            }
          }}
        />
      </fieldset>

      {/* SECTION 11: VISIBLE DAMAGE TO VEHICLE */}
      <fieldset>
        <legend>{t('vehicle.section11')}</legend>

        <div className="form-group">
          <label>{t('vehicle.visibleDamage')}</label>
          <textarea
            value={data.visibleDamage}
            onChange={(e) => updateField('visibleDamage', e.target.value)}
            rows={4}
            placeholder={t('vehicle.visibleDamagePlaceholder')}
          />
        </div>
      </fieldset>

      {/* SECTION 12: VEHICLE CIRCUMSTANCES */}
      <fieldset>
        <legend>{t('vehicle.section12')}</legend>

        <div className="circumstances-info">
          <p>{t('vehicle.circumstancesInfo')}</p>
        </div>

        <div className="circumstances-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.parked}
              onChange={(e) => {
                const newData = JSON.parse(JSON.stringify(data));
                if (e.target.checked) {
                  // If checking parked, uncheck stopped
                  newData.circumstances.parked = true;
                  newData.circumstances.stopped = false;
                } else {
                  // If unchecking parked, just uncheck it
                  newData.circumstances.parked = false;
                }
                onChange(newData);
              }}
            />
            {t('vehicle.parked')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.stopped}
              onChange={(e) => {
                const newData = JSON.parse(JSON.stringify(data));
                if (e.target.checked) {
                  // If checking stopped, uncheck parked
                  newData.circumstances.stopped = true;
                  newData.circumstances.parked = false;
                } else {
                  // If unchecking stopped, just uncheck it
                  newData.circumstances.stopped = false;
                }
                onChange(newData);
              }}
            />
            {t('vehicle.stopped')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.openedDoor}
              onChange={(e) => updateField('circumstances.openedDoor', e.target.checked)}
            />
            {t('vehicle.openedDoor')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.parking}
              onChange={(e) => updateField('circumstances.parking', e.target.checked)}
            />
            {t('vehicle.parking')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.leavingParkingArea}
              onChange={(e) => updateField('circumstances.leavingParkingArea', e.target.checked)}
            />
            {t('vehicle.leavingParkingArea')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.enteringParkingArea}
              onChange={(e) => updateField('circumstances.enteringParkingArea', e.target.checked)}
            />
            {t('vehicle.enteringParkingArea')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.enteringRoundabout}
              onChange={(e) => updateField('circumstances.enteringRoundabout', e.target.checked)}
            />
            {t('vehicle.enteringRoundabout')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.drivingRoundabout}
              onChange={(e) => updateField('circumstances.drivingRoundabout', e.target.checked)}
            />
            {t('vehicle.drivingRoundabout')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.rearEndCollision}
              onChange={(e) => updateField('circumstances.rearEndCollision', e.target.checked)}
            />
            {t('vehicle.rearEndCollision')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.drivingParallel}
              onChange={(e) => updateField('circumstances.drivingParallel', e.target.checked)}
            />
            {t('vehicle.drivingParallel')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.changingLanes}
              onChange={(e) => updateField('circumstances.changingLanes', e.target.checked)}
            />
            {t('vehicle.changingLanes')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.overtaking}
              onChange={(e) => updateField('circumstances.overtaking', e.target.checked)}
            />
            {t('vehicle.overtaking')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.turningRight}
              onChange={(e) => updateField('circumstances.turningRight', e.target.checked)}
            />
            {t('vehicle.turningRight')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.turningLeft}
              onChange={(e) => updateField('circumstances.turningLeft', e.target.checked)}
            />
            {t('vehicle.turningLeft')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.reversing}
              onChange={(e) => updateField('circumstances.reversing', e.target.checked)}
            />
            {t('vehicle.reversing')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.enteredOppositeLane}
              onChange={(e) => updateField('circumstances.enteredOppositeLane', e.target.checked)}
            />
            {t('vehicle.enteredOppositeLane')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.comingFromRight}
              onChange={(e) => updateField('circumstances.comingFromRight', e.target.checked)}
            />
            {t('vehicle.comingFromRight')}
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.circumstances.failedToYield}
              onChange={(e) => updateField('circumstances.failedToYield', e.target.checked)}
            />
            {t('vehicle.failedToYield')}
          </label>
        </div>

        <div className="circumstances-count">
          {t('vehicle.circumstancesSelected')}: <strong>{
            Object.values(data.circumstances).filter(Boolean).length
          }</strong>
        </div>
      </fieldset>

      {/* SECTION 14: ADDITIONAL NOTES */}
      <fieldset>
        <legend>{t('vehicle.section14')}</legend>

        <div className="form-group">
          <label>{t('vehicle.additionalNotes')}</label>
          <textarea
            value={data.additionalNotes}
            onChange={(e) => updateField('additionalNotes', e.target.value)}
            rows={4}
            placeholder={t('vehicle.additionalNotesPlaceholder')}
          />
        </div>
      </fieldset>

      {/* Vehicle Control Buttons */}
      <div className="vehicle-controls">
        <button
          type="button"
          className="btn-vehicle btn-save"
          onClick={() => setVehicleModal({ isOpen: true, mode: 'save' })}
        >
          {t('common.save')}
        </button>
        <button
          type="button"
          className="btn-vehicle btn-load"
          onClick={() => setVehicleModal({ isOpen: true, mode: 'load' })}
        >
          {t('common.load')}
        </button>
        <button
          type="button"
          className="btn-vehicle btn-qr"
          onClick={() => setVehicleModal({ isOpen: true, mode: 'qr' })}
        >
          {t('vehicle.generateQR') || 'Generate QR'}
        </button>
      </div>

      <VehicleModal
        isOpen={vehicleModal.isOpen}
        mode={vehicleModal.mode !== 'qr' ? vehicleModal.mode : 'save'}
        vehicleLabel={vehicleLabel}
        vehicleData={data}
        onLoadData={onChange}
        onClose={() => setVehicleModal({ ...vehicleModal, isOpen: false })}
        initialMode={vehicleModal.mode === 'qr' ? 'qr' : undefined}
      />
        </>
      )}
    </div>
  );
};

export default VehicleSection;
