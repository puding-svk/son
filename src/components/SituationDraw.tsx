import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SituationDrawModal } from './SituationDrawModal';
import './SituationDraw.css';

interface SituationDrawProps {
  situationImage: string; // base64 PNG data URL or JSON drawing data
  onSituationChange: (imageData: string) => void;
}

export const SituationDraw: React.FC<SituationDrawProps> = ({
  situationImage,
  onSituationChange,
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialDrawingData, setInitialDrawingData] = useState<string>('');

  const handleEdit = () => {
    // Parse drawing data if stored as JSON
    if (situationImage && situationImage.startsWith('{')) {
      try {
        setInitialDrawingData(situationImage);
      } catch {
        setInitialDrawingData('');
      }
    }
    setIsModalOpen(true);
  };

  const handleSave = (drawingData: string) => {
    onSituationChange(drawingData);
    setIsModalOpen(false);
  };

  const handleCanvasClick = () => {
    // Click on the display canvas to enter edit mode
    handleEdit();
  };

  // Get display image - if it's JSON data, extract finalImage, otherwise use the PNG directly
  const getDisplayImage = () => {
    if (situationImage && situationImage.startsWith('{')) {
      try {
        const data = JSON.parse(situationImage);
        return data.finalImage || '';
      } catch {
        return situationImage;
      }
    }
    return situationImage;
  };

  const displayImage = getDisplayImage();;

  return (
    <>
      <div className="situation-draw-content">
        <div className="situation-draw-display">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Accident situation"
              className="situation-draw-image"
              onClick={handleCanvasClick}
            />
          ) : (
            <div
              className="situation-draw-placeholder"
              onClick={handleCanvasClick}
            >
              <p>{t('situation.drawing') || 'Click to draw accident situation'}</p>
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
          initialImage={displayImage}
          initialDrawingData={initialDrawingData}
        />
      )}
    </>
  );
};
