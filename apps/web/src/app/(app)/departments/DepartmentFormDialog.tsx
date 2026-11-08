"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Department } from "@/lib/api/departments";

const departmentFormSchema = z.object({
  departmentName: z.string().min(1, "Name is required").max(255),
  departmentCode: z.string().max(64).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial: Department | null;
  submitting: boolean;
  onSubmit: (values: DepartmentFormValues) => void;
};

export function DepartmentFormDialog({ open, onOpenChange, mode, initial, submitting, onSubmit }: Props) {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      departmentName: "",
      departmentCode: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      departmentName: initial?.departmentName ?? "",
      departmentCode: initial?.departmentCode ?? "",
      description: initial?.description ?? "",
      isActive: initial?.isActive ?? true,
    });
  }, [open, initial, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add department" : "Edit department"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name" required>
              Department name
            </Label>
            <Input
              id="dept-name"
              error={!!form.formState.errors.departmentName}
              {...form.register("departmentName")}
            />
            {form.formState.errors.departmentName ? (
              <p className="text-xs text-destructive">{form.formState.errors.departmentName.message}</p>
            ) : null}
          </div>
          {mode === "create" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dept-code">Code (optional)</Label>
              <Input id="dept-code" placeholder="Auto-generated from name if empty" {...form.register("departmentCode")} />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label>Code</Label>
              <Input value={initial?.departmentCode ?? ""} disabled readOnly className="bg-muted" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-desc">Description</Label>
            <Input id="dept-desc" {...form.register("description")} />
          </div>
          {mode === "edit" ? (
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <span className="text-sm font-medium">Active</span>
              <Switch
                checked={form.watch("isActive") ?? true}
                onCheckedChange={(v) => form.setValue("isActive", v, { shouldDirty: true })}
              />
            </label>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {mode === "create" ? "Create" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
