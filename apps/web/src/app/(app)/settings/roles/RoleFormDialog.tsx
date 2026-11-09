"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Info, Search } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { SELECTABLE_PERMISSION_GROUPS } from "@/lib/permission-groups";
import type { PermissionKey } from "@/lib/permissions";
import { ROLE_SWATCHES } from "./role-colors";
import { cn } from "@/lib/utils";
import type { RoleAdminItem, RoleFormInput } from "./useRoles";
import { FormField } from "@/components/forms/FormField";

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
  const [permQuery, setPermQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDisplayName(initial?.displayName ?? "");
    setDescription(initial?.description ?? "");
    setColorKey(initial?.colorKey ?? "violet");
    const keys = initial?.rolePermissions.map((rp) => rp.permission.permissionKey) ?? [];
    setPermissions(new Set(keys as PermissionKey[]));
    setPermQuery("");
    setTouched(false);
    setCollapsed({});
  }, [open, initial]);

  const totalPermissions = useMemo(
    () => SELECTABLE_PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0),
    [],
  );

  const filteredGroups = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return SELECTABLE_PERMISSION_GROUPS;
    return SELECTABLE_PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      ),
    })).filter((g) => g.permissions.length > 0);
  }, [permQuery]);

  const nameError =
    touched && displayName.trim().length === 0 ? "Role name is required." : undefined;

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
    setTouched(true);
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

  const toggleCollapsed = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-border">
          <DialogTitle>{mode === "create" ? "Create custom role" : `Edit ${initial?.displayName ?? "role"}`}</DialogTitle>
          <DialogDescription>
            Define a name and choose exactly which permissions members of this role receive. Backend
            authorization remains authoritative.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 flex flex-col gap-5">
          <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Role name"
                htmlFor="role-name"
                required
                error={nameError}
                description="A clear label shown when assigning roles to users."
                maxLength={128}
                currentLength={displayName.length}
              >
                <Input
                  id="role-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="e.g. Asset coordinator"
                  maxLength={128}
                  error={!!nameError}
                />
              </FormField>
              <FormField label="Accent color" description="Helps distinguish custom roles in the directory.">
                <div className="flex flex-wrap gap-2 pt-1">
                  {ROLE_SWATCHES.map((c) => {
                    const active = colorKey === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColorKey(c.id)}
                        className={cn(
                          "relative h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow",
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
              </FormField>
            </div>
            <FormField
              label="Description"
              htmlFor="role-desc"
              description="Optional summary of when to assign this role."
              maxLength={240}
              currentLength={description.length}
            >
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What can this role do?"
                maxLength={240}
              />
            </FormField>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Permission matrix</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {permissions.size} of {totalPermissions} permissions selected
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={permQuery}
                  onChange={(e) => setPermQuery(e.target.value)}
                  placeholder="Search permissions…"
                  className="pl-8 h-9"
                  aria-label="Search permissions"
                />
              </div>
            </div>

            <div className="flex gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p>
                <span className="font-medium text-foreground">financial.corrections</span> is admin-only and
                cannot be assigned to custom roles. Group &quot;Select all&quot; never grants protected permissions.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {filteredGroups.map((group) => {
                const groupKeys = group.permissions.map((p) => p.key);
                const allOn = groupKeys.length > 0 && groupKeys.every((k) => permissions.has(k));
                const selectedCount = groupKeys.filter((k) => permissions.has(k)).length;
                const isCollapsed = collapsed[group.label] ?? false;

                return (
                  <div key={group.label} className="rounded-xl border border-border overflow-hidden bg-card">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-left min-w-0"
                        onClick={() => toggleCollapsed(group.label)}
                        aria-expanded={!isCollapsed}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            isCollapsed && "-rotate-90",
                          )}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                          {group.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {selectedCount}/{groupKeys.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupKeys, allOn)}
                        className="text-xs font-medium text-primary hover:underline shrink-0"
                      >
                        {allOn ? "Clear group" : "Select group"}
                      </button>
                    </div>
                    {!isCollapsed ? (
                      <div className="divide-y divide-border">
                        {group.permissions.map((perm) => {
                          const on = permissions.has(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{perm.label}</p>
                                <p className="text-xs text-muted-foreground">{perm.description}</p>
                              </div>
                              <Switch
                                checked={on}
                                onCheckedChange={() => togglePermission(perm.key)}
                                aria-label={perm.label}
                              />
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {filteredGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No permissions match your search.</p>
              ) : null}
            </div>
          </section>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
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
