import { useState } from "react";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState<'elements' | 'layouts' | 'settings'>('elements');
  const startDrag = useFloorPlanStore((state) => state.startDrag);
  
  // Furniture element categories
  const tables = [
    { type: "round", size: "small", label: "Round Small", width: 12, height: 12, isRound: true },
    { type: "round", size: "large", label: "Round Large", width: 16, height: 16, isRound: true },
    { type: "square", size: "small", label: "Square Small", width: 12, height: 12 },
    { type: "square", size: "large", label: "Square Large", width: 16, height: 16 },
    { type: "rectangle", size: "small", label: "Rectangle S", width: 16, height: 10 },
    { type: "rectangle", size: "large", label: "Rectangle L", width: 20, height: 12 },
  ];
  
  const chairs = [
    { type: "standard", label: "Standard", width: 8, height: 8 },
    { type: "armchair", label: "Armchair", width: 10, height: 10 },
    { type: "stool", label: "Stool", width: 6, height: 6, isRound: true },
    { type: "booth", label: "Booth", width: 16, height: 6 },
  ];
  
  const fixtures = [
    { type: "bar", label: "Bar Counter", width: 20, height: 8 },
    { type: "wall", label: "Wall Divider", width: 20, height: 4 },
    { type: "plant", label: "Plant", width: 8, height: 8, isRound: true },
    { type: "entrance", label: "Entrance", width: 12, height: 6 },
  ];

  const handleDragStart = (
    e: React.MouseEvent, 
    elementType: string, 
    elementCategory: string, 
    details: any
  ) => {
    e.preventDefault();
    
    startDrag({
      type: elementType,
      category: elementCategory,
      ...details
    });
  };

  return (
    <Panel className="w-64 flex flex-col h-full">
      <div className="border-b border-gray-200">
        <nav className="flex" aria-label="Tabs">
          <button 
            onClick={() => setActiveTab('elements')}
            className={cn(
              "flex-1 py-4 px-1 text-center font-medium text-sm border-b-2",
              activeTab === 'elements' 
                ? "text-gray-900 border-primary-500" 
                : "text-gray-500 hover:text-gray-700 border-transparent"
            )}
          >
            Elements
          </button>
          <button 
            onClick={() => setActiveTab('layouts')}
            className={cn(
              "flex-1 py-4 px-1 text-center font-medium text-sm border-b-2",
              activeTab === 'layouts' 
                ? "text-gray-900 border-primary-500" 
                : "text-gray-500 hover:text-gray-700 border-transparent"
            )}
          >
            Layouts
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex-1 py-4 px-1 text-center font-medium text-sm border-b-2",
              activeTab === 'settings' 
                ? "text-gray-900 border-primary-500" 
                : "text-gray-500 hover:text-gray-700 border-transparent"
            )}
          >
            Settings
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'elements' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tables</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {tables.map((table, index) => (
                  <div
                    key={`table-${index}`}
                    className="p-2 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-grab flex flex-col items-center shadow-sm"
                    onMouseDown={(e) => handleDragStart(e, table.type, 'table', table)}
                  >
                    <div 
                      className={cn(
                        "border border-gray-400 bg-white",
                        table.isRound ? "rounded-full" : "",
                        `w-${table.width} h-${table.height}`
                      )}
                      style={{ 
                        width: `${table.width / 4}rem`, 
                        height: `${table.height / 4}rem` 
                      }}
                    ></div>
                    <span className="mt-1 text-xs text-gray-600">{table.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chairs</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {chairs.map((chair, index) => (
                  <div
                    key={`chair-${index}`}
                    className="p-2 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-grab flex flex-col items-center shadow-sm"
                    onMouseDown={(e) => handleDragStart(e, chair.type, 'chair', chair)}
                  >
                    {chair.type === 'standard' || chair.type === 'armchair' ? (
                      <div 
                        className={`w-${chair.width} h-${chair.height} rounded-md border border-gray-400 bg-white flex items-center justify-center`}
                        style={{ 
                          width: `${chair.width / 4}rem`, 
                          height: `${chair.height / 4}rem` 
                        }}
                      >
                        <div className={`w-${chair.width-2} h-${chair.height-3} rounded-t-md bg-gray-200`}
                          style={{ 
                            width: `${(chair.width-2) / 4}rem`, 
                            height: `${(chair.height-3) / 4}rem` 
                          }}
                        ></div>
                      </div>
                    ) : chair.type === 'stool' ? (
                      <div 
                        className="rounded-full border border-gray-400 bg-white"
                        style={{ 
                          width: `${chair.width / 4}rem`, 
                          height: `${chair.height / 4}rem` 
                        }}
                      ></div>
                    ) : (
                      <div 
                        className="rounded-md border border-gray-400 bg-white"
                        style={{ 
                          width: `${chair.width / 4}rem`, 
                          height: `${chair.height / 4}rem` 
                        }}
                      ></div>
                    )}
                    <span className="mt-1 text-xs text-gray-600">{chair.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fixtures</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {fixtures.map((fixture, index) => (
                  <div
                    key={`fixture-${index}`}
                    className="p-2 border border-gray-200 rounded bg-white hover:bg-gray-50 cursor-grab flex flex-col items-center shadow-sm"
                    onMouseDown={(e) => handleDragStart(e, fixture.type, 'fixture', fixture)}
                  >
                    {fixture.type === 'plant' ? (
                      <div 
                        className="rounded-full border border-gray-400 bg-green-100 flex items-center justify-center"
                        style={{ 
                          width: `${fixture.width / 4}rem`, 
                          height: `${fixture.height / 4}rem` 
                        }}
                      >
                        <svg className="text-green-600 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 10c3.976 0 7-3.024 7-7H5c0 3.976 3.024 7 7 7z"></path>
                          <path d="M12 10v10"></path>
                          <path d="M12 10c-3.976 0-7-3.024-7-7"></path>
                        </svg>
                      </div>
                    ) : fixture.type === 'entrance' ? (
                      <div 
                        className="border-t-2 border-l-2 border-r-2 border-gray-400 bg-white"
                        style={{ 
                          width: `${fixture.width / 4}rem`, 
                          height: `${fixture.height / 4}rem` 
                        }}
                      ></div>
                    ) : (
                      <div 
                        className={cn(
                          "rounded-md border border-gray-400",
                          fixture.type === 'bar' ? "bg-gray-100" : "bg-gray-300"
                        )}
                        style={{ 
                          width: `${fixture.width / 4}rem`, 
                          height: `${fixture.height / 4}rem` 
                        }}
                      ></div>
                    )}
                    <span className="mt-1 text-xs text-gray-600">{fixture.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layouts' && (
          <div className="py-2">
            <p className="text-sm text-gray-600">Your saved layouts will appear here.</p>
            <div className="mt-4 space-y-2">
              {/* Layout list would appear here */}
              <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <p className="font-medium text-gray-900">No layouts saved</p>
                <p className="text-xs text-gray-500">Save a layout to see it here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="py-2">
            <p className="text-sm text-gray-600 mb-4">Configure your floor plan settings.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canvas Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">Width (px)</label>
                    <input 
                      type="number"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                      defaultValue="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Height (px)</label>
                    <input 
                      type="number"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                      defaultValue="800"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grid Size</label>
                <input 
                  type="number"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  defaultValue="20"
                />
                <p className="mt-1 text-xs text-gray-500">Size in pixels between grid lines</p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show Grid</span>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-primary-600">
                  <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default Sidebar;
