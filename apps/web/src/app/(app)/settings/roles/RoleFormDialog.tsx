"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SELECTABLE_PERMISSION_GROUPS } from "@/lib/permission-groups";
import type { PermissionKey } from "@/lib/permissions";
import { ROLE_SWATCHES } from "./role-colors";
import { cn } from "@/lib/utils";
import type { RoleAdminItem, RoleFormInput } from "./useRoles";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial: RoleAdminItem | null;
  submitting: boolean;
  onSubmit: (input: RoleFormInput) => Promise<void> | void;
};

export function RoleFormDialog({ open, onOpenChange, mode, initial, submitting, onSubmit }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [colorKey, setColorKey] = useState("violet");
  const [permissions, setPermissions] = useState<Set<PermissionKey>>(new Set());

  useEffect(() => {
    if (!open) return;
    setDisplayName(initial?.displayName ?? "");
    setDescription(initial?.description ?? "");
    setColorKey(initial?.colorKey ?? "violet");
    const keys = initial?.rolePermissions.map((rp) => rp.permission.permissionKey) ?? [];
    setPermissions(new Set(keys as PermissionKey[]));
  }, [open, initial]);

  const totalPermissions = useMemo(
    () => SELECTABLE_PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0),
    [],
  );

  const togglePermission = (perm: PermissionKey) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleGroup = (groupPerms: PermissionKey[], allOn: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      for (const p of groupPerms) {
        if (allOn) next.delete(p);
        else next.add(p);
      }
      return next;
    });
  };

  const canSave = displayName.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSave) return;
    await onSubmit({
      displayName: displayName.trim(),
      description:
        mode === "edit"
          ? description.trim()
            ? description.trim()
            : null
          : description.trim() || undefined,
      colorKey,
      permissionKeys: Array.from(permissions),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create custom role" : `Edit ${initial?.displayName ?? "role"}`}</DialogTitle>
          <DialogDescription>
            Define a name and choose exactly which permissions members of this role receive.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-name" required>
                Role name
              </Label>
              <Input
                id="role-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Asset coordinator"
                maxLength={128}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {ROLE_SWATCHES.map((c) => {
                  const active = colorKey === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColorKey(c.id)}
                      className={cn(
                        "relative h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow",
                        active ? "ring-foreground/40" : "ring-transparent hover:ring-border",
                      )}
                      style={{ backgroundColor: `hsl(${c.hsl})` }}
                      title={c.label}
                      aria-pressed={active}
                    >
                      {active ? <Check className="h-3.5 w-3.5 text-white mx-auto" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-desc">Description</Label>
            <Input
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What can this role do?"
              maxLength={240}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-xs text-muted-foreground tabular">
                {permissions.size} of {totalPermissions} enabled
              </span>
            </div>

            <div className="flex gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p>
                <span className="font-medium text-foreground">financial.corrections</span> is admin-only and
                cannot be assigned to custom roles. It remains on the protected Admin role only.
              </p>
            </div>

            {SELECTABLE_PERMISSION_GROUPS.map((group) => {
              const groupKeys = group.permissions.map((p) => p.key);
              const allOn = groupKeys.every((k) => permissions.has(k));
              const someOn = groupKeys.some((k) => permissions.has(k));
              return (
                <div key={group.label} className="rounded-xl border border-border">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupKeys, allOn)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {allOn ? "Clear all" : someOn ? "Select all" : "Select all"}
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {group.permissions.map((perm) => {
                      const on = permissions.has(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{perm.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{perm.description}</p>
                          </div>
                          <Switch checked={on} onCheckedChange={() => togglePermission(perm.key)} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!canSave}>
            {mode === "create" ? "Create role" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
