"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, User as UserIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function NewEmployeePage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PermissionKeys.employeesWrite);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      employeeNumber: "",
      fullName: "",
      department: "",
      designation: "",
      contactNumber: "",
      email: "",
    },
  });

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
                    {[preview.department, preview.designation].filter(Boolean).join(" · ") ||
                      "Department · designation"}
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
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="employeeNumber" required>
                  Employee number
                </Label>
                <Input
                  id="employeeNumber"
                  error={!!errors.employeeNumber}
                  {...register("employeeNumber")}
                />
                {errors.employeeNumber ? (
                  <p className="text-xs text-destructive">{errors.employeeNumber.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="fullName" required>
                  Full name
                </Label>
                <Input id="fullName" error={!!errors.fullName} {...register("fullName")} />
                {errors.fullName ? (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="department">Department</Label>
                <Input id="department" {...register("department")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" {...register("designation")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactNumber">Contact number</Label>
                <Input id="contactNumber" {...register("contactNumber")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" error={!!errors.email} {...register("email")} />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>
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
