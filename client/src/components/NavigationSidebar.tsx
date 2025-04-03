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
  X
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
};

const NavigationSidebar = () => {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      name: "Floor Plans",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      name: "Bookings",
      href: "/bookings",
      icon: <CalendarDays className="h-5 w-5" />
    },
    {
      name: "Customers",
      href: "/customers",
      icon: <Users className="h-5 w-5" />
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const handleClick = (href: string, isImplemented: boolean = true) => {
    if (!isImplemented && href !== "/") {
      toast({
        title: "Coming Soon",
        description: "This feature is currently in development",
      });
    } else {
      setOpen(false);
    }
  };

  // For desktops, render a regular horizontal navbar
  if (!isMobile) {
    return (
      <nav className="mr-6">
        <ul className="flex space-x-4">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const isImplemented = item.href === "/" || item.href === "/dashboard";
            
            return (
              <li key={item.name}>
                <a
                  href={isImplemented ? item.href : "#"}
                  onClick={(e) => {
                    e.preventDefault();
                    if (isImplemented) {
                      window.location.href = item.href;
                    }
                    handleClick(item.href, isImplemented);
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  } ${!isImplemented && "opacity-60 cursor-default"}`}
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
                const isActive = location === item.href;
                const isImplemented = item.href === "/" || item.href === "/dashboard";

                return (
                  <a
                    key={item.name}
                    href={isImplemented ? item.href : "#"}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isImplemented) {
                        window.location.href = item.href;
                      }
                      handleClick(item.href, isImplemented);
                    }}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/50"
                    } ${!isImplemented && "opacity-60 cursor-default"}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
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