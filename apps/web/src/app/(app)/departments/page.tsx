"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { DataTableToolbar } from "@/components/common/DataTableToolbar";
import { ImportModal } from "@/components/data-management/ImportModal";
import { ExportMenu } from "@/components/data-management/ExportMenu";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { ListToolbar } from "@/components/crud/ListToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/common/FilterSelect";
import { SectionCard } from "@/components/common/SectionCard";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import {
  createDepartment,
  fetchDepartments,
  updateDepartment,
  type Department,
} from "@/lib/api/departments";
import { DepartmentFormDialog, type DepartmentFormValues } from "./DepartmentFormDialog";

const DEPT_LIST_DEFAULTS = { page: 1, pageSize: 20, active: "all" };

export default function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.departmentsManage);
  const canRead = hasPermission(PermissionKeys.departmentsRead);
  const queryClient = useQueryClient();

  const list = useServerListTable({ defaults: DEPT_LIST_DEFAULTS });
  const activeFilter = list.extras.active ?? "all";
  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Department | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["departments", list.page, list.pageSize, list.debouncedSearch, activeFilter],
    queryFn: () =>
      fetchDepartments({
        page: list.page,
        pageSize: list.pageSize,
        search: list.debouncedSearch || undefined,
        isActive,
      }),
    enabled: canRead,
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      toast.success("Department created");
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Create failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: DepartmentFormValues }) =>
      updateDepartment(id, {
        departmentName: body.departmentName,
        description: body.description?.trim() ? body.description.trim() : null,
        isActive: body.isActive,
      }),
    onSuccess: () => {
      toast.success("Department updated");
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Update failed"),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const columns: Column<Department>[] = [
    {
      key: "departmentName",
      header: "Department",
      cell: (d) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{d.departmentName}</p>
          <p className="text-xs text-muted-foreground truncate">{d.departmentCode}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      hideOnMobile: true,
      cell: (d) => d.description ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "employees",
      header: "Employees",
      hideOnMobile: true,
      cell: (d) => (
        <span className="tabular text-sm">{d._count?.employees ?? 0}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (d) => <StatusPill status={d.isActive ? "active" : "inactive"} dot />,
    },
  ];

  const openCreate = () => {
    setDialogMode("create");
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: Department) => {
    setDialogMode("edit");
    setEditing(row);
    setDialogOpen(true);
  };

  const handleSubmit = (values: DepartmentFormValues) => {
    if (dialogMode === "create") {
      createMutation.mutate({
        departmentName: values.departmentName.trim(),
        departmentCode: values.departmentCode?.trim() || undefined,
        description: values.description?.trim() || undefined,
      });
    } else if (editing) {
      updateMutation.mutate({ id: editing.departmentId, body: values });
    }
  };

  if (!canRead) {
    return (
      <div className="page-stack">
        <PageHeader title="Departments" description="Organization structure." />
        <Card className="p-6 text-sm text-muted-foreground">
          You need the departments.read permission to view departments.
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Organization"
        title="Departments"
        description="Canonical department catalog linked to employees and reporting."
        actions={
          canManage ? (
            <Button size="md" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add department
            </Button>
          ) : null
        }
      />

      <ListToolbar
        search={list.search}
        onSearchChange={(v) => list.patch({ search: v, page: 1 })}
        searchPlaceholder="Search name or code…"
        filters={
          <FilterSelect
            aria-label="Status filter"
            value={activeFilter === "all" ? "" : activeFilter}
            onChange={(v) => list.patch({ extras: { active: v || "all" }, page: 1 })}
            placeholder="All statuses"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        }
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive border-destructive/30">
          {error instanceof ApiClientError ? error.message : "Failed to load departments."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <SectionCard flush className="shadow-soft">
        <DataTableToolbar
          rangeLabel={`${total === 0 ? "No" : total} department${total === 1 ? "" : "s"} in view`}
          trailing={
            <div className="flex flex-wrap items-center gap-2">
              {canManage ? <ImportModal entity="departments" /> : null}
              {canRead ? (
                <ExportMenu
                  entity="departments"
                  filterParams={{
                    search: list.debouncedSearch || undefined,
                    active: activeFilter !== "all" ? activeFilter : undefined,
                  }}
                />
              ) : null}
            </div>
          }
        />
        <DataTable
          tableId="departments"
          data={rows}
          columns={columns}
          getRowId={(d) => d.departmentId}
          loading={isLoading}
          caption="Department catalog"
          onRowClick={canManage ? (d) => openEdit(d) : undefined}
          empty={
            <EmptyState
              icon={Building2}
              title="No departments found"
              description="Adjust filters or add a department."
            />
          }
          className="border-0 shadow-none rounded-none"
        />
        <div className="border-t border-border px-4 py-3 md:px-6">
          <Pagination
            page={list.page}
            totalPages={totalPages}
            total={total}
            pageSize={list.pageSize}
            onPageChange={(p) => list.patch({ page: p })}
            onPageSizeChange={(s) => list.patch({ pageSize: s, page: 1 })}
            itemLabel="departments"
          />
        </div>
      </SectionCard>

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editing}
        submitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
