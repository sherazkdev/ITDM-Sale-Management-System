"use client";

import { useMemo, useState } from "react";
import { Check, Lock, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { PERMISSION_GROUPS } from "@/lib/permission-groups";
import { PermissionKeys } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { ApiClientError } from "@/lib/api/client";
import { rolePermissionKeys, type RoleAdminItem } from "@/lib/api/roles-admin";
import { RoleFormDialog } from "./RoleFormDialog";
import { roleColorHsl } from "./role-colors";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  type RoleFormInput,
} from "./useRoles";

type Selection = { roleId: string };

function isRoleMutable(role: RoleAdminItem): boolean {
  return !role.isSystem && role.roleKey !== "admin" && role.roleKey !== "it_admin_proposed";
}

export default function RolesSettingsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.rolesManage);

  const { data: roles = [], isLoading } = useRoles({ enabled: canManage });
  const systemRoles = useMemo(() => roles.filter((r) => r.isSystem), [roles]);
  const customRoles = useMemo(() => roles.filter((r) => !r.isSystem), [roles]);

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [selection, setSelection] = useState<Selection | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<RoleAdminItem | null>(null);
  const [deleting, setDeleting] = useState<RoleAdminItem | null>(null);

  const selectedRole = useMemo(() => {
    const id = selection?.roleId ?? systemRoles[0]?.roleId ?? customRoles[0]?.roleId;
    if (!id) return null;
    return roles.find((r) => r.roleId === id) ?? null;
  }, [selection, roles, systemRoles, customRoles]);

  const selectedPermissions = useMemo(() => {
    if (!selectedRole) return new Set<string>();
    return new Set(rolePermissionKeys(selectedRole));
  }, [selectedRole]);

  const openCreate = () => {
    setDialogMode("create");
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (role: RoleAdminItem) => {
    setDialogMode("edit");
    setEditing(role);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: RoleFormInput) => {
    try {
      if (dialogMode === "create") {
        const res = await createRole.mutateAsync(input);
        toast.success("Role created.");
        setSelection({ roleId: res.roleId });
      } else if (editing) {
        await updateRole.mutateAsync({ id: editing.roleId, ...input });
        toast.success("Role updated.");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Request failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRole.mutateAsync(deleting.roleId);
      toast.success("Role deleted.");
      if (selection?.roleId === deleting.roleId) {
        setSelection(systemRoles[0] ? { roleId: systemRoles[0].roleId } : null);
      }
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Delete failed");
    }
  };

  if (!canManage && !isLoading && roles.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        You need the roles.manage permission to view role administration.
      </Card>
    );
  }

  const mutable = selectedRole ? isRoleMutable(selectedRole) : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Roles
              </CardTitle>
              {canManage ? (
                <Button size="sm" variant="soft" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              System
            </p>
            {isLoading ? (
              <Skeleton className="h-9 rounded-lg mx-1" />
            ) : systemRoles.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No system roles loaded.</p>
            ) : (
              systemRoles.map((r) => {
                const active = selectedRole?.roleId === r.roleId;
                return (
                  <button
                    key={r.roleId}
                    type="button"
                    onClick={() => setSelection({ roleId: r.roleId })}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg px-3 py-2 text-left transition-colors",
                      active ? "bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="truncate max-w-[140px]">
                        {r.displayName}
                      </Badge>
                      {active ? <span className="text-xs text-primary ml-auto">Selected</span> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.description ?? `${rolePermissionKeys(r).length} permissions`}
                    </p>
                  </button>
                );
              })
            )}

            <p className="px-1 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Custom
            </p>
            {isLoading ? (
              <div className="flex flex-col gap-2 px-1">
                <Skeleton className="h-9 rounded-lg" />
                <Skeleton className="h-9 rounded-lg" />
              </div>
            ) : customRoles.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No custom roles yet.{canManage ? " Create one to tailor access." : ""}
              </p>
            ) : (
              customRoles.map((r) => {
                const active = selectedRole?.roleId === r.roleId;
                return (
                  <button
                    key={r.roleId}
                    type="button"
                    onClick={() => setSelection({ roleId: r.roleId })}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg px-3 py-2 text-left transition-colors",
                      active ? "bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(${roleColorHsl(r.colorKey)} / 0.12)`,
                          color: `hsl(${roleColorHsl(r.colorKey)})`,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: `hsl(${roleColorHsl(r.colorKey)})` }}
                        />
                        {r.displayName}
                      </span>
                      {active ? <span className="text-xs text-primary ml-auto">Selected</span> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.description ?? `${rolePermissionKeys(r).length} permissions`}
                    </p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 min-w-0">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>{selectedRole ? `${selectedRole.displayName} permissions` : "Permissions"}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRole
                    ? selectedRole.description ?? "Permissions granted to users assigned this role."
                    : "Select a role to review its permission matrix."}
                </p>
              </div>
              {selectedRole && mutable && canManage ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(selectedRole)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleting(selectedRole)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              ) : selectedRole ? (
                <Badge variant="neutral" className="gap-1.5">
                  <Lock className="h-3 w-3" /> {mutable ? "Read-only" : "System role"}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!selectedRole ? (
              <p className="text-sm text-muted-foreground">Choose a role from the list to inspect permissions.</p>
            ) : (
              PERMISSION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.permissions.map((perm) => {
                      const allowed = selectedPermissions.has(perm.key);
                      return (
                        <div
                          key={perm.key}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2",
                            allowed ? "bg-success-soft/40" : "bg-muted/40",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{perm.label}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">{perm.key}</p>
                          </div>
                          {allowed ? (
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <X className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <RoleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editing}
        submitting={createRole.isPending || updateRole.isPending}
        onSubmit={handleSubmit}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role?</DialogTitle>
            <DialogDescription>
              {deleting ? (
                <>
                  The <span className="font-medium text-foreground">{deleting.displayName}</span> role will be
                  permanently removed. This cannot be undone.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteRole.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleteRole.isPending}>
              <Trash2 className="h-4 w-4" /> Delete role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
