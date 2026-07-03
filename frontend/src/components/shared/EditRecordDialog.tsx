import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type FieldDefinition = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "time";
  defaultValue?: any;
  options?: { label: string; value: string }[] | string[];
  disabled?: boolean;
};

export interface EditRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldDefinition[];
  initialValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>, reason: string) => void;
  isSubmitting?: boolean;
  requireReason?: boolean;
}

export function EditRecordDialog({
  open,
  onOpenChange,
  title,
  fields,
  initialValues,
  onSubmit,
  isSubmitting = false,
  requireReason = true,
}: EditRecordDialogProps) {
  const derivedInitialValues = useMemo(() => {
    if (initialValues) return initialValues;
    const vals: Record<string, any> = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        vals[f.name] = f.defaultValue;
      }
    });
    return vals;
  }, [initialValues, fields]);

  const [values, setValues] = useState<Record<string, any>>(derivedInitialValues);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setValues(derivedInitialValues);
      setReason("");
    }
  }, [open, derivedInitialValues]);

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireReason && !reason.trim()) {
      alert("A reason for this edit is required.");
      return;
    }
    onSubmit(values, reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-border/50 shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto h-full">
          <div className="grid gap-4 px-6 py-4">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    disabled={field.disabled}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select {field.label}</option>
                    {field.options?.map((opt) => {
                      const value = typeof opt === 'string' ? opt : opt.value;
                      const label = typeof opt === 'string' ? opt : opt.label;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    type={field.type}
                    disabled={field.disabled}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  />
                )}
              </div>
            ))}
          </div>

          {requireReason && (
            <div className="pt-4 mt-2 border-t border-border px-6">
              <Label className="text-destructive font-semibold">Reason for Edit *</Label>
              <textarea
                className="w-full mt-2 h-20 bg-destructive/5 border border-destructive/20 text-foreground rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-destructive/30 resize-none placeholder:text-muted-foreground/60"
                placeholder="Briefly explain why you are making this administrative change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          )}

          <div className="sticky bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 md:static md:bg-transparent md:border-0 md:p-0 md:mt-6 z-10">
            <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
              <Button type="button" variant="outline" className="flex-1 md:flex-none" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 md:flex-none shadow-lg shadow-primary/20" disabled={isSubmitting || (requireReason && !reason.trim())}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
