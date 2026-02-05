import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SituationDrawModal } from './SituationDrawModal';
import './SituationDraw.css';

interface SituationDrawProps {
  situationImage: string; // base64 PNG data URL
  onSituationChange: (imageData: string) => void;
}

export const SituationDraw: React.FC<SituationDrawProps> = ({
  situationImage,
  onSituationChange,
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSave = (imageData: string) => {
    onSituationChange(imageData);
    setIsModalOpen(false);
  };

  const handleCanvasClick = () => {
    // Click on the display canvas to enter edit mode
    handleEdit();
  };

  return (
    <>
      <div className="situation-draw-container">
        <div className="situation-draw-header">
          <h3>{t('situation.title') || 'Accident Situation (Bird\'s Eye View)'}</h3>
        </div>

        <div className="situation-draw-display">
          {situationImage ? (
            <img
              src={situationImage}
              alt="Accident situation"
              className="situation-draw-image"
              onClick={handleCanvasClick}
            />
          ) : (
            <div
              className="situation-draw-placeholder"
              onClick={handleCanvasClick}
            >
              <p>{t('situation.placeholder') || 'Click to draw accident situation'}</p>
            </div>
          )}
        </div>

        <div className="situation-draw-controls">
          <button
            className="btn-edit"
            onClick={handleEdit}
            type="button"
          >
            {t('situation.edit') || 'Edit'}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <SituationDrawModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialImage={situationImage}
        />
      )}
    </>
  );
};
