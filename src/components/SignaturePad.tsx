import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SignaturePad.css';

interface SignaturePadProps {
  onClose: () => void;
  onSave: (signature: string) => void;
  driverName: string;
  driverLabel: 'A' | 'B';
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onClose,
  onSave,
  driverName,
  driverLabel,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Set up canvas context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#333';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    if (isEmpty) {
      setIsEmpty(false);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCanvasPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Get the cropped signature (only the area with actual signature)
    const croppedCanvas = cropSignature(canvas);
    const signatureData = croppedCanvas.toDataURL('image/png');
    onSave(signatureData);
  };

  const cropSignature = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Find bounding box of non-white pixels
    let minX = canvas.width;
    let maxX = 0;
    let minY = canvas.height;
    let maxY = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Check if pixel is not white (or transparent)
      // We consider it part of the signature if it's dark (not white)
      if (a > 128 && (r < 240 || g < 240 || b < 240)) {
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    // Add small padding around signature
    const padding = 5;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(canvas.width - cropX, maxX - minX + padding * 2);
    const cropHeight = Math.min(canvas.height - cropY, maxY - minY + padding * 2);

    // Create a new canvas with the cropped area
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    const croppedCtx = croppedCanvas.getContext('2d');
    if (croppedCtx) {
      croppedCtx.drawImage(
        canvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
    }

    return croppedCanvas;
  };

  return (
    <div className="signature-pad-overlay">
      <div className="signature-pad-modal">
        <div className="signature-pad-header">
          <h2>{t(`signature.pad.title${driverLabel}`)}</h2>
          <p className="signature-pad-name">{driverName}</p>
          <button
            className="signature-pad-close"
            onClick={onClose}
            type="button"
            aria-label={t('common.close') || 'Close signature pad'}
          >
            ✕
          </button>
        </div>

        <div className="signature-pad-container">
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="signature-pad-hint">
            {isEmpty && <p>{t('signature.pad.hint')}</p>}
          </div>
        </div>

        <div className="signature-pad-controls">
          <button
            className="btn-secondary"
            onClick={clearSignature}
            type="button"
          >
            {t('signature.pad.clear')}
          </button>
          <button
            className="btn-secondary"
            onClick={onClose}
            type="button"
          >
            {t('signature.pad.cancel')}
          </button>
          <button
            className={`btn-primary ${isEmpty ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={isEmpty}
            type="button"
          >
            {t('signature.pad.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
