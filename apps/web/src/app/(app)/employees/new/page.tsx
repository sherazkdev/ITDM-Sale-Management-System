"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, User as UserIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { UserAvatar } from "@/components/ui/avatar";
import {
  CreateFormActions,
  CreateFormLayout,
} from "@/components/crud/CreateFormLayout";
import {
  CreateFormPreviewCard,
  CreateFormTips,
  CreateFormValidationCard,
} from "@/components/crud/CreateFormAside";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { createEmployee, type Employee } from "@/lib/api/employees";
import { createEmployeeSchema, type CreateEmployeeInput } from "@/lib/validators/employee";
import { ApiClientError } from "@/lib/api/client";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { DepartmentSelect } from "@/components/forms/DepartmentSelect";

export default function NewEmployeePage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PermissionKeys.employeesWrite);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty, touchedFields, isSubmitted },
  } = useForm<CreateEmployeeInput>({
    mode: "onTouched",
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      employeeNumber: "",
      fullName: "",
      departmentId: "",
      designation: "",
      contactNumber: "",
      email: "",
    },
  });

  useUnsavedChangesWarning(isDirty);

  const preview = watch();

  const mutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (employee: Employee) => {
      toast.success("Employee created");
      router.push(`/employees/${employee.employeeId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create employee");
    },
  });

  if (!canWrite) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader variant="standard" title="Add employee" description="Create a new employee record." />
        <Card className="p-6 text-sm text-muted-foreground">
          You need the employees.write permission to add employees.{" "}
          <Link href="/employees" className="text-primary hover:underline">
            Back to list
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader variant="standard"
        title="Add employee"
        description="Register a new employee in the directory."
        breadcrumbs={[
          { label: "Employees", href: "/employees" },
          { label: "New" },
        ]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/employees">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <CreateFormLayout
        aside={
          <>
            <CreateFormValidationCard
              requiredFields={["Employee number", "Full name"]}
            />
            <CreateFormTips
              tips={[
                "Employee numbers must be unique in the directory.",
                "Email and contact fields help with asset issuance workflows.",
              ]}
            />
            <CreateFormPreviewCard title="Record preview">
              <div className="flex items-center gap-3">
                <UserAvatar name={preview.fullName || "New employee"} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{preview.fullName || "Full name"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {preview.employeeNumber || "Employee number"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[preview.designation].filter(Boolean).join(" · ") || "Designation"}
                  </p>
                </div>
              </div>
            </CreateFormPreviewCard>
          </>
        }
      >
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="h-4 w-4 text-primary" />
                Employee information
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                className="md:col-span-2"
                label="Employee number"
                htmlFor="employeeNumber"
                required
                description="Enter your organization's unique identifier for this employee."
                error={
                  (touchedFields.employeeNumber || isSubmitted) && errors.employeeNumber
                    ? errors.employeeNumber.message
                    : undefined
                }
              >
                <Input
                  id="employeeNumber"
                  error={!!errors.employeeNumber && (touchedFields.employeeNumber || isSubmitted)}
                  {...register("employeeNumber")}
                />
              </FormField>
              <FormField
                className="md:col-span-2"
                label="Full name"
                htmlFor="fullName"
                required
                description="Enter the employee's official full name as used in company records."
                error={
                  (touchedFields.fullName || isSubmitted) && errors.fullName
                    ? errors.fullName.message
                    : undefined
                }
              >
                <Input
                  id="fullName"
                  error={!!errors.fullName && (touchedFields.fullName || isSubmitted)}
                  {...register("fullName")}
                />
              </FormField>
              <FormField
                label="Department"
                description="Select the department currently associated with this employee."
              >
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <DepartmentSelect value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
              </FormField>
              <FormField label="Designation" htmlFor="designation" description="Job title or role label (optional).">
                <Input id="designation" {...register("designation")} />
              </FormField>
              <FormField
                label="Contact number"
                htmlFor="contactNumber"
                description="Work phone or extension, if applicable."
              >
                <Input id="contactNumber" {...register("contactNumber")} />
              </FormField>
              <FormField
                label="Email"
                htmlFor="email"
                description="Enter a valid work email address if applicable."
                error={
                  (touchedFields.email || isSubmitted) && errors.email ? errors.email.message : undefined
                }
              >
                <Input
                  id="email"
                  type="email"
                  error={!!errors.email && (touchedFields.email || isSubmitted)}
                  {...register("email")}
                />
              </FormField>
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/employees">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Create employee
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}
