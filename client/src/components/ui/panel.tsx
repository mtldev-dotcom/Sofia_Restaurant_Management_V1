import * as React from "react";
import { cn } from "@/lib/utils";

const Panel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "floating";
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-background border border-border",
        variant === "floating" && "rounded-lg shadow-lg",
        className
      )}
      {...props}
    />
  );
});

Panel.displayName = "Panel";

const PanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("px-4 py-3 border-b border-border", className)}
      {...props}
    />
  );
});

PanelHeader.displayName = "PanelHeader";

const PanelBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("px-4 py-3", className)}
      {...props}
    />
  );
});

PanelBody.displayName = "PanelBody";

export { Panel, PanelHeader, PanelBody };
