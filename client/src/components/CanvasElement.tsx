import { useState, useRef, useEffect } from "react";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { snapToGrid, rotatePoint } from "@/lib/utils";
import { FloorPlanElement } from "@/store/floorPlanStore";
import { cn } from "@/lib/utils";

interface CanvasElementProps {
  element: FloorPlanElement;
  isSelected: boolean;
  gridSnap: boolean;
}

const CanvasElement = ({ element, isSelected, gridSnap }: CanvasElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startRotation, setStartRotation] = useState(0);
  
  const { 
    selectElement, 
    updateElementProperty, 
    updateElement,
  } = useFloorPlanStore();
  
  // Element style
  const elementStyle: React.CSSProperties = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: `rotate(${element.rotation}deg)`,
    backgroundColor: getBackgroundColor(),
    zIndex: element.zIndex || 0,
    border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
    borderRadius: element.isRound ? '50%' : '4px',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isSelected 
      ? '0 0 0 2px hsl(var(--primary) / 0.2), 0 4px 8px hsl(var(--foreground) / 0.1)' 
      : '0 1px 3px hsl(var(--foreground) / 0.1)',
    userSelect: 'none',
    transition: 'box-shadow 0.2s ease',
  };
  
  function getBackgroundColor() {
    if (element.category === 'fixture') {
      if (element.type === 'plant') return '#DCFCE7'; // green-100
      if (element.type === 'wall') return '#D1D5DB'; // gray-300
      if (element.type === 'bar') return '#F3F4F6'; // gray-100
      return 'white';
    }
    
    // Use color from element if set, otherwise default to white
    return element.color || 'white';
  }

  // Handle mousedown event to start dragging, resizing, or rotating
  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize' | 'rotate', handle?: string) => {
    e.stopPropagation();
    
    // Select the element
    selectElement(element);
    
    if (action === 'drag') {
      setIsDragging(true);
      
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        setStartPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    } else if (action === 'resize' && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      
      setStartPos({
        x: e.clientX,
        y: e.clientY
      });
      
      setStartSize({
        width: element.width,
        height: element.height
      });
    } else if (action === 'rotate') {
      setIsRotating(true);
      
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate the initial angle between cursor and center
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setStartRotation(angle - element.rotation);
      }
    }
  };
  
  // Handle move events for the document
  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Update position while dragging
        if (elementRef.current) {
          const parent = elementRef.current.parentElement;
          if (!parent) return;
          
          const rect = parent.getBoundingClientRect();
          let newX = e.clientX - rect.left - startPos.x;
          let newY = e.clientY - rect.top - startPos.y;
          
          // Snap to grid if enabled
          if (gridSnap) {
            newX = snapToGrid(newX, 20);
            newY = snapToGrid(newY, 20);
          }
          
          updateElementProperty(element.id, 'x', newX);
          updateElementProperty(element.id, 'y', newY);
        }
      } else if (isResizing && resizeHandle) {
        // Update size while resizing
        if (elementRef.current) {
          const deltaX = e.clientX - startPos.x;
          const deltaY = e.clientY - startPos.y;
          
          // Apply resize based on handle
          let newWidth = startSize.width;
          let newHeight = startSize.height;
          
          switch (resizeHandle) {
            case 'nw':
              newWidth = startSize.width - deltaX;
              newHeight = startSize.height - deltaY;
              break;
            case 'ne':
              newWidth = startSize.width + deltaX;
              newHeight = startSize.height - deltaY;
              break;
            case 'sw':
              newWidth = startSize.width - deltaX;
              newHeight = startSize.height + deltaY;
              break;
            case 'se':
              newWidth = startSize.width + deltaX;
              newHeight = startSize.height + deltaY;
              break;
          }
          
          // Snap to grid if enabled
          if (gridSnap) {
            newWidth = snapToGrid(newWidth, 20);
            newHeight = snapToGrid(newHeight, 20);
          }
          
          // Ensure minimum size
          newWidth = Math.max(20, newWidth);
          newHeight = Math.max(20, newHeight);
          
          updateElementProperty(element.id, 'width', newWidth);
          updateElementProperty(element.id, 'height', newHeight);
        }
      } else if (isRotating) {
        // Update rotation
        if (elementRef.current) {
          const rect = elementRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // Calculate the current angle
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
          let newRotation = angle - startRotation;
          
          // Normalize to 0-360
          while (newRotation < 0) newRotation += 360;
          while (newRotation >= 360) newRotation -= 360;
          
          // Snap to common angles if grid snap is enabled
          if (gridSnap) {
            const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
            let closestAngle = snapAngles[0];
            let minDiff = Math.abs(newRotation - snapAngles[0]);
            
            for (let i = 1; i < snapAngles.length; i++) {
              const diff = Math.abs(newRotation - snapAngles[i]);
              if (diff < minDiff) {
                minDiff = diff;
                closestAngle = snapAngles[i];
              }
            }
            
            // Only snap if within 10 degrees
            if (minDiff < 10) {
              newRotation = closestAngle;
            }
          }
          
          updateElementProperty(element.id, 'rotation', newRotation);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setResizeHandle(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging, 
    isResizing, 
    isRotating, 
    startPos, 
    element.id, 
    resizeHandle, 
    gridSnap, 
    startSize, 
    startRotation,
    updateElementProperty
  ]);
  
  // Special rendering for chair elements
  const renderChairContent = () => {
    if (element.category !== 'chair') return null;
    
    if (element.type === 'stool') {
      return null; // Stool is just a circle
    } else if (element.type === 'booth') {
      return null; // Booth is just a rectangle
    } else {
      // Standard chair and armchair have a backrest
      return (
        <div 
          className="rounded-t-md bg-gray-200"
          style={{
            width: `${element.width * 0.75}px`,
            height: `${element.height * 0.75}px`
          }}
        ></div>
      );
    }
  };
  
  // Special rendering for fixture elements
  const renderFixtureContent = () => {
    if (element.category !== 'fixture') return null;
    
    if (element.type === 'plant') {
      return (
        <svg className="text-green-600 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 10c3.976 0 7-3.024 7-7H5c0 3.976 3.024 7 7 7z"></path>
          <path d="M12 10v10"></path>
          <path d="M12 10c-3.976 0-7-3.024-7-7"></path>
        </svg>
      );
    }
    
    return null;
  };
  
  return (
    <div
      ref={elementRef}
      className={cn(
        "element-container select-none flex items-center justify-center",
        isSelected && "element-selected"
      )}
      style={elementStyle}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
    >
      {/* Element content - can be different based on element type */}
      {renderChairContent()}
      {renderFixtureContent()}
      
      {/* Element name/label */}
      <span className="text-xs text-gray-600 pointer-events-none">
        {element.name}
      </span>
      
      {/* Transform handles - only show when selected */}
      {isSelected && (
        <>
          {/* Resize handles */}
          <div 
            className="element-handle resize-handle-nw" 
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--primary))',
              borderRadius: '50%',
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              cursor: 'nwse-resize',
              boxShadow: '0 0 0 1px hsl(var(--background))'
            }}
          ></div>
          <div 
            className="element-handle resize-handle-ne" 
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--primary))',
              borderRadius: '50%',
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              cursor: 'nesw-resize',
              boxShadow: '0 0 0 1px hsl(var(--background))'
            }}
          ></div>
          <div 
            className="element-handle resize-handle-sw" 
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--primary))',
              borderRadius: '50%',
              position: 'absolute',
              bottom: '-4px',
              left: '-4px',
              cursor: 'nesw-resize',
              boxShadow: '0 0 0 1px hsl(var(--background))'
            }}
          ></div>
          <div 
            className="element-handle resize-handle-se" 
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--primary))',
              borderRadius: '50%',
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              cursor: 'nwse-resize',
              boxShadow: '0 0 0 1px hsl(var(--background))'
            }}
          ></div>
          
          {/* Rotate handle */}
          <div 
            className="element-handle rotate-handle" 
            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: 'hsl(var(--primary))',
              border: '1px solid hsl(var(--primary))',
              borderRadius: '50%',
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              cursor: 'grab',
              boxShadow: '0 0 0 1px hsl(var(--background)), 0 2px 4px hsl(var(--foreground) / 0.1)'
            }}
          >
            <svg className="text-background w-3 h-3" style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasElement;
