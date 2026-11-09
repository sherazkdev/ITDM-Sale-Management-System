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
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/forms/FormField";
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
    mode: "onTouched",
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
          <FormField
            label="Department name"
            htmlFor="dept-name"
            required
            description="Enter the official department name used by your organization."
            error={
              (form.formState.touchedFields.departmentName || form.formState.isSubmitted) &&
              form.formState.errors.departmentName
                ? form.formState.errors.departmentName.message
                : undefined
            }
            maxLength={255}
            currentLength={form.watch("departmentName")?.length ?? 0}
          >
            <Input
              id="dept-name"
              error={!!form.formState.errors.departmentName}
              {...form.register("departmentName")}
            />
          </FormField>
          {mode === "create" ? (
            <FormField
              label="Department code"
              htmlFor="dept-code"
              description="Use a short unique identifier, or leave blank to auto-generate from the name."
              maxLength={64}
              currentLength={form.watch("departmentCode")?.length ?? 0}
            >
              <Input id="dept-code" placeholder="Auto-generated if empty" {...form.register("departmentCode")} />
            </FormField>
          ) : (
            <FormField label="Department code" description="Codes are fixed after creation.">
              <Input value={initial?.departmentCode ?? ""} disabled readOnly className="bg-muted" />
            </FormField>
          )}
          <FormField label="Description" htmlFor="dept-desc" description="Optional internal summary.">
            <Input id="dept-desc" {...form.register("description")} />
          </FormField>
          {mode === "edit" ? (
            <FormField
              label="Status"
              description="Active departments can be selected for new employee assignments."
            >
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <span className="text-sm font-medium">Active</span>
                <Switch
                  checked={form.watch("isActive") ?? true}
                  onCheckedChange={(v) => form.setValue("isActive", v, { shouldDirty: true })}
                />
              </label>
            </FormField>
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
