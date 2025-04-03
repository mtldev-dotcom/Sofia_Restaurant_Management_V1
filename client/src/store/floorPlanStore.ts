import { create } from 'zustand';
import { FloorPlan } from '@shared/schema';

export interface FloorPlanElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: string; // e.g., 'square', 'round', 'stool'
  category: string; // e.g., 'table', 'chair', 'fixture'
  name: string;
  color?: string;
  isRound?: boolean; // Used for circular elements like round tables
  zIndex: number; // Used for layering elements
}

interface DragElement {
  type: string;
  category: string;
  width: number;
  height: number;
  isRound?: boolean;
}

interface FloorPlanState {
  // Current floor plan
  id: string | null;
  name: string;
  elements: FloorPlanElement[];
  selectedElement: FloorPlanElement | null;
  dragElement: DragElement | null;
  
  // History for undo/redo
  history: Array<FloorPlanElement[]>;
  historyIndex: number;
  
  // Actions
  setName: (name: string) => void;
  selectElement: (element: FloorPlanElement | null) => void;
  addElement: (element: FloorPlanElement) => void;
  updateElement: (element: FloorPlanElement) => void;
  updateElementProperty: (id: string, property: keyof FloorPlanElement, value: any) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElement: () => void;
  duplicateSelectedElement: () => void;
  startDrag: (element: DragElement) => void;
  endDrag: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  loadFloorPlan: (floorPlan: FloorPlan) => void;
  resetFloorPlan: () => void;
}

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
  id: null,
  name: '',
  elements: [],
  selectedElement: null,
  dragElement: null,
  history: [[]],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,
  
  setName: (name: string) => set({ name }),
  
  selectElement: (element: FloorPlanElement | null) => set({ selectedElement: element }),
  
  addElement: (element: FloorPlanElement) => {
    const { elements, history, historyIndex } = get();
    
    // Create a new history entry
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements, element]);
    
    set({
      elements: [...elements, element],
      history: newHistory,
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },
  
  updateElement: (element: FloorPlanElement) => {
    const { elements, history, historyIndex } = get();
    const updatedElements = elements.map(el => 
      el.id === element.id ? element : el
    );
    
    // Create a new history entry
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedElements);
    
    set({
      elements: updatedElements,
      history: newHistory,
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },
  
  updateElementProperty: (id: string, property: keyof FloorPlanElement, value: any) => {
    const { elements, history, historyIndex } = get();
    const updatedElements = elements.map(el => 
      el.id === id ? { ...el, [property]: value } : el
    );
    
    // Create a new history entry only for significant changes to avoid
    // flooding the history with minor adjustments during dragging
    const significantProperties = ['rotation', 'color', 'name'];
    if (significantProperties.includes(property as string) || 
        (property === 'x' && typeof value === 'number' && value % 20 === 0) || 
        (property === 'y' && typeof value === 'number' && value % 20 === 0) ||
        (property === 'width' && typeof value === 'number' && value % 20 === 0) ||
        (property === 'height' && typeof value === 'number' && value % 20 === 0)) {
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updatedElements);
      
      set({
        elements: updatedElements,
        history: newHistory,
        historyIndex: historyIndex + 1,
        canUndo: true,
        canRedo: false
      });
    } else {
      // Just update the elements without creating a history entry
      set({ elements: updatedElements });
    }
  },
  
  deleteElement: (id: string) => {
    const { elements, history, historyIndex } = get();
    const filteredElements = elements.filter(el => el.id !== id);
    
    // Create a new history entry
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(filteredElements);
    
    set({
      elements: filteredElements,
      selectedElement: null,
      history: newHistory,
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },
  
  deleteSelectedElement: () => {
    const { selectedElement } = get();
    if (selectedElement) {
      get().deleteElement(selectedElement.id);
    }
  },
  
  duplicateSelectedElement: () => {
    const { selectedElement, elements } = get();
    if (!selectedElement) return;
    
    const newElement: FloorPlanElement = {
      ...selectedElement,
      id: Date.now().toString(),
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      name: `${selectedElement.name} (Copy)`,
      zIndex: elements.length
    };
    
    get().addElement(newElement);
    get().selectElement(newElement);
  },
  
  startDrag: (element: DragElement) => set({ dragElement: element }),
  
  endDrag: () => set({ dragElement: null }),
  
  bringForward: () => {
    const { selectedElement, elements } = get();
    if (!selectedElement) return;
    
    // Find the current element and its index
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === elements.length - 1) return; // Already at the top
    
    // Update z-indices
    const updatedElements = [...elements];
    const currentZIndex = updatedElements[index].zIndex;
    const nextZIndex = updatedElements[index + 1].zIndex;
    
    updatedElements[index] = { ...updatedElements[index], zIndex: nextZIndex };
    updatedElements[index + 1] = { ...updatedElements[index + 1], zIndex: currentZIndex };
    
    // Sort by z-index
    updatedElements.sort((a, b) => a.zIndex - b.zIndex);
    
    // Create a new history entry
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedElements);
    
    set({
      elements: updatedElements,
      history: newHistory,
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },
  
  sendBackward: () => {
    const { selectedElement, elements } = get();
    if (!selectedElement) return;
    
    // Find the current element and its index
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === 0) return; // Already at the bottom
    
    // Update z-indices
    const updatedElements = [...elements];
    const currentZIndex = updatedElements[index].zIndex;
    const prevZIndex = updatedElements[index - 1].zIndex;
    
    updatedElements[index] = { ...updatedElements[index], zIndex: prevZIndex };
    updatedElements[index - 1] = { ...updatedElements[index - 1], zIndex: currentZIndex };
    
    // Sort by z-index
    updatedElements.sort((a, b) => a.zIndex - b.zIndex);
    
    // Create a new history entry
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedElements);
    
    set({
      elements: updatedElements,
      history: newHistory,
      historyIndex: historyIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },
  
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        elements: history[newIndex],
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true
      });
    }
  },
  
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        elements: history[newIndex],
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < history.length - 1
      });
    }
  },
  
  loadFloorPlan: (floorPlan: FloorPlan) => {
    const elements = floorPlan.elements as FloorPlanElement[];
    set({
      id: floorPlan.id,
      name: floorPlan.name,
      elements,
      selectedElement: null,
      history: [elements],
      historyIndex: 0,
      canUndo: false,
      canRedo: false
    });
  },
  
  resetFloorPlan: () => {
    set({
      id: null,
      name: '',
      elements: [],
      selectedElement: null,
      history: [[]],
      historyIndex: 0,
      canUndo: false,
      canRedo: false
    });
  }
}));
