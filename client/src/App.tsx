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
  return (
    <Switch>
      <LayoutProtectedRoute path="/" component={Dashboard} />
      <LayoutProtectedRoute path="/floor-plan" component={Home} useAppLayout={false} />
      <LayoutProtectedRoute path="/floor-plan/:id" component={Home} useAppLayout={false} />
      <LayoutProtectedRoute path="/dashboard" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/callback">
        {() => {
          // This is just a placeholder component since the server handles the redirect
          return <div>Processing authentication...</div>;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
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
