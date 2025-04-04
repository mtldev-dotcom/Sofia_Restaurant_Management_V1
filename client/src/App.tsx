import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";

// Custom Protected Route with Layout
function LayoutProtectedRoute({
  path,
  component: Component,
  useAppLayout = true
}: {
  path: string;
  component: () => React.JSX.Element;
  useAppLayout?: boolean;
}) {
  return (
    <ProtectedRoute
      path={path}
      component={() => {
        // If we don't need the app layout (like floor plan page)
        if (!useAppLayout) {
          return <Component />;
        }
        
        // Wrap with app layout
        return (
          <AppLayout>
            <Component />
          </AppLayout>
        );
      }}
    />
  );
}

function Router() {
  // Using Route outside Switch gives us more control 
  // and ensures only one route renders at a time
  
  // Check for exact path matches first
  const [location] = useLocation();
  
  // Dashboard route - exact path match
  if (location === "/") {
    return <LayoutProtectedRoute path="/" component={Dashboard} />;
  }
  
  // Floor plan routes
  if (location === "/floor-plan" || location.startsWith("/floor-plan/")) {
    return location === "/floor-plan" ? 
      <LayoutProtectedRoute path="/floor-plan" component={Home} useAppLayout={false} /> :
      <LayoutProtectedRoute path="/floor-plan/:id" component={Home} useAppLayout={false} />;
  }
  
  // Dashboard specific route
  if (location === "/dashboard") {
    return <LayoutProtectedRoute path="/dashboard" component={Dashboard} />;
  }
  
  // Auth routes
  if (location === "/auth") {
    return <Route path="/auth" component={AuthPage} />;
  }
  
  if (location === "/auth/callback") {
    return (
      <Route path="/auth/callback">
        {() => <div>Processing authentication...</div>}
      </Route>
    );
  }
  
  // Not found for any other routes
  return <Route component={NotFound} />;
}

function App() {
  const [location] = useLocation();
  
  // Clear any extra body styles - important for page transitions
  useEffect(() => {
    document.body.style.overflow = "";
  }, [location]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
