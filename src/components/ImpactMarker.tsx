import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ImpactMarker.css';

export interface ImpactArrow {
  id: string;
  x: number;
  y: number;
  rotation: number; // in degrees
}

interface ImpactMarkerProps {
  arrows: ImpactArrow[];
  onArrowsChange: (arrows: ImpactArrow[]) => void;
}

const ARROW_SIZE = 20; // Increased from 10 (2x original size)

export const ImpactMarker: React.FC<ImpactMarkerProps> = ({
  arrows,
  onArrowsChange,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null);
  const [rotatingArrowId, setRotatingArrowId] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const touchStartCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchScrollingRef = useRef(false);
  const wasDraggingRef = useRef(false);
  const selectedArrowIdRef = useRef<string | null>(null);
  const justHandledTouchRef = useRef(false);

  // Load background image
  useEffect(() => {
    const img = new Image();
    const basePath = import.meta.env.BASE_URL || '/';
    img.src = basePath + 'impactMarker-background.png?t=' + Date.now();
    img.onload = () => {
      imgRef.current = img;
      redrawCanvas();
    };
    img.onerror = () => {
      console.error('Failed to load vehicle background from ' + basePath + 'impactMarker-background.png');
    };
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    selectedArrowIdRef.current = selectedArrowId;
  }, [selectedArrowId]);

  // Redraw canvas whenever arrows change or selection changes
  useEffect(() => {
    redrawCanvas();
  }, [arrows, selectedArrowId]);

  // Attach touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touchStartHandler = (e: TouchEvent) => handleCanvasTouchStart(e);
    const touchMoveHandler = (e: TouchEvent) => handleCanvasTouchMove(e);
    const touchEndHandler = () => handleCanvasTouchEnd();

    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
    };
  }, [arrows, selectedArrowId, isDragging, rotatingArrowId, dragOffset, isEditable]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image if loaded (scaled to 90% with centered positioning)
    if (imgRef.current) {
      const imgScale = 0.9;
      const imgWidth = canvas.width * imgScale;
      const imgHeight = canvas.height * imgScale;
      const offsetX = (canvas.width - imgWidth) / 2;
      const offsetY = (canvas.height - imgHeight) / 2;
      ctx.drawImage(imgRef.current, offsetX, offsetY, imgWidth, imgHeight);
    }

    // Draw all arrows
    arrows.forEach((arrow) => {
      const isSelected = arrow.id === selectedArrowId;
      drawArrow(ctx, arrow, isSelected);
    });
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    arrow: ImpactArrow,
    isSelected: boolean
  ) => {
    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate((arrow.rotation * Math.PI) / 180);

    // Draw selection ring if selected
    if (isSelected) {
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ARROW_SIZE * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw arrow (pointing up)
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 1;

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(0, -ARROW_SIZE);
    ctx.lineTo(-ARROW_SIZE * 0.5, ARROW_SIZE * 0.5);
    ctx.lineTo(0, ARROW_SIZE * 0.3);
    ctx.lineTo(ARROW_SIZE * 0.5, ARROW_SIZE * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(0, ARROW_SIZE * 0.3);
    ctx.lineTo(0, ARROW_SIZE);
    ctx.stroke();

    ctx.restore();
  };

  const getArrowAtPoint = (x: number, y: number): ImpactArrow | null => {
    // Check in reverse order so top arrows are selected first
    for (let i = arrows.length - 1; i >= 0; i--) {
      const arrow = arrows[i];
      const distance = Math.hypot(arrow.x - x, arrow.y - y);
      // Increase hitbox for easier selection (30px radius)
      if (distance <= 30) {
        return arrow;
      }
    }
    return null;
  };

  const getRotationHandleAtPoint = (x: number, y: number): boolean => {
    if (!selectedArrowId) return false;

    const selectedArrow = arrows.find((a) => a.id === selectedArrowId);
    if (!selectedArrow) return false;

    // Selection ring radius
    const ringRadius = ARROW_SIZE * 1.5;
    // Invisible rotation region thickness (distance from ring center)
    const rotationRegionWidth = 15; // pixels on either side of the ring

    // Distance from mouse to arrow center
    const distance = Math.hypot(selectedArrow.x - x, selectedArrow.y - y);

    // Check if point is within the invisible rotation region around the selection ring circumference
    return distance >= ringRadius - rotationRegionWidth && distance <= ringRadius + rotationRegionWidth;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isEditable) return;

    // Don't process click if we just handled a touch event
    if (justHandledTouchRef.current) {
      justHandledTouchRef.current = false;
      return;
    }

    // Don't create new arrow while rotating
    if (rotatingArrowId) return;
    
    // Don't process click if we just finished dragging
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    
    // Don't create if the last touch was a scroll
    if (isTouchScrollingRef.current) return;

    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to match canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking on existing arrow
    const clickedArrow = getArrowAtPoint(x, y);

    if (clickedArrow) {
      // Just select the arrow, don't start dragging yet
      setSelectedArrowId(clickedArrow.id);
      setIsDragging(false); // Don't start dragging on click
    } else {
      // If an arrow is already selected, deselect it first
      // Don't create a new arrow immediately
      if (selectedArrowIdRef.current) {
        setSelectedArrowId(null);
      } else {
        // Create new arrow at exact click position (only if nothing was selected)
        const newArrow: ImpactArrow = {
          id: `arrow-${Date.now()}-${Math.random()}`,
          x,
          y,
          rotation: 0,
        };
        onArrowsChange([...arrows, newArrow]);
        setSelectedArrowId(newArrow.id);
      }
      setIsDragging(false);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isEditable) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking on rotation region (circumference around selection ring)
    const isOnRotationRegion = getRotationHandleAtPoint(x, y);
    if (isOnRotationRegion && selectedArrowId) {
      setRotatingArrowId(selectedArrowId);
      canvas.style.cursor = 'grabbing';
      return;
    }

    // Only start dragging if an arrow is already selected and we're clicking on it
    if (!selectedArrowId) return;

    // Check if mouse down is on the selected arrow
    const clickedArrow = getArrowAtPoint(x, y);
    if (clickedArrow && clickedArrow.id === selectedArrowId) {
      wasDraggingRef.current = false; // Reset before starting new drag
      setIsDragging(true);
      setDragOffset({
        x: clickedArrow.x - x,
        y: clickedArrow.y - y,
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to match canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Handle rotation by dragging rotation handles
    if (rotatingArrowId) {
      const selectedArrow = arrows.find((a) => a.id === rotatingArrowId);
      if (selectedArrow) {
        // Calculate angle from arrow center to current mouse position
        const dx = x - selectedArrow.x;
        const dy = y - selectedArrow.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Calculate the initial angle (90 degrees offset because arrow points up)
        const newRotation = (angle - 90 + 360) % 360;

        const updatedArrows = arrows.map((arrow) =>
          arrow.id === rotatingArrowId ? { ...arrow, rotation: newRotation } : arrow
        );
        onArrowsChange(updatedArrows);
      }
      return;
    }

    // Check if hovering over rotation region
    const isOnRotationRegion = getRotationHandleAtPoint(x, y);
    if (isOnRotationRegion) {
      canvas.style.cursor = 'grab';
      return;
    }

    // Check if hovering over any arrow
    const hoveredArrow = getArrowAtPoint(x, y);
    if (hoveredArrow) {
      setHoveredArrowId(hoveredArrow.id);
      canvas.style.cursor = 'grab'; // Change cursor to grab hand
    } else {
      setHoveredArrowId(null);
      canvas.style.cursor = isDragging ? 'grabbing' : 'crosshair';
    }

    // Handle dragging
    if (isDragging && selectedArrowId) {
      wasDraggingRef.current = true;
      const updatedArrows = arrows.map((arrow) =>
        arrow.id === selectedArrowId
          ? {
              ...arrow,
              x: x + dragOffset.x,
              y: y + dragOffset.y,
            }
          : arrow
      );
      onArrowsChange(updatedArrows);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      wasDraggingRef.current = true;
    }
    setIsDragging(false);
    setRotatingArrowId(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = hoveredArrowId ? 'grab' : 'crosshair';
    }
  };

  const handleRotateLeft = () => {
    if (!selectedArrowId) return;
    const updatedArrows = arrows.map((arrow) =>
      arrow.id === selectedArrowId
        ? {
            ...arrow,
            rotation: (arrow.rotation - 15 + 360) % 360,
          }
        : arrow
    );
    onArrowsChange(updatedArrows);
  };

  const handleRotateRight = () => {
    if (!selectedArrowId) return;
    const updatedArrows = arrows.map((arrow) =>
      arrow.id === selectedArrowId
        ? {
            ...arrow,
            rotation: (arrow.rotation + 15) % 360,
          }
        : arrow
    );
    onArrowsChange(updatedArrows);
  };

  const handleDeleteSelected = () => {
    if (!selectedArrowId) return;
    const updatedArrows = arrows.filter((arrow) => arrow.id !== selectedArrowId);
    onArrowsChange(updatedArrows);
    setSelectedArrowId(null);
  };

  const handleDone = () => {
    setSelectedArrowId(null);
    setIsEditable(false);
  };

  const handleEdit = () => {
    setIsEditable(true);
  };

  const handleClearAll = () => {
    onArrowsChange([]);
    setSelectedArrowId(null);
  };

  // Touch event handlers (for mobile/tablet support)
  const getTouchCoordinates = (e: TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches.length) return null;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const handleCanvasTouchStart = (e: TouchEvent) => {
    const coords = getTouchCoordinates(e);
    if (!coords) return;

    const { x, y } = coords;
    
    // Store initial touch coordinates to detect scrolling
    touchStartCoordsRef.current = { x, y };
    isTouchScrollingRef.current = false;

    // If locked, don't process interactions
    if (!isEditable) return;

    // Check if touching rotation region
    const isOnRotationRegion = getRotationHandleAtPoint(x, y);
    if (isOnRotationRegion && selectedArrowId) {
      e.preventDefault();
      setRotatingArrowId(selectedArrowId);
      return;
    }

    // Check if touching existing arrow
    const touchedArrow = getArrowAtPoint(x, y);
    if (touchedArrow) {
      e.preventDefault();
      // If it's the already selected arrow, prepare to drag
      if (touchedArrow.id === selectedArrowId) {
        setIsDragging(true);
        setDragOffset({
          x: touchedArrow.x - x,
          y: touchedArrow.y - y,
        });
      } else {
        // Select a different arrow
        setSelectedArrowId(touchedArrow.id);
      }
      return;
    }

    // Touching empty space - defer preventDefault until we know it's not a scroll
  };

  const handleCanvasTouchMove = (e: TouchEvent) => {
    const coords = getTouchCoordinates(e);
    if (!coords) return;

    const { x, y } = coords;

    // Detect if this is a scroll/swipe by checking distance from initial touch point
    // But NOT if we've already started rotating or dragging
    if (touchStartCoordsRef.current && !isTouchScrollingRef.current && !rotatingArrowId && !isDragging) {
      const dx = x - touchStartCoordsRef.current.x;
      const dy = y - touchStartCoordsRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If movement is greater than 5px, it's a scroll/swipe, not a tap
      if (distance > 5) {
        isTouchScrollingRef.current = true;
        return; // Allow scroll to proceed
      }
    }

    // If it's being detected as a scroll, don't prevent default
    if (isTouchScrollingRef.current) {
      return;
    }

    e.preventDefault();

    // Handle rotation
    if (rotatingArrowId) {
      const selectedArrow = arrows.find((a) => a.id === rotatingArrowId);
      if (selectedArrow) {
        const dx = x - selectedArrow.x;
        const dy = y - selectedArrow.y;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        angle = (angle + 360) % 360;

        const updatedArrows = arrows.map((arrow) =>
          arrow.id === rotatingArrowId
            ? { ...arrow, rotation: Math.round(angle) }
            : arrow
        );
        onArrowsChange(updatedArrows);
      }
      return;
    }

    // Handle dragging
    if (isDragging && selectedArrowId) {
      const updatedArrows = arrows.map((arrow) =>
        arrow.id === selectedArrowId
          ? {
              ...arrow,
              x: x + dragOffset.x,
              y: y + dragOffset.y,
            }
          : arrow
      );
      onArrowsChange(updatedArrows);
    }
  };

  const handleCanvasTouchEnd = () => {
    // Mark that we handled a touch to prevent click from firing
    justHandledTouchRef.current = true;

    // Don't process touch end if we were dragging - the arrow should stay selected
    if (isDragging) {
      setIsDragging(false);
      setRotatingArrowId(null);
      touchStartCoordsRef.current = null;
      isTouchScrollingRef.current = false;
      return;
    }

    // Only create new markers if editable and it wasn't a scroll
    if (isEditable && !isTouchScrollingRef.current && touchStartCoordsRef.current) {
      const coords = touchStartCoordsRef.current;
      const { x, y } = coords;

      // Check if touching empty space (not on an arrow or rotation handle)
      const touchedArrow = getArrowAtPoint(x, y);
      const isOnRotationRegion = getRotationHandleAtPoint(x, y);

      // Only create a new marker if in empty space
      if (!touchedArrow && !isOnRotationRegion) {
        if (selectedArrowIdRef.current) {
          // Deselect if something was selected
          setSelectedArrowId(null);
        } else {
          // Create new arrow only if nothing was selected and it's not a scroll
          const newArrow: ImpactArrow = {
            id: `arrow-${Date.now()}-${Math.random()}`,
            x,
            y,
            rotation: 0,
          };
          onArrowsChange([...arrows, newArrow]);
          setSelectedArrowId(newArrow.id);
        }
      }
    }

    // Always clean up dragging and rotating state
    setIsDragging(false);
    setRotatingArrowId(null);
    touchStartCoordsRef.current = null;
    isTouchScrollingRef.current = false;
  };

  return (
    <div className="impact-marker-container">
      {isEditable && (
        <div className="impact-marker-info">
          <p>{t('vehicle.impactMarkerInfo') || 'Click on the image to add impact markers. Click on a marker to select it.'}</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={600}
        height={450}
        className="impact-marker-canvas"
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />

      <div className="impact-marker-controls">
        {isEditable && selectedArrowId && (
          <>
            <button
              type="button"
              className="btn-small"
              onClick={handleRotateLeft}
              title={t('vehicle.rotateLeft') || 'Rotate Left'}
            >
              ↶ {t('vehicle.rotateLeft') || 'Rotate Left'}
            </button>
            <button
              type="button"
              className="btn-small"
              onClick={handleRotateRight}
              title={t('vehicle.rotateRight') || 'Rotate Right'}
            >
              {t('vehicle.rotateRight') || 'Rotate Right'} ↷
            </button>
            <button
              type="button"
              className="btn-small btn-delete"
              onClick={handleDeleteSelected}
              title={t('vehicle.deleteMarker') || 'Delete Selected Marker'}
            >
              {t('vehicle.deleteMarker') || 'Delete'}
            </button>
          </>
        )}
        {!isEditable && (
          <button
            type="button"
            className="btn-small"
            onClick={handleEdit}
            title={t('vehicle.editMarkers') || 'Edit Markers'}
          >
            {t('vehicle.editMarkers') || 'Edit'}
          </button>
        )}
        {isEditable && (
          <button
            type="button"
            className="btn-small"
            onClick={handleDone}
            title={t('common.done') || 'Done'}
          >
            ✓ {t('common.done') || 'Done'}
          </button>
        )}
        {isEditable && arrows.length > 0 && (
          <button
            type="button"
            className="btn-small btn-delete"
            onClick={handleClearAll}
            title={t('vehicle.clearAllMarkers') || 'Clear All Markers'}
          >
            {t('vehicle.clearAllMarkers') || 'Clear All'}
          </button>
        )}
      </div>

      {isEditable && (
        <div className="impact-marker-status">
          {t('vehicle.totalMarkers') || 'Total markers'}: {arrows.length}
          {selectedArrowId && <span> | {t('vehicle.selected') || 'Selected'}</span>}
        </div>
      )}
    </div>
  );
};
