import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface ReasonPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (reason: string) => void;
  isSubmitting?: boolean;
}

export function ReasonPromptDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  isSubmitting = false,
}: ReasonPromptDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("A reason is required.");
      return;
    }
    onSubmit(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex flex-col gap-2 pt-2">
            <Label htmlFor="reason" className="text-destructive font-semibold">
              Reason *
            </Label>
            <textarea
              id="reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for this action..."
              className="flex min-h-[80px] w-full rounded-md border border-destructive bg-destructive/5 px-3 py-2 text-sm ring-offset-background"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !reason.trim()} variant="destructive">
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
