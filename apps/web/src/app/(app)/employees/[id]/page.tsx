"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Pencil, UserX } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { UserAvatar } from "@/components/ui/avatar";
import {
  DetailField,
  DetailRecordLayout,
  RecordOverviewCard,
} from "@/components/crud/DetailRecordLayout";
import { StatusPill } from "@/components/common/StatusPill";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import {
  deactivateEmployee,
  fetchEmployee,
  updateEmployee,
} from "@/lib/api/employees";
import { updateEmployeeSchema, type UpdateEmployeeInput } from "@/lib/validators/employee";
import { ApiClientError } from "@/lib/api/client";

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PermissionKeys.employeesWrite);

  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const { data: employee, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => fetchEmployee(id),
    enabled: !!id,
  });

  const editForm = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema),
    values: employee
      ? {
          fullName: employee.fullName,
          department: employee.department ?? "",
          designation: employee.designation ?? "",
          contactNumber: employee.contactNumber ?? "",
          email: employee.email ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateEmployeeInput) => updateEmployee(id, input),
    onSuccess: () => {
      toast.success("Employee updated");
      void queryClient.invalidateQueries({ queryKey: ["employee", id] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateEmployee(id),
    onSuccess: () => {
      toast.success("Employee deactivated");
      void queryClient.invalidateQueries({ queryKey: ["employee", id] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      setDeactivateOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Deactivation failed");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Employee" description="Loading…" />
        <Card className="h-48 animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Employee" />
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Employee not found."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={employee.fullName}
        description={`Employee #${employee.employeeNumber}`}
        breadcrumbs={[
          { label: "Employees", href: "/employees" },
          { label: employee.fullName },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" asChild>
              <Link href="/employees">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {canWrite && employee.isActive ? (
              <>
                <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="destructive" size="md" onClick={() => setDeactivateOpen(true)}>
                  <UserX className="h-4 w-4" />
                  Deactivate
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <RecordOverviewCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar name={employee.fullName} size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">{employee.fullName}</h2>
            <p className="text-sm text-muted-foreground">Employee #{employee.employeeNumber}</p>
            <div className="mt-2">
              <StatusPill status={employee.isActive ? "active" : "inactive"} dot />
            </div>
          </div>
        </div>
      </RecordOverviewCard>

      <DetailRecordLayout
        aside={
          <SectionCard title="Contact">
            <dl className="flex flex-col gap-3">
              <DetailField label="Email" value={employee.email ?? "—"} />
              <DetailField label="Phone" value={employee.contactNumber ?? "—"} />
            </dl>
          </SectionCard>
        }
      >
        <SectionCard title="Organization">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Department" value={employee.department ?? "—"} />
            <DetailField label="Designation" value={employee.designation ?? "—"} />
            <DetailField label="Employee number" value={employee.employeeNumber} />
            <DetailField
              label="Status"
              value={<StatusPill status={employee.isActive ? "active" : "inactive"} dot />}
            />
          </dl>
        </SectionCard>
      </DetailRecordLayout>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-fullName">Full name</Label>
              <Input
                id="edit-fullName"
                error={!!editForm.formState.errors.fullName}
                {...editForm.register("fullName")}
              />
              {editForm.formState.errors.fullName ? (
                <p className="text-xs text-destructive">{editForm.formState.errors.fullName.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-department">Department</Label>
                <Input id="edit-department" {...editForm.register("department")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-designation">Designation</Label>
                <Input id="edit-designation" {...editForm.register("designation")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-contact">Contact</Label>
                <Input id="edit-contact" {...editForm.register("contactNumber")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" {...editForm.register("email")} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate employee?"
        description={`${employee.fullName} will be marked inactive and cannot receive new asset assignments.`}
        confirmLabel="Deactivate"
        destructive
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateMutation.mutate()}
      />
    </div>
  );
}
