import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SituationDrawModal.css';

interface SituationDrawModalProps {
  onClose: () => void;
  onSave: (imageData: string) => void;
  initialImage?: string;
}

type ControlsPosition = 'left' | 'bottom';

export const SituationDrawModal: React.FC<SituationDrawModalProps> = ({
  onClose,
  onSave,
  initialImage,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [controlsPosition, setControlsPosition] = useState<ControlsPosition>('bottom');

  // Drawing canvas dimensions: 32:15 ratio (landscape)
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 300; // 640 * 15 / 32 = 300

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // If there's an initial image, load it
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialImage;
    }
  }, []);

  // Determine controls position based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const availableWidth = window.innerWidth - rect.left - 60; // 60px buffer
      const availableHeight = window.innerHeight - rect.top - 80; // 80px buffer for padding/buttons

      // If there's more horizontal space than vertical, place controls on the left
      // Otherwise, place them below
      if (availableWidth > availableHeight && availableWidth > 400) {
        setControlsPosition('left');
      } else {
        setControlsPosition('bottom');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    onSave(imageData);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };

  return (
    <div className="situation-draw-modal-overlay">
      <div
        ref={containerRef}
        className={`situation-draw-modal situation-draw-modal-${controlsPosition}`}
      >
        <div className="situation-draw-modal-content">
          <div className="situation-draw-canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="situation-draw-canvas"
              style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
              }}
            />
          </div>

          <div className="situation-draw-controls-panel">
            <h3>{t('situation.controls') || 'Controls'}</h3>

            {/* Placeholder for future controls */}
            <div className="controls-placeholder">
              <p>{t('situation.controlsPlaceholder') || 'Drawing tools will appear here'}</p>
            </div>

            <div className="controls-buttons">
              <button
                className="btn-secondary"
                onClick={handleClear}
                type="button"
              >
                {t('situation.clear') || 'Clear'}
              </button>
              <button
                className="btn-secondary"
                onClick={onClose}
                type="button"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                type="button"
              >
                {t('common.save') || 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
