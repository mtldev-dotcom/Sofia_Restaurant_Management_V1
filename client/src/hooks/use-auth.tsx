import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User, loginUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { UserMigrationDialog } from "@/components/UserMigrationDialog";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Updated login schema to use email
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type LoginData = z.infer<typeof loginSchema>;

// Extend the schema for registration to confirm password
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().default("user"),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [migrationEmail, setMigrationEmail] = useState('');

  /**
   * Check for existing Supabase session on component mount
   * This ensures we fetch user data if they already have a valid session
   */
  useEffect(() => {
    async function getInitialSession() {
      try {
        // Check for existing session
        const { data } = await supabase.auth.getSession();
        
        // If we have a session, we'll refetch the user data
        if (data.session) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        // Always set loaded state to true, even if there was an error
        setSupabaseLoaded(true);
      }
    }

    getInitialSession();
  }, []);

  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({
      on401: "returnNull",
      onResponse: async (res) => {
        // We're now handling migrations automatically on the server side
        // This code block is kept for compatibility with older versions but is unlikely to be triggered
        if (res.status === 409) {
          const data = await res.json();
          if (data.code === "NEEDS_MIGRATION" && data.email) {
            console.log("Migration needed for user", data.email);
            // Refetech after 1 second to allow the server to complete the migration
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            }, 1000);
            return null;
          }
        }
        return res;
      }
    }),
    enabled: supabaseLoaded, // Only run this query after we check for Supabase session
  });

  /**
   * Set up Supabase auth state listener
   * This keeps the client state in sync with Supabase authentication state
   * and updates the user data accordingly
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Session exists, refetch user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        // No session, clear user data
        queryClient.setQueryData(["/api/auth/user"], null);
      }
    });

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Login mutation for handling user authentication
   * Sends login credentials to the server and handles success/error states
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Update the user data in the query cache
      queryClient.setQueryData(["/api/auth/user"], user);
      
      // Show success notification
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.firstName || user.username}!`,
      });
      
      // Navigate to dashboard
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      // Show error notification
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  /**
   * Registration mutation for creating new user accounts
   * Handles form submission and server response
   */
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Remove confirmPassword from the payload before sending to server
      const { confirmPassword, ...userDataToSend } = userData;
      const res = await apiRequest("POST", "/api/auth/register", userDataToSend);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Update the user data in the query cache
      queryClient.setQueryData(["/api/auth/user"], user);
      
      // Show success notification
      toast({
        title: "Registration successful",
        description: `Welcome to Sofia Restaurant Management, ${user.firstName || user.username}!`,
      });
      
      // Navigate to dashboard
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      // Show error notification
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Logout mutation for signing out users
   * Clears user session and updates application state
   */
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear user data from the query cache
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Show success notification
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      // Redirect to home page
      window.location.href = "/";
    },
    onError: (error: Error) => {
      // Show error notification
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMigrationClose = () => {
    setShowMigrationDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading || !supabaseLoaded,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
      {showMigrationDialog && (
        <UserMigrationDialog 
          isOpen={showMigrationDialog} 
          onClose={handleMigrationClose}
          initialEmail={migrationEmail}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}