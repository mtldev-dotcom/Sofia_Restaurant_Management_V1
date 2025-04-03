import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import CanvasElement from "@/components/CanvasElement";
import { snapToGrid } from "@/lib/utils";

const EditorPanel = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [gridSnap, setGridSnap] = useState(true);
  
  const { 
    elements, 
    dragElement, 
    addElement, 
    deleteSelectedElement, 
    duplicateSelectedElement,
    selectedElement,
    selectElement,
    bringForward,
    sendBackward,
    undo,
    redo,
    canUndo,
    canRedo
  } = useFloorPlanStore();
  
  // Handle canvas interaction for dragging new elements
  const handleCanvasInteraction = (e: React.MouseEvent) => {
    if (!dragElement) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Adjust for zoom
    x = (x / (zoom / 100));
    y = (y / (zoom / 100));
    
    // Snap to grid if enabled
    if (gridSnap) {
      x = snapToGrid(x, 20);
      y = snapToGrid(y, 20);
    }
    
    // Center the element on cursor
    x = x - (dragElement.width / 2);
    y = y - (dragElement.height / 2);
    
    addElement({
      id: Date.now().toString(),
      x,
      y,
      width: dragElement.width,
      height: dragElement.height,
      rotation: 0,
      type: dragElement.type,
      category: dragElement.category,
      color: 'white',
      name: `${dragElement.category.charAt(0).toUpperCase() + dragElement.category.slice(1)} #${elements.length + 1}`,
      isRound: dragElement.isRound || false,
      zIndex: elements.length
    });
    
    // Reset drag element
    useFloorPlanStore.getState().endDrag();
  };
  
  // Zoom functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  
  // Mouse up handler to cancel dragging
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);
  
  // Handle clicks outside of elements to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Editor Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            disabled={!canUndo}
            onClick={undo}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14 4 9l5-5"></path>
              <path d="M4 9h10a5 5 0 0 1 5 5v6"></path>
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            disabled={!canRedo}
            onClick={redo}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 14 5-5-5-5"></path>
              <path d="M20 9H10a5 5 0 0 0-5 5v6"></path>
            </svg>
          </Button>
          <div className="h-6 border-l border-gray-300 mx-2"></div>
          <Button 
            variant="ghost" 
            size="icon"
            disabled={!selectedElement}
            onClick={deleteSelectedElement}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            disabled={!selectedElement}
            onClick={duplicateSelectedElement}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
            </svg>
          </Button>
          <div className="h-6 border-l border-gray-300 mx-2"></div>
          <Button 
            variant="ghost" 
            size="icon"
            disabled={!selectedElement}
            onClick={bringForward}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="4" width="12" height="12" rx="2" ry="2"></rect>
              <rect x="4" y="8" width="12" height="12" rx="2" ry="2"></rect>
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            disabled={!selectedElement}
            onClick={sendBackward}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="12" height="12" rx="2" ry="2"></rect>
              <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
            </svg>
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </Button>
            <span className="mx-2 text-sm text-gray-600">{zoom}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </Button>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Snap to Grid</span>
            <button 
              onClick={() => setGridSnap(!gridSnap)}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${gridSnap ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
              <span 
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${gridSnap ? 'translate-x-5' : 'translate-x-0'}`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Editor Area */}
      <div className="flex-1 overflow-auto relative bg-gray-100 p-4">
        <div 
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseUp={handleCanvasInteraction}
          className="canvas-container w-full h-full relative bg-white shadow-md overflow-hidden" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(243, 244, 246, 0.5) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(243, 244, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            height: '800px',
            width: '1000px'
          }}
        >
          {elements.map((element) => (
            <CanvasElement 
              key={element.id}
              element={element}
              isSelected={selectedElement?.id === element.id}
              gridSnap={gridSnap}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;
