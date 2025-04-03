import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle } from "lucide-react";

interface UserMigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function UserMigrationDialog({ isOpen, onClose, initialEmail = '' }: UserMigrationDialogProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [migrationState, setMigrationState] = useState<'initial' | 'validating' | 'migrating' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);
  
  // Auto-increase progress during migration for better UX
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (migrationState === 'migrating' && progress < 90) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [migrationState, progress]);

  const resetState = () => {
    setEmail('');
    setPassword('');
    setMigrationState('initial');
    setErrorMessage('');
    setProgress(0);
    setLoading(false);
  };

  const handleMigrate = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please provide both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMigrationState('validating');
    setProgress(10);
    setErrorMessage('');
    
    try {
      // Step 1: Validate credentials
      console.log(`Starting migration for email: ${email}`);
      setMigrationState('migrating');
      setProgress(30);
      
      // Step 2: Perform the migration
      const response = await apiRequest('POST', '/api/auth/migrate-user', { email, password });
      
      setProgress(100);
      setMigrationState('success');
      
      toast({
        title: "User Migrated",
        description: "Your account has been successfully migrated to the new authentication system",
        variant: "default",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Allow the success message to be seen for a moment
      setTimeout(() => {
        resetState();
        onClose();
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error: any) {
      console.error('Migration error:', error);
      setMigrationState('error');
      setProgress(0);
      
      // Extract the error message from the response if available
      let errorMsg = "Failed to migrate user account";
      
      if (error.response) {
        try {
          const errorData = error.response.data;
          if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      // Include debugging hint for invalid credentials
      if (errorMsg.includes("Invalid credentials")) {
        setErrorMessage(
          `${errorMsg} - This could happen if: 
          1. Your password is incorrect 
          2. Your account uses a different username or email
          Please try again or contact support.`
        );
      }
      
      toast({
        title: "Migration Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && migrationState !== 'migrating') {
        resetState();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Migrate Your Account</DialogTitle>
          <DialogDescription>
            We've updated our authentication system. Please provide your credentials to migrate your account.
          </DialogDescription>
        </DialogHeader>
        
        {migrationState === 'error' && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {migrationState === 'success' && (
          <Alert variant="default" className="my-2 border-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>Account successfully migrated! Redirecting to dashboard...</AlertDescription>
          </Alert>
        )}
        
        {(migrationState === 'migrating' || migrationState === 'validating') && (
          <div className="my-2 space-y-2">
            <div className="flex justify-between text-xs">
              <span>{migrationState === 'validating' ? 'Validating credentials...' : 'Migrating account...'}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {(migrationState === 'initial' || migrationState === 'error') && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="password" className="text-right text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                disabled={loading}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          {(migrationState === 'initial' || migrationState === 'error') && (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleMigrate} disabled={loading}>
                {loading ? "Processing..." : "Migrate Account"}
              </Button>
            </>
          )}
          
          {migrationState === 'success' && (
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          )}
          
          {(migrationState === 'migrating' || migrationState === 'validating') && (
            <Button variant="outline" disabled>
              Migrating...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}