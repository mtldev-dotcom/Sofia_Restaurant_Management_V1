import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import CanvasElement from "@/components/CanvasElement";
import { snapToGrid } from "@/lib/utils";
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Copy, 
  Layers, 
  SendToBack, 
  ZoomIn, 
  ZoomOut,
  Grid3x3
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

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
    canRedo,
    background
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
      <div className="bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={!canUndo}
                  onClick={undo}
                  className="rounded-md"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={!canRedo}
                  onClick={redo}
                  className="rounded-md"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={!selectedElement}
                  onClick={deleteSelectedElement}
                  className="rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={!selectedElement}
                  onClick={duplicateSelectedElement}
                  className="rounded-md"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={!selectedElement}
                  onClick={bringForward}
                  className="rounded-md"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bring Forward</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={!selectedElement}
                  onClick={sendBackward}
                  className="rounded-md"
                >
                  <SendToBack className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send Backward</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleZoomOut}
                    className="rounded-md"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <span className="mx-2 text-sm text-muted-foreground font-medium w-12 text-center">{zoom}%</span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleZoomIn}
                    className="rounded-md"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-2">
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
            <Switch 
              id="grid-snap"
              checked={gridSnap}
              onCheckedChange={setGridSnap}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>

      {/* Canvas Editor Area */}
      <div className="flex-1 overflow-auto relative bg-muted p-6">
        <div 
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseUp={handleCanvasInteraction}
          className="canvas-container w-full h-full relative shadow-md overflow-hidden rounded-md" 
          style={{
            backgroundColor: background.color,
            backgroundImage: background.type === 'image' && background.imageUrl 
              ? `url(${background.imageUrl})`
              : background.showGrid 
                ? `
                  linear-gradient(to right, ${background.gridColor} 1px, transparent 1px),
                  linear-gradient(to bottom, ${background.gridColor} 1px, transparent 1px)
                `
                : 'none',
            backgroundSize: background.type === 'image' ? 'cover' : `${background.gridSize * (zoom / 100)}px ${background.gridSize * (zoom / 100)}px`,
            backgroundPosition: 'center',
            backgroundRepeat: background.type === 'image' ? 'no-repeat' : 'repeat',
            opacity: background.opacity,
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