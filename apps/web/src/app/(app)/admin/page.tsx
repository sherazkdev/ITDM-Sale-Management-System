"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/forms/FormField";
import { fieldErrorMessage, fieldHasError } from "@/lib/forms/field-error";
import { FilterSelect } from "@/components/common/FilterSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createAdminUser,
  fetchAdminRoles,
  fetchAdminUsers,
  setAdminUserRoles,
  updateAdminUser,
  type AdminUser,
} from "@/lib/api/admin-users";
import {
  createAdminUserSchema,
  setUserRolesSchema,
  updateAdminUserSchema,
  type CreateAdminUserInput,
  type SetUserRolesInput,
  type UpdateAdminUserInput,
} from "@/lib/validators/admin-user";
import { ApiClientError } from "@/lib/api/client";

function roleSummary(user: AdminUser) {
  return user.userRoles.map((ur) => ur.role.roleKey).join(", ") || "—";
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [rolesUser, setRolesUser] = useState<AdminUser | null>(null);

  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });
  const rolesQuery = useQuery({ queryKey: ["admin-roles"], queryFn: fetchAdminRoles });

  const createForm = useForm<CreateAdminUserInput>({
    resolver: zodResolver(createAdminUserSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
      email: "",
      roleKeys: [],
    },
  });

  const {
    register: createRegister,
    handleSubmit: createHandleSubmit,
    control: createControl,
    formState: {
      errors: createErrors,
      touchedFields: createTouched,
      isSubmitted: createSubmitted,
    },
  } = createForm;

  const createScalarTouched = createTouched as Partial<
    Record<"username" | "displayName" | "password" | "email", boolean>
  >;

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.success("User created");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      createForm.reset();
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Create failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminUserInput }) => updateAdminUser(id, body),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditUser(null);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Update failed"),
  });

  const rolesMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: SetUserRolesInput }) => setAdminUserRoles(id, body),
    onSuccess: () => {
      toast.success("Roles updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRolesUser(null);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Roles update failed"),
  });

  const roleOptions = (rolesQuery.data ?? []).map((r) => ({ value: r.roleKey, label: r.displayName }));

  const columns: Column<AdminUser>[] = [
    { key: "user", header: "Username", cell: (r) => <span className="font-medium">{r.username}</span> },
    { key: "name", header: "Display name", cell: (r) => r.displayName },
    { key: "email", header: "Email", cell: (r) => r.email ?? "—" },
    {
      key: "active",
      header: "Status",
      cell: (r) =>
        r.isLocked ? (
          <StatusPill status="inactive" label="Locked" />
        ) : r.isActive ? (
          <StatusPill status="active" />
        ) : (
          <StatusPill status="inactive" />
        ),
    },
    { key: "roles", header: "Roles", cell: (r) => <span className="text-xs font-mono">{roleSummary(r)}</span> },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditUser(r)}>
            Edit
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setRolesUser(r)}>
            Roles
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Administration"
        description="User accounts and role assignments — RBAC policies are defined server-side (D01)."
      />

      <SectionCard title="Users">
        <div className="flex justify-end mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button">
                <UserPlus className="h-4 w-4 mr-2" />
                Create user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create user</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={createHandleSubmit((values) => createMutation.mutate(values))}
                noValidate
              >
                <FormField
                  label="Username"
                  htmlFor="admin-username"
                  required
                  description="Sign-in identifier; must be unique."
                  error={fieldErrorMessage("username", createScalarTouched, createSubmitted, createErrors)}
                >
                  <Input
                    id="admin-username"
                    autoComplete="username"
                    error={fieldHasError("username", createScalarTouched, createSubmitted, createErrors)}
                    {...createRegister("username")}
                  />
                </FormField>
                <FormField
                  label="Display name"
                  htmlFor="admin-displayName"
                  required
                  description="Name shown in audit trails and assignments."
                  error={fieldErrorMessage("displayName", createScalarTouched, createSubmitted, createErrors)}
                >
                  <Input
                    id="admin-displayName"
                    error={fieldHasError("displayName", createScalarTouched, createSubmitted, createErrors)}
                    {...createRegister("displayName")}
                  />
                </FormField>
                <FormField
                  label="Email"
                  htmlFor="admin-email"
                  description="Optional recovery and notification address."
                  error={fieldErrorMessage("email", createScalarTouched, createSubmitted, createErrors)}
                >
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    error={fieldHasError("email", createScalarTouched, createSubmitted, createErrors)}
                    {...createRegister("email")}
                  />
                </FormField>
                <FormField
                  label="Password"
                  htmlFor="admin-password"
                  required
                  description="Minimum 12 characters; dev-only policies apply in seeded environments."
                  error={fieldErrorMessage("password", createScalarTouched, createSubmitted, createErrors)}
                >
                  <Input
                    id="admin-password"
                    type="password"
                    autoComplete="new-password"
                    error={fieldHasError("password", createScalarTouched, createSubmitted, createErrors)}
                    {...createRegister("password")}
                  />
                </FormField>
                <FormField
                  label="Initial role"
                  required
                  description="At least one role is required; server enforces RBAC."
                  error={
                    createSubmitted || createTouched.roleKeys
                      ? (createErrors.roleKeys?.message as string | undefined)
                      : undefined
                  }
                >
                  <Controller
                    control={createControl}
                    name="roleKeys"
                    render={({ field }) => (
                      <FilterSelect
                        value={field.value[0] ?? ""}
                        onChange={(v) => field.onChange(v ? [v] : [])}
                        options={roleOptions}
                        placeholder="Initial role"
                        aria-label="Initial role"
                      />
                    )}
                  />
                </FormField>
                <Button type="submit" loading={createMutation.isPending}>
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}
        {usersQuery.data && (
          <DataTable columns={columns} data={usersQuery.data} getRowId={(r) => r.userId} />
        )}
      </SectionCard>

      <SectionCard title="Available roles">
        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Permission keys are attached to roles on the server — this UI does not edit permission matrices.
        </p>
        <ul className="text-sm space-y-1">
          {(rolesQuery.data ?? []).map((role) => (
            <li key={role.roleId}>
              <span className="font-mono text-xs">{role.roleKey}</span> — {role.displayName}
            </li>
          ))}
        </ul>
      </SectionCard>

      <Dialog open={editUser !== null} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editUser?.username}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <EditUserForm
              user={editUser}
              onSubmit={(body) => updateMutation.mutate({ id: editUser.userId, body })}
              pending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rolesUser !== null} onOpenChange={(open) => !open && setRolesUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roles — {rolesUser?.username}</DialogTitle>
          </DialogHeader>
          {rolesUser && (
            <RolesForm
              user={rolesUser}
              roleOptions={roleOptions}
              onSubmit={(body) => rolesMutation.mutate({ id: rolesUser.userId, body })}
              pending={rolesMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditUserForm({
  user,
  onSubmit,
  pending,
}: {
  user: AdminUser;
  onSubmit: (body: UpdateAdminUserInput) => void;
  pending: boolean;
}) {
  const form = useForm<UpdateAdminUserInput>({
    resolver: zodResolver(updateAdminUserSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: user.displayName,
      email: user.email,
      isActive: user.isActive,
      isLocked: user.isLocked,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields, isSubmitted },
  } = form;

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField
        label="Display name"
        htmlFor="edit-displayName"
        description="Name shown in audit trails and assignments."
        error={fieldErrorMessage("displayName", touchedFields, isSubmitted, errors)}
      >
        <Input
          id="edit-displayName"
          error={fieldHasError("displayName", touchedFields, isSubmitted, errors)}
          {...register("displayName")}
        />
      </FormField>
      <FormField
        label="Email"
        htmlFor="edit-email"
        description="Leave blank to clear the address on the server."
        error={fieldErrorMessage("email", touchedFields, isSubmitted, errors)}
      >
        <Input
          id="edit-email"
          type="email"
          error={fieldHasError("email", touchedFields, isSubmitted, errors)}
          {...register("email")}
        />
      </FormField>
      <FormField label="Account status" description="Active users may sign in; locked accounts cannot.">
        <div className="flex flex-col gap-2 pt-1">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                Active
              </label>
            )}
          />
          <Controller
            control={control}
            name="isLocked"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                Locked
              </label>
            )}
          />
        </div>
      </FormField>
      <Button type="submit" loading={pending}>
        Save
      </Button>
    </form>
  );
}

function RolesForm({
  user,
  roleOptions,
  onSubmit,
  pending,
}: {
  user: AdminUser;
  roleOptions: Array<{ value: string; label: string }>;
  onSubmit: (body: SetUserRolesInput) => void;
  pending: boolean;
}) {
  const initial = user.userRoles.map((ur) => ur.role.roleKey);
  const form = useForm<SetUserRolesInput>({
    resolver: zodResolver(setUserRolesSchema),
    defaultValues: { roleKeys: initial },
  });

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        control={form.control}
        name="roleKeys"
        render={({ field }) => (
          <FilterSelect
            value={field.value[0] ?? ""}
            onChange={(v) => field.onChange(v ? [v] : [])}
            options={roleOptions}
            placeholder="Primary role"
            aria-label="Role"
          />
        )}
      />
      <p className="text-xs text-muted-foreground">
        Backend replaces the full role set — select the intended role keys (multi-role UI pending richer control).
      </p>
      <Button type="submit" disabled={pending}>
        Update roles
      </Button>
    </form>
  );
}
