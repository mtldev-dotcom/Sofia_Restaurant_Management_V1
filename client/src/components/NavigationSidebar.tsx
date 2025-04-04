import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  Menu,
  X,
  Home
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  implemented: boolean;
};

const NavigationSidebar = () => {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      implemented: true
    },
    {
      name: "Floor Plans",
      href: "/floor-plan",
      icon: <Home className="h-5 w-5" />,
      implemented: true
    },
    {
      name: "Bookings",
      href: "/bookings",
      icon: <CalendarDays className="h-5 w-5" />,
      implemented: false
    },
    {
      name: "Customers",
      href: "/customers",
      icon: <Users className="h-5 w-5" />,
      implemented: false
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      implemented: false
    }
  ];

  const handleNavClick = (e: React.MouseEvent, item: NavigationItem) => {
    e.preventDefault();
    
    if (item.implemented) {
      // For floor plan navigation, always use the base path
      if (item.href === '/floor-plan' && location.startsWith('/floor-plan/')) {
        navigate('/floor-plan');
      } else {
        navigate(item.href);
      }
      setOpen(false);
    } else {
      toast({
        title: "Coming Soon",
        description: "This feature is currently in development",
      });
    }
  };

  // For desktops, render a regular horizontal navbar
  if (!isMobile) {
    return (
      <nav className="mr-6">
        <ul className="flex space-x-4">
          {navigationItems.map((item) => {
            // Check if location starts with the href to handle nested routes like /floor-plan/:id
            const isActive = item.href === '/floor-plan' 
              ? location === '/floor-plan' || location.startsWith('/floor-plan/') 
              : location === item.href;
            
            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  } ${!item.implemented && "opacity-60 cursor-default"}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  // For mobile, render a hamburger menu that opens a drawer
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <LayoutDashboard className="h-5 w-5 text-primary mr-2" />
                <h2 className="text-lg font-semibold">Floor Plan App</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="space-y-1 px-2">
              {navigationItems.map((item) => {
                // Check if location starts with the href to handle nested routes like /floor-plan/:id
                const isActive = item.href === '/floor-plan' 
                  ? location === '/floor-plan' || location.startsWith('/floor-plan/') 
                  : location === item.href;

                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/50"
                    } ${!item.implemented && "opacity-60 cursor-default"}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                    {!item.implemented && (
                      <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationSidebar;