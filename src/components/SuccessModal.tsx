import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

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
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-[oklch(0.60_0.18_155/15%)] flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-[oklch(0.75_0.15_155)]" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground">Order Confirmed!</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{bundle} {network} data bundle</p>
            <p>sent to <span className="text-foreground font-medium">{phone}</span></p>
          </div>
          <p className="text-xs text-muted-foreground">Delivery within 30 seconds</p>
          <Button variant="gold" onClick={onClose} className="w-full mt-2">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
