import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import ThemeToggle from "@/components/ThemeToggle";
import { Save, Upload, Layout } from "lucide-react";

interface HeaderProps {
  onSave: () => void;
  onLoad: () => void;
}

const Header = ({ onSave, onLoad }: HeaderProps) => {
  const floorPlanName = useFloorPlanStore((state) => state.name);
  
  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="text-primary w-8 h-8 mr-3 flex items-center justify-center">
              <Layout className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Floor Plan Designer
              {floorPlanName && (
                <span className="text-sm text-muted-foreground ml-2 font-normal">
                  ({floorPlanName})
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={onSave} 
              className="inline-flex items-center"
              size="sm"
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              onClick={onLoad} 
              className="inline-flex items-center"
              size="sm"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Load
            </Button>
            <div className="ml-2">
              <ThemeToggle />
            </div>
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">FP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
