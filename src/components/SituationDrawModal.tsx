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
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [controlsPosition, setControlsPosition] = useState<ControlsPosition>('bottom');
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 640, height: 300 });

  // Canvas aspect ratio: 32:15
  const ASPECT_RATIO = 32 / 15;

  // Calculate canvas size to fit available space while maintaining aspect ratio
  const calculateCanvasSize = () => {
    if (!canvasWrapperRef.current) return;

    const wrapperRect = canvasWrapperRef.current.getBoundingClientRect();

    // Available space for canvas (subtract padding: 3px * 2 for each side)
    const padding = 3;
    const availableWidth = wrapperRect.width - padding * 2;
    const availableHeight = wrapperRect.height - padding * 2;

    let newWidth = availableWidth;
    let newHeight = availableWidth / ASPECT_RATIO;

    // If height exceeds available, constrain by height
    if (newHeight > availableHeight) {
      newHeight = availableHeight;
      newWidth = availableHeight * ASPECT_RATIO;
    }

    // Ensure minimum size
    newWidth = Math.max(newWidth, 320);
    newHeight = Math.max(newHeight, 150);

    setCanvasDimensions({ width: newWidth, height: newHeight });
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on calculated dimensions
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasDimensions.width, canvasDimensions.height);

    // If there's an initial image, load it
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialImage;
    }
  }, [canvasDimensions, initialImage]);

  // Determine controls position based on screen size
  useEffect(() => {
    const handleResize = () => {
      calculateCanvasSize();

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      
      // Get modal's actual dimensions
      const modalWidth = rect.width;
      const modalHeight = rect.height;

      // If modal width is significantly larger than height, place controls on the left
      // Otherwise, place them below
      // We require at least 3:2 width-to-height ratio to place on left
      if (modalWidth / modalHeight > 1.5) {
        setControlsPosition('left');
      } else {
        setControlsPosition('bottom');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect when the canvas wrapper changes size
    const resizeObserver = new ResizeObserver(() => {
      calculateCanvasSize();
      handleResize();
    });

    if (canvasWrapperRef.current) {
      resizeObserver.observe(canvasWrapperRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
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
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasDimensions.width, canvasDimensions.height);
  };

  return (
    <div className="situation-draw-modal-overlay">
      <div
        ref={containerRef}
        className={`situation-draw-modal situation-draw-modal-${controlsPosition}`}
      >
        <div className="situation-draw-modal-content">
          <div className="situation-draw-canvas-wrapper" ref={canvasWrapperRef}>
            <canvas
              ref={canvasRef}
              className="situation-draw-canvas"
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
              }}
            />
          </div>

          <div className="situation-draw-controls-panel">
            {/* Placeholder for future controls */}
            <div className="controls-placeholder">
              <p>{t('situation.controlsPlaceholder') || 'Drawing tools will appear here'}</p>
            </div>

            <div className="controls-buttons">
              <button
                className="btn-icon btn-clear"
                onClick={handleClear}
                type="button"
                title={t('situation.clear') || 'Clear'}
                aria-label="Clear canvas"
              >
                🗑️
              </button>
              <button
                className="btn-icon btn-cancel"
                onClick={onClose}
                type="button"
                title={t('common.cancel') || 'Cancel'}
                aria-label="Cancel"
              >
                ✕
              </button>
              <button
                className="btn-icon btn-save"
                onClick={handleSave}
                type="button"
                title={t('common.save') || 'Save'}
                aria-label="Save"
              >
                ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
