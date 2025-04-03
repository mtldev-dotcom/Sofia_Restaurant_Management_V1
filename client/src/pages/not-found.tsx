import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              The page you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
