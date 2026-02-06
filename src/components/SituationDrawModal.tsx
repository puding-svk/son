import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SituationDrawModal.css';

interface SituationDrawModalProps {
  onClose: () => void;
  onSave: (imageData: string) => void;
  initialImage?: string;
}

type ControlsPosition = 'left' | 'bottom';

interface Sticker {
  id: string;
  type: 'vehicleA' | 'vehicleB';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  minScale: number;
  maxScale: number;
  color: string;
}

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
  const [isCanvasSizeLocked, setIsCanvasSizeLocked] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | null>(null);
  const [selectedTool, setSelectedTool] = useState<'pen' | null>(null);
  const [penWidth, setPenWidth] = useState(2);
  const [penColor, setPenColor] = useState('#000000');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const drawingLayerRef = useRef<HTMLCanvasElement | null>(null);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [isRotatingSticker, setIsRotatingSticker] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotationOffset, setRotationOffset] = useState(0); // Offset between grab angle and sticker rotation

  // Canvas aspect ratio: 32:15
  const ASPECT_RATIO = 32 / 15;

  // Calculate canvas size to fit available space while maintaining aspect ratio
  const calculateCanvasSize = () => {
    // Don't recalculate if canvas size is locked
    if (isCanvasSizeLocked) return;

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

    // Create offscreen drawing layer
    if (!drawingLayerRef.current) {
      drawingLayerRef.current = document.createElement('canvas');
    }
    drawingLayerRef.current.width = canvasDimensions.width;
    drawingLayerRef.current.height = canvasDimensions.height;
    
    const layerCtx = drawingLayerRef.current.getContext('2d');
    if (layerCtx) {
      // Fill with white background
      layerCtx.fillStyle = '#ffffff';
      layerCtx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

      // Draw border
      layerCtx.strokeStyle = '#cccccc';
      layerCtx.lineWidth = 2;
      layerCtx.strokeRect(0, 0, canvasDimensions.width, canvasDimensions.height);

      // If there's an initial image, load it
      if (initialImage) {
        const img = new Image();
        img.onload = () => {
          layerCtx.drawImage(img, 0, 0);
          // Trigger redraw
          renderCanvas();
        };
        img.src = initialImage;
      } else {
        renderCanvas();
      }
    }
  }, [canvasDimensions, initialImage]);

  // Function to composite all layers and render to main canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const drawingLayer = drawingLayerRef.current;
    if (!canvas || !drawingLayer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the drawing layer (pen strokes + background)
    ctx.drawImage(drawingLayer, 0, 0);
    
    // Draw stickers on top
    stickers.forEach(sticker => {
      const size = 40 * sticker.scale;
      
      ctx.save();
      ctx.translate(sticker.x, sticker.y);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      
      // Draw car SVG using canvas paths
      // This is the car from SVGTestSection converted to canvas drawing

      // Scale the car to fit the size
      const scale = size / 47.032;
      ctx.scale(scale, scale);
      ctx.translate(-23.516, -23.516); 

      // Draw rect element (windows)
      ctx.fillStyle = 'rgb(229, 229, 229)';
      ctx.fillRect(12.922, 8.772, 21.132, 32.401);

      ctx.fillStyle = sticker.color;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;      
           
      // Car SVG path (front view)
      const carPath = new Path2D('M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759 c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713 v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z');
      
      ctx.fill(carPath);
      ctx.stroke(carPath);
      
      ctx.restore();
      
      // Draw selection circle if selected
      if (selectedSticker === sticker.id) {
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(sticker.x, sticker.y, size / 2 + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  };

  // Render stickers layer - overlays on canvas
  useEffect(() => {
    renderCanvas();
  }, [stickers, selectedSticker]);

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
  }, [isCanvasSizeLocked]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Unselect any selected sticker to hide selection circle before saving
    setSelectedSticker(null);
    
    // Defer image capture to next frame to ensure render with no selection
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      onSave(imageData);
    }, 0);
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

  // Get touch coordinates for canvas
  const getTouchCanvasCoordinates = (touch: React.Touch) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  // Get the selection circle radius for a sticker (dynamic based on scale)
  const getStickerSelectionRadius = (sticker: Sticker): number => {
    const stickerSize = 40 * sticker.scale;
    return stickerSize / 2 + 10; // Selection circle is 10px outside the sticker
  };

  // Check if a point is on a sticker (inside the selection circle)
  const getStickerAtPoint = (x: number, y: number): Sticker | null => {
    // Check in reverse order so top stickers are selected first
    for (let i = stickers.length - 1; i >= 0; i--) {
      const sticker = stickers[i];
      const distance = Math.hypot(sticker.x - x, sticker.y - y);
      const selectionRadius = getStickerSelectionRadius(sticker);
      if (distance <= selectionRadius) {
        return sticker;
      }
    }
    return null;
  };

  // Check if a point is in the rotation region (around the selection circle circumference)
  const isPointInRotationRegion = (x: number, y: number): boolean => {
    if (!selectedSticker) return false;

    const sticker = stickers.find(s => s.id === selectedSticker);
    if (!sticker) return false;

    const selectionRadius = getStickerSelectionRadius(sticker);
    const rotationRegionWidth = 15; // pixels on either side of the selection ring

    const distance = Math.hypot(sticker.x - x, sticker.y - y);

    // Point is in rotation region if it's near the circumference of the selection circle
    return distance >= selectionRadius - rotationRegionWidth && distance <= selectionRadius + rotationRegionWidth;
  };

  // Check if a point is inside the sticker (for dragging)
  const isPointInsideSticker = (x: number, y: number): boolean => {
    if (!selectedSticker) return false;

    const sticker = stickers.find(s => s.id === selectedSticker);
    if (!sticker) return false;

    const selectionRadius = getStickerSelectionRadius(sticker);
    const rotationRegionWidth = 15;
    const distance = Math.hypot(sticker.x - x, sticker.y - y);

    // Point is inside if it's within the selection circle but not in the rotation region
    return distance < selectionRadius - rotationRegionWidth;
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

    // Lock canvas size when first content is drawn
    if (!isCanvasSizeLocked && stickers.length === 0) {
      setIsCanvasSizeLocked(true);
    }

    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    const clamped = clampCoords(coords.x, coords.y);
    const drawingLayer = drawingLayerRef.current;
    const ctx = drawingLayer?.getContext('2d');

    if (ctx && drawingLayer) {
      ctx.beginPath();
      ctx.moveTo(clamped.x, clamped.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingTool !== 'pen') return;

    const coords = getCanvasCoordinates(e);
    const clamped = clampCoords(coords.x, coords.y);
    const drawingLayer = drawingLayerRef.current;
    const ctx = drawingLayer?.getContext('2d');

    if (ctx) {
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineTo(clamped.x, clamped.y);
      ctx.stroke();
      renderCanvas();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    const drawingLayer = drawingLayerRef.current;
    const ctx = drawingLayer?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    renderCanvas();
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    const drawingLayer = drawingLayerRef.current;
    const ctx = drawingLayer?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    renderCanvas();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (drawingTool !== 'pen') return;

    // Lock canvas size when first content is drawn
    if (!isCanvasSizeLocked && stickers.length === 0) {
      setIsCanvasSizeLocked(true);
    }

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

    const drawingLayer = drawingLayerRef.current;
    const ctx = drawingLayer?.getContext('2d');
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

    const drawingLayer = drawingLayerRef.current;
    const ctx = drawingLayer?.getContext('2d');
    if (ctx) {
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineTo(clamped.x, clamped.y);
      ctx.stroke();
      renderCanvas();
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    const drawingLayer = drawingLayerRef.current;
    const ctx = drawingLayer?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    renderCanvas();
  };

  const handleClear = () => {
    const drawingLayer = drawingLayerRef.current;
    if (!drawingLayer) return;

    const ctx = drawingLayer.getContext('2d');
    if (!ctx) return;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    
    // Clear stickers and unlock canvas
    setStickers([]);
    setSelectedSticker(null);
    setIsCanvasSizeLocked(false);
    
    // Trigger redraw
    renderCanvas();
  };

  // Sticker handlers
  const addSticker = (type: 'vehicleA' | 'vehicleB', color: string) => {
    // Check if sticker of this type already exists
    if (stickers.some(s => s.type === type)) {
      return;
    }

    // Lock canvas size when first content is added
    if (stickers.length === 0) {
      setIsCanvasSizeLocked(true);
    }

    // Calculate scale constraints based on current canvas size
    // Scale is proportional to canvas dimensions
    const minCanvasScale = Math.min(canvasDimensions.width, canvasDimensions.height) / 100;
    const minScale = Math.max(1, Math.floor(minCanvasScale * 0.55));
    const maxScale = Math.ceil(minCanvasScale * 2.2);
    const initialScale = Math.ceil(minCanvasScale * 1.1);

    const newSticker: Sticker = {
      id: `${type}-${Date.now()}`,
      type,
      x: canvasDimensions.width / 2,
      y: canvasDimensions.height / 2,
      rotation: 0,
      scale: initialScale,
      minScale,
      maxScale,
      color,
    };

    setStickers([...stickers, newSticker]);
    setSelectedSticker(newSticker.id);
    setDrawingTool(null);
    setSelectedTool(null);
  };

  const deleteSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
    if (selectedSticker === id) {
      setSelectedSticker(null);
    }
  };

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setStickers(stickers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't process click if we just finished dragging or rotating
    if (isDraggingSticker || isRotatingSticker) return;

    const coords = getCanvasCoordinates(e);
    const { x, y } = coords;

    // Check if click is on a sticker
    const clickedSticker = getStickerAtPoint(x, y);
    
    if (clickedSticker) {
      setSelectedSticker(clickedSticker.id);
      // Close any active tool when selecting a sticker
      setDrawingTool(null);
      setSelectedTool(null);
    } else {
      setSelectedSticker(null);
    }
  };

  const handleStickerMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    const { x, y } = coords;

    // Check if clicking on rotation region (around the selection circle)
    if (isPointInRotationRegion(x, y) && selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        // Calculate the angle of the grab point relative to sticker center
        const grabAngle = Math.atan2(y - sticker.y, x - sticker.x) * (180 / Math.PI) + 90;
        // Store the offset between current rotation and grab angle
        setRotationOffset(sticker.rotation - grabAngle);
        setIsRotatingSticker(true);
        e.preventDefault();
      }
      return;
    }

    // Check if clicking inside the sticker (for dragging)
    if (isPointInsideSticker(x, y) && selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        setIsDraggingSticker(true);
        setDragOffset({
          x: sticker.x - x,
          y: sticker.y - y,
        });
        e.preventDefault();
        return;
      }
    }

    // Check if clicking on a different sticker to select it
    const clickedSticker = getStickerAtPoint(x, y);
    if (clickedSticker && clickedSticker.id !== selectedSticker) {
      setSelectedSticker(clickedSticker.id);
      return;
    }
  };

  const handleStickerMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(e);
    const { x, y } = coords;

    // Handle rotation
    if (isRotatingSticker && selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        // Calculate angle from sticker center to current mouse position
        const dx = x - sticker.x;
        const dy = y - sticker.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

        // Apply the rotation offset to maintain relative position
        const newRotation = (angle + rotationOffset + 360) % 360;

        updateSticker(selectedSticker, { rotation: newRotation });
      }
      return;
    }

    // Handle dragging
    if (isDraggingSticker && selectedSticker) {
      const newX = Math.max(20, Math.min(canvasDimensions.width - 20, x + dragOffset.x));
      const newY = Math.max(20, Math.min(canvasDimensions.height - 20, y + dragOffset.y));
      updateSticker(selectedSticker, { x: newX, y: newY });
      return;
    }

    // Update cursor based on what we're hovering over
    if (selectedSticker) {
      if (isPointInRotationRegion(x, y)) {
        canvas.style.cursor = 'grab';
      } else if (isPointInsideSticker(x, y)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = drawingTool === 'pen' ? 'crosshair' : 'default';
      }
    }
  };

  const handleStickerMouseUp = () => {
    setIsDraggingSticker(false);
    setIsRotatingSticker(false);
  };

  // Touch handlers for stickers
  const handleStickerTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const coords = getTouchCanvasCoordinates(touch);
    const { x, y } = coords;

    // Check if touching rotation region
    if (isPointInRotationRegion(x, y) && selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        // Calculate the angle of the grab point relative to sticker center
        const grabAngle = Math.atan2(y - sticker.y, x - sticker.x) * (180 / Math.PI) + 90;
        // Store the offset between current rotation and grab angle
        setRotationOffset(sticker.rotation - grabAngle);
        e.preventDefault();
        setIsRotatingSticker(true);
      }
      return;
    }

    // Check if touching inside the sticker (for dragging)
    if (isPointInsideSticker(x, y) && selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        e.preventDefault();
        setIsDraggingSticker(true);
        setDragOffset({
          x: sticker.x - x,
          y: sticker.y - y,
        });
        return;
      }
    }

    // Check if touching a different sticker to select it
    const touchedSticker = getStickerAtPoint(x, y);
    if (touchedSticker) {
      e.preventDefault();
      setSelectedSticker(touchedSticker.id);
      
      // If it's already the selected sticker, prepare to drag from inside
      if (touchedSticker.id === selectedSticker && isPointInsideSticker(x, y)) {
        setIsDraggingSticker(true);
        setDragOffset({
          x: touchedSticker.x - x,
          y: touchedSticker.y - y,
        });
      }
    } else {
      setSelectedSticker(null);
    }
  };

  const handleStickerTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const coords = getTouchCanvasCoordinates(touch);
    const { x, y } = coords;

    // Handle rotation
    if (isRotatingSticker && selectedSticker) {
      e.preventDefault();
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        const dx = x - sticker.x;
        const dy = y - sticker.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        // Apply the rotation offset to maintain relative position
        const newRotation = (angle + rotationOffset + 360) % 360;
        updateSticker(selectedSticker, { rotation: newRotation });
      }
      return;
    }

    // Handle dragging
    if (isDraggingSticker && selectedSticker) {
      e.preventDefault();
      const newX = Math.max(20, Math.min(canvasDimensions.width - 20, x + dragOffset.x));
      const newY = Math.max(20, Math.min(canvasDimensions.height - 20, y + dragOffset.y));
      updateSticker(selectedSticker, { x: newX, y: newY });
    }
  };

  const handleStickerTouchEnd = () => {
    setIsDraggingSticker(false);
    setIsRotatingSticker(false);
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
              onMouseDown={(e) => {
                // First check for sticker interactions
                const coords = getCanvasCoordinates(e);
                const stickerAtPoint = getStickerAtPoint(coords.x, coords.y);
                
                if (selectedSticker || stickerAtPoint) {
                  handleStickerMouseDown(e);
                } else if (drawingTool === 'pen') {
                  handleMouseDown(e);
                }
              }}
              onMouseMove={(e) => {
                if (isDraggingSticker || isRotatingSticker) {
                  handleStickerMouseMove(e);
                } else if (selectedSticker) {
                  // Update cursor even when not dragging/rotating
                  handleStickerMouseMove(e);
                } else if (drawingTool === 'pen') {
                  handleMouseMove(e);
                }
              }}
              onMouseUp={() => {
                if (isDraggingSticker || isRotatingSticker) {
                  handleStickerMouseUp();
                } else {
                  handleMouseUp();
                }
              }}
              onMouseLeave={() => {
                if (isDraggingSticker || isRotatingSticker) {
                  handleStickerMouseUp();
                } else {
                  handleMouseLeave();
                }
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const coords = getTouchCanvasCoordinates(touch);
                const stickerAtPoint = getStickerAtPoint(coords.x, coords.y);
                
                if (selectedSticker || stickerAtPoint) {
                  handleStickerTouchStart(e);
                } else if (drawingTool === 'pen') {
                  handleTouchStart(e);
                }
              }}
              onTouchMove={(e) => {
                if (isDraggingSticker || isRotatingSticker) {
                  handleStickerTouchMove(e);
                } else if (drawingTool === 'pen') {
                  handleTouchMove(e);
                }
              }}
              onTouchEnd={() => {
                if (isDraggingSticker || isRotatingSticker) {
                  handleStickerTouchEnd();
                } else {
                  handleTouchEnd();
                }
              }}
              onClick={handleCanvasClick}
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                cursor: drawingTool === 'pen' ? 'crosshair' : (selectedSticker ? 'grab' : 'default'),
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
                  className="btn-tool btn-sticker-a"
                  onClick={() => addSticker('vehicleA', '#ADD8E6')}
                  type="button"
                  title="Vehicle A - Light Blue"
                  aria-label="Vehicle A sticker"
                  disabled={stickers.some(s => s.type === 'vehicleA')}
                >
                  A
                </button>
                <button
                  className="btn-tool btn-sticker-b"
                  onClick={() => addSticker('vehicleB', '#FFFFE0')}
                  type="button"
                  title="Vehicle B - Light Yellow"
                  aria-label="Vehicle B sticker"
                  disabled={stickers.some(s => s.type === 'vehicleB')}
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
              {(selectedTool || selectedSticker) && (
                <div className="tool-controls-panel">
                  <div className="tool-controls-header">
                    <span className="tool-controls-title">
                      {selectedTool === 'pen' && '✏️ Pen'}
                      {selectedSticker && (
                        stickers.find(s => s.id === selectedSticker)?.type === 'vehicleA' ? '🚗 Vehicle A' : '🚗 Vehicle B'
                      )}
                    </span>
                    <button
                      className="btn-close-tool-controls"
                      onClick={() => {
                        setDrawingTool(null);
                        setSelectedTool(null);
                        setSelectedSticker(null);
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

                    {selectedSticker && (
                      <div className="sticker-controls">
                        <div className="sticker-grid-controls">
                          {/* Row 1: Rotate Left | Move Up | Rotate Right */}
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { rotation: sticker.rotation - 15 });
                          }} type="button" title="Rotate left">↺</button>
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { y: Math.max(0, sticker.y - 5) });
                          }} type="button" title="Move up">↑</button>
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { rotation: sticker.rotation + 15 });
                          }} type="button" title="Rotate right">↻</button>
                          
                          {/* Row 2: Move Left | Empty | Move Right */}
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { x: Math.max(0, sticker.x - 5) });
                          }} type="button" title="Move left">←</button>
                          <div className="grid-spacer"></div>
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { x: Math.min(canvasDimensions.width, sticker.x + 5) });
                          }} type="button" title="Move right">→</button>
                          
                          {/* Row 3: Scale Down | Move Down | Scale Up */}
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { scale: Math.max(sticker.minScale, sticker.scale - 0.2) });
                          }} type="button" title="Scale down">−</button>
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { y: Math.min(canvasDimensions.height, sticker.y + 5) });
                          }} type="button" title="Move down">↓</button>
                          <button onClick={() => {
                            const sticker = stickers.find(s => s.id === selectedSticker);
                            if (sticker) updateSticker(selectedSticker, { scale: Math.min(sticker.maxScale, sticker.scale + 0.2) });
                          }} type="button" title="Scale up">+</button>
                        </div>

                        <div className="control-group">
                          <button 
                            onClick={() => deleteSticker(selectedSticker)} 
                            type="button" 
                            className="btn-delete"
                            title="Delete sticker"
                          >
                            🗑️ Delete
                          </button>
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
