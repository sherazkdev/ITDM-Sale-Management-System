"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Lock, Pencil, Plus, Search, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [roleQuery, setRoleQuery] = useState("");

  const filterRole = useCallback((r: RoleAdminItem) => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.displayName.toLowerCase().includes(q) ||
      r.roleKey.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false)
    );
  }, [roleQuery]);

  const filteredSystemRoles = useMemo(() => systemRoles.filter(filterRole), [systemRoles, filterRole]);
  const filteredCustomRoles = useMemo(() => customRoles.filter(filterRole), [customRoles, filterRole]);

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
    <div className="flex flex-col gap-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-lg font-semibold tracking-tight">Roles &amp; permissions</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review system and custom roles, inspect effective permissions, and tailor access for your organization.
          Financial corrections remain on the protected Admin role only.
        </p>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Role directory
              </CardTitle>
              {canManage ? (
                <Button size="sm" variant="soft" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New
                </Button>
              ) : null}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={roleQuery}
                onChange={(e) => setRoleQuery(e.target.value)}
                placeholder="Search roles…"
                className="pl-8 h-9"
                aria-label="Search roles"
              />
            </div>
          </CardHeader>
          <CardContent className="flex max-h-52 flex-col gap-1 overflow-y-auto overscroll-contain lg:max-h-[calc(100vh-12rem)]">
            <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              System
            </p>
            {isLoading ? (
              <Skeleton className="h-9 rounded-lg mx-1" />
            ) : filteredSystemRoles.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No system roles loaded.</p>
            ) : (
              filteredSystemRoles.map((r) => {
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
                    <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{rolePermissionKeys(r).length} permissions</span>
                      {typeof r._count?.userRoles === "number" ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {r._count.userRoles}
                        </span>
                      ) : null}
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
            ) : filteredCustomRoles.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No custom roles yet.{canManage ? " Create one to tailor access." : ""}
              </p>
            ) : (
              filteredCustomRoles.map((r) => {
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
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: `hsl(${roleColorHsl(r.colorKey)})` }}
                          aria-hidden
                        />
                        {r.displayName}
                      </span>
                      {active ? <span className="text-xs text-primary ml-auto">Selected</span> : null}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{rolePermissionKeys(r).length} permissions</span>
                      {typeof r._count?.userRoles === "number" ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {r._count.userRoles}
                        </span>
                      ) : null}
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
                  <div className="divide-y divide-border">
                    {group.permissions.map((perm) => {
                      const allowed = selectedPermissions.has(perm.key);
                      return (
                        <div
                          key={perm.key}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{perm.label}</p>
                            <p className="truncate font-mono text-xs text-muted-foreground">{perm.key}</p>
                          </div>
                          {allowed ? (
                            <Check className="h-4 w-4 shrink-0 text-success" aria-label="Granted" />
                          ) : (
                            <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Not granted" />
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
    </div>
  );
}
