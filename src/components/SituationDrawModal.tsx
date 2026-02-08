import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SIGNS } from '../data/signs';
import { OTHER_STICKERS } from '../data/otherStickers';
import './SituationDrawModal.css';

interface SituationDrawModalProps {
  onClose: () => void;
  onSave: (imageData: string) => void;
  initialImage?: string;
}

type ControlsPosition = 'left' | 'bottom';

interface Sticker {
  id: string;
  type: 'vehicleA' | 'vehicleB' | 'text' | 'arrow' | 'sign' | 'sticker';
  vehicleCategory?: 'car' | 'truck' | 'motorcycle';
  signType?: string;
  stickerType?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  minScale: number;
  maxScale: number;
  color: string;
  color2: string;
  isText?: boolean;
  text?: string;
  fontSize?: number;
  selectionRadius?: number;
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
  const [drawingTool, setDrawingTool] = useState<'pen' | 'text' | null>(null);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'text' | null>(null);
  const [penWidth, setPenWidth] = useState(2);
  const [penColor, setPenColor] = useState('#000000');
  const [textSize] = useState(10);
  const [textColor] = useState('#000000');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showSignSelector, setShowSignSelector] = useState(false);
  const [showStickersSelector, setShowStickersSelector] = useState(false);
  const drawingLayerRef = useRef<HTMLCanvasElement | null>(null);
  const signImagesRef = useRef<Record<string, HTMLImageElement | null>>({});
  const stickersImagesRef = useRef<Record<string, HTMLImageElement | null>>({});
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [isRotatingSticker, setIsRotatingSticker] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotationOffset, setRotationOffset] = useState(0); // Offset between grab angle and sticker rotation
  const [isPinchScaling, setIsPinchScaling] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [pinchStartScale, setPinchStartScale] = useState(0);

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

  // Load SVG sign image from Base64 data
  const getSignImage = (signFile: string): HTMLImageElement | null => {
    if (signImagesRef.current[signFile]) {
      return signImagesRef.current[signFile];
    }

    const sign = SIGNS.find(s => s.file === signFile);
    if (!sign) {
      console.warn(`Sign not found: ${signFile}`);
      return null;
    }

    const img = new Image();
    img.onload = () => {
      signImagesRef.current[signFile] = img;
      // Trigger re-render
      renderCanvas();
    };
    img.onerror = () => {
      console.warn(`Failed to load sign image: ${signFile}`);
      signImagesRef.current[signFile] = null;
    };
    // Use Base64 data directly
    img.src = `data:image/svg+xml;base64,${sign.data}`;
    return null;
  };

  const getStickerImage = (stickerFile: string): HTMLImageElement | null => {
    if (stickersImagesRef.current[stickerFile]) {
      return stickersImagesRef.current[stickerFile];
    }

    const sticker = OTHER_STICKERS.find(s => s.file === stickerFile);
    if (!sticker) {
      console.warn(`Sticker not found: ${stickerFile}`);
      return null;
    }

    const img = new Image();
    img.onload = () => {
      stickersImagesRef.current[stickerFile] = img;
      // Trigger re-render
      renderCanvas();
    };
    img.onerror = () => {
      console.warn(`Failed to load sticker image: ${stickerFile}`);
      stickersImagesRef.current[stickerFile] = null;
    };
    // Use Base64 data directly
    img.src = `data:image/svg+xml;base64,${sticker.data}`;
    return null;
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

      // Handle text stickers
      if (sticker.isText && sticker.text) {
        ctx.fillStyle = sticker.color;
        const scaledFontSize = (sticker.fontSize || 20) * sticker.scale;
        ctx.font = `${scaledFontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.text, 0, 0);
      } else if (sticker.type === 'arrow') {
        // Draw arrow
        ctx.fillStyle = sticker.color;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 2;
        
        // Scale arrow dimensions - multiply base sizes by scale
        const baseLength = 30;
        const baseWidth = 6;
        const baseHeadSize = 10;
        
        const arrowLength = baseLength * (sticker.scale / 2);
        const arrowWidth = baseWidth * (sticker.scale / 2);
        const headSize = baseHeadSize * (sticker.scale / 2);
        
        // Draw arrow shaft
        ctx.beginPath();
        ctx.moveTo(-arrowLength / 2, -arrowWidth / 2);
        ctx.lineTo(arrowLength / 2 - headSize, -arrowWidth / 2);
        ctx.lineTo(arrowLength / 2 - headSize, -headSize);
        // Arrow head
        ctx.lineTo(arrowLength / 2, 0);
        ctx.lineTo(arrowLength / 2 - headSize, headSize);
        ctx.lineTo(arrowLength / 2 - headSize, arrowWidth / 2);
        ctx.lineTo(-arrowLength / 2, arrowWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (sticker.type === 'sign') {
        // Draw sign from SVG
        const signSize = 30 * (sticker.scale / 2);
        let signImage = signImagesRef.current[sticker.signType || ''];
        
        if (!signImage && sticker.signType) {
          // Try to load the image
          signImage = getSignImage(sticker.signType);
        }
        
        if (signImage) {
          // Draw the loaded SVG image
          ctx.drawImage(signImage, -signSize / 2, -signSize / 2, signSize, signSize);
        } else {
          // Fallback: draw a placeholder square with sign label
          const signSize = 30 * (sticker.scale / 2);
          ctx.fillStyle = '#ffcccc';
          ctx.strokeStyle = '#cc0000';
          ctx.lineWidth = 2;
          ctx.fillRect(-signSize / 2, -signSize / 2, signSize, signSize);
          ctx.strokeRect(-signSize / 2, -signSize / 2, signSize, signSize);
          
          // Draw sign label
          ctx.fillStyle = '#000000';
          ctx.font = `${8 * (sticker.scale / 2)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Sign', 0, 0);
        }
      } else if (sticker.type === 'sticker') {
        // Draw other sticker from SVG
        const stickerSize = 30 * (sticker.scale / 2);
        let stickerImage = stickersImagesRef.current[sticker.stickerType || ''];
        
        if (!stickerImage && sticker.stickerType) {
          // Try to load the image
          stickerImage = getStickerImage(sticker.stickerType);
        }
        
        if (stickerImage) {
          // Draw the loaded SVG image
          ctx.drawImage(stickerImage, -stickerSize / 2, -stickerSize / 2, stickerSize, stickerSize);
        } else {
          // Fallback: draw a placeholder square
          const stickerSize = 30 * (sticker.scale / 2);
          ctx.fillStyle = '#ccccff';
          ctx.strokeStyle = '#0000cc';
          ctx.lineWidth = 2;
          ctx.fillRect(-stickerSize / 2, -stickerSize / 2, stickerSize, stickerSize);
          ctx.strokeRect(-stickerSize / 2, -stickerSize / 2, stickerSize, stickerSize);
          
          // Draw label
          ctx.fillStyle = '#000000';
          ctx.font = `${8 * (sticker.scale / 2)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Sticker', 0, 0);
        }
      } else {
        // Draw car SVG using canvas paths
        // This is the car from SVGTestSection converted to canvas drawing

        // Scale the car to fit the size
        let scaleFactor = size / 47.032;
        ctx.scale(scaleFactor, scaleFactor);
        ctx.translate(-23.516, -23.516); 

      // Draw rect element (windows) - only for car
      if (sticker.vehicleCategory === 'car') {
        ctx.fillStyle = 'rgb(229, 229, 229)';
        ctx.fillRect(12.922, 8.772, 21.132, 32.401);
      }

      ctx.fillStyle = sticker.color;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;

      // Draw vehicle based on category
      if (sticker.vehicleCategory === 'car') {
        // Car SVG path (front view)
        const carPath = new Path2D('M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759 c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713 v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z');
        ctx.fill(carPath);
        ctx.stroke(carPath);

        // Add letter A or B at the top of the car
        ctx.save();
        ctx.fillStyle = sticker.color2;
        ctx.globalAlpha = 0.8;
        ctx.font = '15px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = sticker.type === 'vehicleA' ? 'A' : 'B';
        ctx.fillText(letter, 23.469, 30); // Position at top of car
        ctx.restore();
      } else if (sticker.vehicleCategory === 'truck') {
        // Truck SVG (side view) - viewBox 220x100
        ctx.restore(); // Restore first to reset transforms
        ctx.save();
        ctx.translate(sticker.x, sticker.y);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.rotate((270 * Math.PI) / 180); // Add 270-degree offset to match car rotation
        
        const truckScale = (size / 100) * 0.73; // Scale to fit height, then scale down to 73%
        ctx.scale(truckScale, truckScale);
        ctx.translate(-116.6, -50); // Center the truck, shifted 3% toward back
        
        // Draw truck parts (matching SVGTestSection)
        
        // Side detail line
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(170.713, 15.644);
        ctx.bezierCurveTo(180.713, 38.421, 180.713, 61.199, 170.713, 83.977);
        ctx.stroke();

        // Cabin (rounded rectangle)
        ctx.fillStyle = sticker.color;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(142.173, 24.183, 41.827, 52.137, 10);
        ctx.fill();
        ctx.stroke();
        
        // Window detail
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(150, 25);
        ctx.quadraticCurveTo(165, 50, 150, 75);
        ctx.fill();
        ctx.stroke();
        
        // Cargo bed (rectangle)
        ctx.fillStyle = sticker.color;
        ctx.beginPath();
        ctx.roundRect(52.354, 20, 97.646, 60, 2);
        ctx.fill();
        ctx.stroke();

        // Add letter A or B at the top of the truck
        ctx.save();
        ctx.rotate((-270 * Math.PI) / 180); // Counter-rotate to make text readable
        ctx.fillStyle = sticker.color2;
        ctx.globalAlpha = 0.8;
        ctx.font = '45px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = sticker.type === 'vehicleA' ? 'A' : 'B';
        ctx.fillText(letter, 50, -100); // Position at top of truck
        ctx.restore();
      } else if (sticker.vehicleCategory === 'motorcycle') {
        // Motorcycle SVG (side view) - viewBox 220x460
        ctx.restore(); // Restore first to reset transforms
        ctx.save();
        ctx.translate(sticker.x, sticker.y);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.rotate((270 * Math.PI) / 180); // Add 270-degree offset to match car rotation
        ctx.rotate((90 * Math.PI) / 180); // Add 90-degree offset for motorcycle orientation

        const motorcycleScale = (size / 460) * 1.5 * 0.6; // Scale to fit height, adjusted to 0.75
        ctx.scale(motorcycleScale, motorcycleScale);
        ctx.translate(-110, -230); // Center the motorcycle
        
        // front wheel
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();
        ctx.roundRect(93.014, 10, 33.972, 106.021, 22);
        ctx.fill();

        // headlight
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 3;
        ctx.fillStyle = sticker.color;
        ctx.beginPath();
        ctx.ellipse(110, 108, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // handlebar
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(20, 140);
        ctx.quadraticCurveTo(110, 95, 200, 140);
        ctx.stroke();

        // gas tank
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 8;
        ctx.fillStyle = sticker.color;
        ctx.beginPath();
        ctx.moveTo(70, 148.554);
        ctx.bezierCurveTo(96.667, 112.663, 123.333, 112.663, 150, 148.554);
        ctx.bezierCurveTo(160, 190.427, 146.667, 223.327, 110, 247.254);
        ctx.bezierCurveTo(73.333, 223.327, 60, 190.427, 70, 148.554);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        //rear wheel
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();
        ctx.roundRect(87.358, 357.947, 45.283, 92.053, 22);
        ctx.fill();

        // rear wheel cover
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(110, 320);
        ctx.quadraticCurveTo(80, 350, 90, 385);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(110, 320);
        ctx.quadraticCurveTo(140, 350, 130, 385);
        ctx.stroke();

        // seat
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 8;
        ctx.fillStyle = sticker.color;
        ctx.beginPath();
        ctx.ellipse(110, 311.303, 32, 74.223, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Add letter A or B at the top of the bike
        ctx.save();
        ctx.fillStyle = sticker.color2;
        ctx.globalAlpha = 0.8; // Slightly transparent for better visibility on bike details
        ctx.font = '170px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = sticker.type === 'vehicleA' ? 'A' : 'B';
        ctx.fillText(letter, 110, 325); // Position at top of bike
        ctx.restore();
      }
      }
      
      ctx.restore();
      
      // Draw selection circle if selected
      if (selectedSticker === sticker.id) {
        const circleRadius = getStickerSelectionRadius(sticker);
        
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(sticker.x, sticker.y, circleRadius, 0, Math.PI * 2);
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
    setShowTextColorPicker(false);
    
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
    // Use fixed radius if it's already set (for text stickers)
    if (sticker.selectionRadius !== undefined) {
      return sticker.selectionRadius;
    }
    // For arrows, use smaller selection radius
    if (sticker.type === 'arrow') {
      const arrowLength = 30 * (sticker.scale * 2 / 3);
      return arrowLength / 2 + 10;
    }
    // For signs and stickers, use scaled radius
    if (sticker.type === 'sign' || sticker.type === 'sticker') {
      const size = 30 * (sticker.scale / 2);
      return size / 2 + 10;
    }
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
    setShowTextColorPicker(false);
    setIsCanvasSizeLocked(false);
    
    // Trigger redraw
    renderCanvas();
  };

  // Sticker handlers
  const addSticker = (type: 'vehicleA' | 'vehicleB', color: string, color2: string) => {
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
      vehicleCategory: 'car',
      x: canvasDimensions.width / 2,
      y: canvasDimensions.height / 2,
      rotation: 0,
      scale: initialScale,
      minScale,
      maxScale,
      color,
      color2,
    };

    setStickers([...stickers, newSticker]);
    setSelectedSticker(newSticker.id);
    setDrawingTool(null);
    setSelectedTool(null);
  };

  const addTextSticker = (text: string, x: number, y: number) => {
    // Lock canvas size when first content is added
    if (stickers.length === 0) {
      setIsCanvasSizeLocked(true);
    }

    // Calculate scale constraints based on current canvas size
    const minCanvasScale = Math.min(canvasDimensions.width, canvasDimensions.height) / 100;
    const minScale = Math.max(1, Math.floor(minCanvasScale * 0.55));
    const maxScale = Math.ceil(minCanvasScale * 2.2);
    const initialScale = Math.ceil(minCanvasScale * 1.1);

    // Set fixed selection radius for text
    const fixedRadius = 40;

    const newTextSticker: Sticker = {
      id: `text-${Date.now()}`,
      type: 'text',
      x,
      y,
      rotation: 0,
      scale: initialScale,
      minScale,
      maxScale,
      color: textColor,
      color2: textColor,
      isText: true,
      text,
      fontSize: textSize,
      selectionRadius: fixedRadius,
    };

    setStickers([...stickers, newTextSticker]);
    setSelectedSticker(newTextSticker.id);
    setDrawingTool(null);
    setSelectedTool(null);
  };

  const addArrowSticker = () => {
    if (!isCanvasSizeLocked) {
      setIsCanvasSizeLocked(true);
    }

    const minCanvasScale = Math.min(canvasDimensions.width, canvasDimensions.height);
    const minScale = Math.max(0.3, minCanvasScale / 200);
    const maxScale = Math.ceil(minCanvasScale / 20);
    // For arrows, use much smaller initial scale
    const initialScale = Math.max(minScale, 3);

    const newArrowSticker: Sticker = {
      id: `arrow-${Date.now()}`,
      type: 'arrow',
      x: canvasDimensions.width / 2,
      y: canvasDimensions.height / 2,
      rotation: 0,
      scale: initialScale,
      minScale,
      maxScale,
      color: textColor,
      color2: textColor,
    };

    setStickers([...stickers, newArrowSticker]);
    setSelectedSticker(newArrowSticker.id);
  };

  const addSignSticker = (signType: string) => {
    const minCanvasScale = Math.min(canvasDimensions.width, canvasDimensions.height);
    const minScale = Math.max(0.3, minCanvasScale / 200);
    const maxScale = Math.ceil(minCanvasScale / 20);
    const initialScale = Math.max(minScale, 3);

    const newSignSticker: Sticker = {
      id: `sign-${Date.now()}`,
      type: 'sign',
      signType,
      x: canvasDimensions.width / 2,
      y: canvasDimensions.height / 2,
      rotation: 0,
      scale: initialScale,
      minScale,
      maxScale,
      color: '#000000',
      color2: '#000000',
    };

    setStickers([...stickers, newSignSticker]);
    setSelectedSticker(newSignSticker.id);
    setShowSignSelector(false);
  };

  const addOtherSticker = (stickerFile: string) => {
    const minCanvasScale = Math.min(canvasDimensions.width, canvasDimensions.height);
    const minScale = Math.max(0.3, minCanvasScale / 200);
    const maxScale = Math.ceil(minCanvasScale / 20);
    const initialScale = Math.max(minScale, 3) * 4;

    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      stickerType: stickerFile,
      x: canvasDimensions.width / 2,
      y: canvasDimensions.height / 2,
      rotation: 0,
      scale: initialScale,
      minScale,
      maxScale,
      color: '#000000',
      color2: '#000000',
    };

    setStickers([...stickers, newSticker]);
    setSelectedSticker(newSticker.id);
    setShowStickersSelector(false);
  };

  const deleteSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
    if (selectedSticker === id) {
      setSelectedSticker(null);
      setShowTextColorPicker(false);
    }
  };

  const toggleVehicleType = (id: string) => {
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;

    const vehicleTypes: ('car' | 'truck' | 'motorcycle')[] = ['car', 'truck', 'motorcycle'];
    const currentIndex = vehicleTypes.indexOf(sticker.vehicleCategory || 'car');
    const nextIndex = (currentIndex + 1) % vehicleTypes.length;
    
    updateSticker(id, { vehicleCategory: vehicleTypes[nextIndex] });
  };

  const getVehicleEmoji = (vehicleType: 'car' | 'truck' | 'motorcycle'): string => {
    switch (vehicleType) {
      case 'car':
        return '🚗';
      case 'truck':
        return '🚚';
      case 'motorcycle':
        return '🏍️';
      default:
        return '🔄';
    }
  };

  const getNextVehicleEmoji = (currentVehicle: 'car' | 'truck' | 'motorcycle'): string => {
    const vehicleTypes: ('car' | 'truck' | 'motorcycle')[] = ['car', 'truck', 'motorcycle'];
    const currentIndex = vehicleTypes.indexOf(currentVehicle);
    const nextIndex = (currentIndex + 1) % vehicleTypes.length;
    return getVehicleEmoji(vehicleTypes[nextIndex]);
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
      setShowSignSelector(false);
      setShowStickersSelector(false);
    } else {
      setSelectedSticker(null);
      setShowTextColorPicker(false);
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
    // Handle pinch gesture with 2 touches
    if (e.touches.length === 2 && selectedSticker) {
      e.preventDefault();
      const touch1 = getTouchCanvasCoordinates(e.touches[0]);
      const touch2 = getTouchCanvasCoordinates(e.touches[1]);
      const distance = Math.hypot(touch2.x - touch1.x, touch2.y - touch1.y);
      
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        setIsPinchScaling(true);
        setInitialPinchDistance(distance);
        setPinchStartScale(sticker.scale);
      }
      return;
    }

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
        setIsRotatingSticker(true);
      }
      return;
    }

    // Check if touching inside the sticker (for dragging)
    if (isPointInsideSticker(x, y) && selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
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
      setSelectedSticker(touchedSticker.id);
      setShowSignSelector(false);
      setShowStickersSelector(false);
      
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
    // Handle pinch scaling with 2 touches
    if (e.touches.length === 2 && isPinchScaling && selectedSticker) {
      const touch1 = getTouchCanvasCoordinates(e.touches[0]);
      const touch2 = getTouchCanvasCoordinates(e.touches[1]);
      const distance = Math.hypot(touch2.x - touch1.x, touch2.y - touch1.y);
      
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker && initialPinchDistance > 0) {
        const scaleFactor = distance / initialPinchDistance;
        const newScale = pinchStartScale * scaleFactor;
        const clampedScale = Math.max(sticker.minScale, Math.min(sticker.maxScale, newScale));
        updateSticker(selectedSticker, { scale: clampedScale });
      }
      return;
    }

    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const coords = getTouchCanvasCoordinates(touch);
    const { x, y } = coords;

    // Handle rotation
    if (isRotatingSticker && selectedSticker) {
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
      const newX = Math.max(20, Math.min(canvasDimensions.width - 20, x + dragOffset.x));
      const newY = Math.max(20, Math.min(canvasDimensions.height - 20, y + dragOffset.y));
      updateSticker(selectedSticker, { x: newX, y: newY });
    }
  };

  const handleStickerTouchEnd = () => {
    setIsDraggingSticker(false);
    setIsRotatingSticker(false);
    setIsPinchScaling(false);
    setInitialPinchDistance(0);
    setPinchStartScale(0);
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
                cursor: drawingTool === 'pen' ? 'crosshair' : (selectedTool === 'text' ? 'text' : (selectedSticker ? 'grab' : 'default')),
                touchAction: 'none',
              }}
            />
          </div>

          <div className="situation-draw-controls-panel">
            {/* Scrollable section for tools and controls */}
            <div className="controls-scrollable-area">
              {/* Drawing tools */}
              <div className="drawing-tools">
                <div className="tools-title">
                  {t('situation.controls')}
                </div>
                <div className="tool-row">
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
                    title={t('situation.tools.pen')}
                    aria-label="Pen tool"
                  >
                    ✏️
                  </button>
                  <span className="tool-label">{t('situation.labels.pen')}</span>
                </div>
                <div className="tool-row">
                  <button
                    className="btn-tool btn-sticker-a"
                    onClick={() => addSticker('vehicleA', '#ADD8E6', '#0066cc')}
                    type="button"
                    title={t('situation.tools.vehicleA')}
                    aria-label="Vehicle A sticker"
                    disabled={stickers.some(s => s.type === 'vehicleA')}
                  >
                    A
                  </button>
                  <span className="tool-label">{t('situation.labels.vehicleA')}</span>
                </div>
                <div className="tool-row">
                  <button
                    className="btn-tool btn-sticker-b"
                    onClick={() => addSticker('vehicleB', '#FFFFE0', '#cc8800')}
                    type="button"
                    title={t('situation.tools.vehicleB')}
                    aria-label="Vehicle B sticker"
                    disabled={stickers.some(s => s.type === 'vehicleB')}
                  >
                    B
                  </button>
                  <span className="tool-label">{t('situation.labels.vehicleB')}</span>
                </div>
                <div className="tool-row">
                  <button
                    className="btn-tool"
                    onClick={() => {
                      const userText = prompt(t('situation.prompts.enterText'));
                      if (userText && userText.trim()) {
                        addTextSticker(userText, canvasDimensions.width / 2, canvasDimensions.height / 2);
                      }
                      setDrawingTool(null);
                    }}
                    type="button"
                    title={t('situation.tools.text')}
                    aria-label="Text tool"
                  >
                    T
                  </button>
                  <span className="tool-label">{t('situation.labels.customText')}</span>
                </div>
                <div className="tool-row">
                  <button
                    className="btn-tool"
                    onClick={() => addArrowSticker()}
                    type="button"
                    title={t('situation.tools.arrow')}
                    aria-label="Arrow tool"
                  >
                    <span className="arrow-icon">⇧</span>
                  </button>
                  <span className="tool-label">{t('situation.labels.arrow')}</span>
                </div>
                <div className="tool-row">
                  <button
                    className="btn-tool"
                    onClick={() => setShowSignSelector(!showSignSelector)}
                    type="button"
                    title={t('situation.tools.sign')}
                    aria-label="Traffic signs tool"
                  >
                    🚸
                  </button>
                  <span className="tool-label">{t('situation.labels.trafficSign')}</span>
                </div>
                <div className="tool-row">
                  <button
                    className="btn-tool"
                    onClick={() => setShowStickersSelector(!showStickersSelector)}
                    type="button"
                    title={t('situation.tools.stickers')}
                    aria-label="Objects tool"
                  >
                    🌳
                  </button>
                  <span className="tool-label">{t('situation.labels.objects')}</span>
                </div>
              </div>
              {/* Tool controls panel */}
              {(selectedTool || selectedSticker || showSignSelector || showStickersSelector) && (
                <div className="tool-controls-panel">
                  <div className="tool-controls-header">
                    <span className="tool-controls-title">
                      {selectedTool === 'pen' && `✏️ ${t('situation.labels.pen')}`}
                      {showSignSelector && `🚸 ${t('situation.labels.trafficSign')}`}
                      {showStickersSelector && `🌳 ${t('situation.labels.objects')}`}
                      {selectedSticker && (
                        stickers.find(s => s.id === selectedSticker)?.type === 'text' ? `T ${t('situation.labels.customText')}` : 
                        stickers.find(s => s.id === selectedSticker)?.type === 'arrow' ? (<><span className="arrow-icon">⇧</span> {t('situation.labels.arrow')}</>) :
                        stickers.find(s => s.id === selectedSticker)?.type === 'sign' ? (
                          (() => {
                            const signFile = stickers.find(s => s.id === selectedSticker)?.signType;
                            const sign = SIGNS.find(s => s.file === signFile);
                            return sign ? (
                              <><img src={`data:image/svg+xml;base64,${sign.data}`} alt={sign.name} className="sign-title-icon" /> {t(`situation.signs.${sign.name.toLowerCase()}`) || sign.name}</>
                            ) : (
                              <>{t('situation.labels.trafficSign')}</>
                            );
                          })()
                        ) :
                        stickers.find(s => s.id === selectedSticker)?.type === 'sticker' ? (
                          (() => {
                            const stickerFile = stickers.find(s => s.id === selectedSticker)?.stickerType;
                            const sticker = OTHER_STICKERS.find(s => s.file === stickerFile);
                            return sticker ? (
                              <><img src={`data:image/svg+xml;base64,${sticker.data}`} alt={sticker.name} className="sign-title-icon" /> {t(`situation.stickers.${sticker.name.toLowerCase()}`) || sticker.name}</>
                            ) : (
                              <>🏠 Object</>
                            );
                          })()
                        ) :
                        (
                          stickers.find(s => s.id === selectedSticker)?.type === 'vehicleA' ? `🚗 ${t('situation.labels.vehicleA')}` : `🚗 ${t('situation.labels.vehicleB')}`
                        )
                      )}
                    </span>
                    <button
                      className="btn-close-tool-controls"
                      onClick={() => {
                        setDrawingTool(null);
                        setSelectedTool(null);
                        setSelectedSticker(null);
                        setShowTextColorPicker(false);
                        setShowSignSelector(false);
                        setShowStickersSelector(false);
                      }}
                      type="button"
                      title={t('common.close') || 'Close'}
                      aria-label="Close tool controls"
                    >
                      ✓
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

                    {showSignSelector && (
                      <div className="sign-selector-panel">
                        {SIGNS.length > 0 ? (
                          <div className="sign-selector-grid">
                            {SIGNS.map((sign) => {
                              const imgSrc = `data:image/svg+xml;base64,${sign.data}`;
                              return (
                                <button
                                  key={sign.file}
                                  className="sign-selector-button"
                                  onClick={() => addSignSticker(sign.file)}
                                  type="button"
                                  title={sign.name}
                                >
                                  <img src={imgSrc} alt={sign.name} className="sign-selector-icon" />
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="sign-selector-empty">
                            <p>No signs available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {showStickersSelector && (
                      <div className="stickers-selector-panel">
                        {OTHER_STICKERS.length > 0 ? (
                          <div className="stickers-selector-grid">
                            {OTHER_STICKERS.map((sticker) => {
                              const imgSrc = `data:image/svg+xml;base64,${sticker.data}`;
                              return (
                                <button
                                  key={sticker.file}
                                  className="stickers-selector-button"
                                  onClick={() => addOtherSticker(sticker.file)}
                                  type="button"
                                  title={t(`situation.stickers.${sticker.name.toLowerCase()}`) || sticker.name}
                                >
                                  <img src={imgSrc} alt={sticker.name} className="stickers-selector-icon" />
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="stickers-selector-empty">
                            <p>No stickers available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedSticker && (
                      <div className="sticker-controls">
                        {showTextColorPicker && selectedSticker && (stickers.find(s => s.id === selectedSticker)?.type === 'text' || stickers.find(s => s.id === selectedSticker)?.type === 'arrow') ? (
                          <div className="text-color-picker-panel">
                            <div className="color-swatches">
                              {[
                                '#000000', '#ffffff', '#FF0000', '#00AA00', '#0066CC',
                                '#FFAA00', '#FF5500', '#AA00FF', '#00AAAA', '#AA0055',
                                '#555555', '#AAAAAA', '#FF6666', '#66FF66', '#6666FF',
                                '#FFFF66', '#FF66FF', '#66FFFF', '#FFB366', '#9966FF',
                                '#66FF99', '#FF9999', '#9966CC', '#99CCFF', '#FFCC99',
                                '#CC99FF', '#99FFCC', '#FF99CC',
                              ].map((color) => (
                                <button
                                  key={color}
                                  className={`color-swatch ${stickers.find(s => s.id === selectedSticker)?.color === color ? 'active' : ''}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    updateSticker(selectedSticker, { color });
                                    setShowTextColorPicker(false);
                                  }}
                                  title={color}
                                  type="button"
                                  aria-label={`Color ${color}`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
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
                              
                              {/* Row 2: Move Left | Toggle Vehicle | Move Right */}
                              <button onClick={() => {
                                const sticker = stickers.find(s => s.id === selectedSticker);
                                if (sticker) updateSticker(selectedSticker, { x: Math.max(0, sticker.x - 5) });
                              }} type="button" title="Move left">←</button>
                              {selectedSticker && (stickers.find(s => s.id === selectedSticker)?.type === 'vehicleA' || stickers.find(s => s.id === selectedSticker)?.type === 'vehicleB') ? (
                                <button onClick={() => {
                                  if (selectedSticker) toggleVehicleType(selectedSticker);
                                }} type="button" title="Toggle vehicle type" className="btn-toggle-vehicle">
                                  <div className="vehicle-toggle-content">
                                    <div className="vehicle-icon">
                                      {selectedSticker && stickers.find(s => s.id === selectedSticker) 
                                        ? getNextVehicleEmoji(stickers.find(s => s.id === selectedSticker)!.vehicleCategory as 'car' | 'truck' | 'motorcycle')
                                        : '🚗'}
                                    </div>
                                    <div className="rotate-arrow">⟳</div>
                                  </div>
                                </button>
                              ) : selectedSticker && (stickers.find(s => s.id === selectedSticker)?.type === 'text' || stickers.find(s => s.id === selectedSticker)?.type === 'arrow') ? (
                                <button onClick={() => {
                                  setShowTextColorPicker(!showTextColorPicker);
                                }} type="button" title="Change color" className="btn-color-picker">
                                  🎨
                                </button>
                              ) : (
                                <div style={{ visibility: 'hidden' }}></div>
                              )}
                              <button onClick={() => {
                                const sticker = stickers.find(s => s.id === selectedSticker);
                                if (sticker) updateSticker(selectedSticker, { x: Math.min(canvasDimensions.width, sticker.x + 5) });
                              }} type="button" title="Move right">→</button>
                              
                              {/* Row 3: Scale Down | Move Down | Scale Up */}
                              <button onClick={() => {
                                const sticker = stickers.find(s => s.id === selectedSticker);
                                if (sticker) updateSticker(selectedSticker, { scale: Math.max(sticker.minScale, sticker.scale - 0.4) });
                              }} type="button" title="Scale down">−</button>
                              <button onClick={() => {
                                const sticker = stickers.find(s => s.id === selectedSticker);
                                if (sticker) updateSticker(selectedSticker, { y: Math.min(canvasDimensions.height, sticker.y + 5) });
                              }} type="button" title="Move down">↓</button>
                              <button onClick={() => {
                                const sticker = stickers.find(s => s.id === selectedSticker);
                                if (sticker) updateSticker(selectedSticker, { scale: Math.min(sticker.maxScale, sticker.scale + 0.4) });
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
                          </>
                        )}
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
                💾
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
