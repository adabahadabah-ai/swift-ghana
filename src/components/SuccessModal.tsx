import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  phone?: string;
  bundle?: string;
  network?: string;
}

export function SuccessModal({ open, onClose, phone, bundle, network }: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card-strong border-glass-border text-center max-w-sm">
        <DialogTitle className="sr-only">Order Confirmed</DialogTitle>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-success/15 border border-success/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full gold-gradient-static flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground tracking-tight">Order Confirmed!</h2>
            <div className="space-y-1 text-xs text-muted-foreground mt-2">
              <p>{bundle} {network} data bundle</p>
              <p>sent to <span className="text-foreground font-medium">{phone}</span></p>
            </div>
          </div>
          <div className="chip text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Delivery within 30 seconds
          </div>
          <Button variant="gold" onClick={onClose} className="w-full mt-2">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
