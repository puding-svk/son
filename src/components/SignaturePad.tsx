import React, { useRef, useState, useEffect } from 'react';
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

    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className="signature-pad-overlay">
      <div className="signature-pad-modal">
        <div className="signature-pad-header">
          <h2>Driver {driverLabel} Signature</h2>
          <p className="signature-pad-name">{driverName}</p>
          <button
            className="signature-pad-close"
            onClick={onClose}
            type="button"
            aria-label="Close signature pad"
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
            {isEmpty && <p>Sign here with your finger or mouse</p>}
          </div>
        </div>

        <div className="signature-pad-controls">
          <button
            className="btn-secondary"
            onClick={clearSignature}
            type="button"
          >
            Clear
          </button>
          <button
            className="btn-secondary"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`btn-primary ${isEmpty ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={isEmpty}
            type="button"
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
};
