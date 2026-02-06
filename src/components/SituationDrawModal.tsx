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
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | null>(null);
  const [selectedTool, setSelectedTool] = useState<'pen' | null>(null);
  const [penWidth, setPenWidth] = useState(2);
  const [penColor, setPenColor] = useState('#000000');

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

  // Initialize and trigger layout calculation on mount
  useEffect(() => {
    // Give DOM time to render, then trigger resize calculation
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);

    return () => clearTimeout(timer);
  }, []);

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

  // Drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Clamp coordinates to stay within the drawable area (inside the border)
  const clampCoords = (x: number, y: number, halfWidth: number = penWidth / 2) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x, y };
    
    const borderWidth = 2;
    const minX = borderWidth + halfWidth;
    const minY = borderWidth + halfWidth;
    const maxX = canvas.width - borderWidth - halfWidth;
    const maxY = canvas.height - borderWidth - halfWidth;
    
    return {
      x: Math.max(minX, Math.min(x, maxX)),
      y: Math.max(minY, Math.min(y, maxY)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingTool !== 'pen') return;

    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    const clamped = clampCoords(coords.x, coords.y);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx && canvas) {
      ctx.beginPath();
      ctx.moveTo(clamped.x, clamped.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingTool !== 'pen') return;

    const coords = getCanvasCoordinates(e);
    const clamped = clampCoords(coords.x, coords.y);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx) {
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineTo(clamped.x, clamped.y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (drawingTool !== 'pen') return;

    e.preventDefault();
    setIsDrawing(true);

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    const clamped = clampCoords(x, y);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(clamped.x, clamped.y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingTool !== 'pen') return;

    e.preventDefault();

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    const clamped = clampCoords(x, y);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineTo(clamped.x, clamped.y);
      ctx.stroke();
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
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
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                cursor: drawingTool === 'pen' ? 'crosshair' : 'default',
                touchAction: 'none',
              }}
            />
          </div>

          <div className="situation-draw-controls-panel">
            {/* Scrollable section for tools and controls */}
            <div className="controls-scrollable-area">
              {/* Drawing tools */}
              <div className="drawing-tools">
                <button
                  className={`btn-tool btn-pen ${drawingTool === 'pen' ? 'active' : ''}`}
                  onClick={() => {
                    if (drawingTool === 'pen') {
                      setDrawingTool(null);
                      setSelectedTool(null);
                    } else {
                      setDrawingTool('pen');
                      setSelectedTool('pen');
                    }
                  }}
                  type="button"
                  title={t('situation.pen') || 'Pen - Draw freehand'}
                  aria-label="Pen tool"
                >
                  ✏️
                </button>
                <button
                  className="btn-tool btn-placeholder"
                  type="button"
                  title="Tool A"
                  aria-label="Tool A"
                  disabled
                >
                  A
                </button>
                <button
                  className="btn-tool btn-placeholder"
                  type="button"
                  title="Tool B"
                  aria-label="Tool B"
                  disabled
                >
                  B
                </button>
                <button
                  className="btn-tool btn-placeholder"
                  type="button"
                  title="Tool C"
                  aria-label="Tool C"
                  disabled
                >
                  C
                </button>
                <button
                  className="btn-tool btn-placeholder"
                  type="button"
                  title="Tool D"
                  aria-label="Tool D"
                  disabled
                >
                  D
                </button>
                <button
                  className="btn-tool btn-placeholder"
                  type="button"
                  title="Tool E"
                  aria-label="Tool E"
                  disabled
                >
                  E
                </button>
                <button
                  className="btn-tool btn-placeholder"
                  type="button"
                  title="Tool F"
                  aria-label="Tool F"
                  disabled
                >
                  F
                </button>
              </div>

              {/* Tool controls panel */}
              {selectedTool && (
                <div className="tool-controls-panel">
                  <div className="tool-controls-header">
                    <span className="tool-controls-title">
                      {selectedTool === 'pen' ? '✏️ Pen' : 'Tool'}
                    </span>
                    <button
                      className="btn-close-tool-controls"
                      onClick={() => {
                        setDrawingTool(null);
                        setSelectedTool(null);
                      }}
                      type="button"
                      title={t('common.close') || 'Close'}
                      aria-label="Close tool controls"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Placeholder for tool-specific controls */}
                  <div 
                    className="tool-controls-content"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    {selectedTool === 'pen' && (
                      <div className="pen-controls">
                        {/* Line Width Control */}
                        <div className="control-group">
                          <label htmlFor="pen-width">Width: {penWidth}px</label>
                          <input
                            id="pen-width"
                            type="range"
                            min="1"
                            max="20"
                            value={penWidth}
                            onChange={(e) => setPenWidth(parseInt(e.target.value))}
                            className="width-slider"
                          />
                          <div className="width-preview" style={{ 
                            height: `${penWidth + 1}px`, 
                            width: '80px',
                            backgroundColor: penColor 
                          }} />
                        </div>

                        {/* Color Picker */}
                        <div className="control-group">
                          <label>Color</label>
                          <div className="color-picker-group">
                            <div className="color-swatches">
                              {[
                                '#000000', '#ffffff', '#FF0000', '#00AA00', '#0066CC',
                                '#FFAA00', '#FF5500', '#AA00FF', '#00AAAA', '#AA0055',
                                '#555555', '#AAAAAA', '#FF6666', '#66FF66', '#6666FF',
                                '#FFFF66', '#FF66FF', '#66FFFF', '#FFB366', '#9966FF',
                                '#66FF99', '#FF9999', '#9966CC', '#99CCFF', '#FFCC99',
                                '#CC99FF', '#99FFCC', '#FF99CC', '#CCFF99', '#99FFFF',
                              ].map((color) => (
                                <button
                                  key={color}
                                  className={`color-swatch ${penColor === color ? 'active' : ''}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setPenColor(color)}
                                  title={color}
                                  type="button"
                                  aria-label={`Color ${color}`}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={penColor}
                              onChange={(e) => setPenColor(e.target.value)}
                              className="custom-color-input"
                              title="Custom color"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fixed buttons section at the bottom */}
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
