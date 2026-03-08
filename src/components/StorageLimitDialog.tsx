import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StorageLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageMB: number;
}

const CONTACT_EMAIL = "smartmudikhana@gmail.com";

const StorageLimitDialog = ({ open, onOpenChange, usageMB }: StorageLimitDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-6 h-6" />
            <DialogTitle className="text-destructive">Storage Limit Reached!</DialogTitle>
          </div>
          <DialogDescription className="pt-2 space-y-3">
            <p>
              আপনার ডেটা স্টোরেজ <strong>{usageMB.toFixed(0)} MB / 900 MB</strong> পৌঁছে গেছে। 
              নতুন ডেটা যোগ করা সম্ভব নয়।
            </p>
            <p>
              Storage limit exceeded. New data cannot be added. 
              Please contact us to manage your store or upgrade.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground mb-1">Contact for Manage Store</p>
            <a 
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center justify-center gap-2 text-primary font-medium hover:underline"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
          
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            বন্ধ করুন / Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StorageLimitDialog;
