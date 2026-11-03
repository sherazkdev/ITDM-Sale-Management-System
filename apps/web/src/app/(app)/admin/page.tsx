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
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
      email: "",
      roleKeys: [],
    },
  });

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
                onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}
              >
                <Input placeholder="Username" {...createForm.register("username")} />
                <Input placeholder="Display name" {...createForm.register("displayName")} />
                <Input type="email" placeholder="Email (optional)" {...createForm.register("email")} />
                <Input type="password" placeholder="Password (min 12 chars)" {...createForm.register("password")} />
                <Controller
                  control={createForm.control}
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
                <Button type="submit" disabled={createMutation.isPending}>
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
    defaultValues: {
      displayName: user.displayName,
      email: user.email,
      isActive: user.isActive,
      isLocked: user.isLocked,
    },
  });

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("displayName")} />
      <Input type="email" {...form.register("email")} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isActive")} /> Active
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isLocked")} /> Locked
      </label>
      <Button type="submit" disabled={pending}>
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
