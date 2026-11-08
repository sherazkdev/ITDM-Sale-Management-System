"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserCheck, Users } from "lucide-react";

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
import { fetchEmployees, type Employee } from "@/lib/api/employees";
import { fetchDepartmentSelectOptions } from "@/lib/api/departments";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ListPageKpiBand } from "@/components/crud/ListPageKpiBand";
import { SectionCard } from "@/components/common/SectionCard";
import { useListMetaTotals } from "@/lib/hooks/use-list-meta";
import { ApiClientError } from "@/lib/api/client";

const EMPLOYEE_LIST_DEFAULTS = { page: 1, pageSize: 20, active: "all", departmentId: "" };

export default function EmployeesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const list = useServerListTable({ defaults: EMPLOYEE_LIST_DEFAULTS, defaultSortBy: "employeeNumber" });
  const activeFilter = list.extras.active ?? "all";
  const departmentFilter = list.extras.departmentId ?? "";

  const { data: departmentOptions = [] } = useQuery({
    queryKey: ["departments", "select-options"],
    queryFn: () => fetchDepartmentSelectOptions(),
    staleTime: 60_000,
  });

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const sortParams = useMemo(
    () => ({
      sortBy: list.sortBy || "employeeNumber",
      sortDir: list.sortDir,
    }),
    [list.sortBy, list.sortDir],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "employees",
      list.page,
      list.pageSize,
      list.debouncedSearch,
      activeFilter,
      departmentFilter,
      sortParams.sortBy,
      sortParams.sortDir,
    ],
    queryFn: () =>
      fetchEmployees({
        page: list.page,
        pageSize: list.pageSize,
        search: list.debouncedSearch || undefined,
        isActive,
        departmentId: departmentFilter || undefined,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const metaTotals = useListMetaTotals(["employees", "summary"], fetchEmployees, {
    includeInactive: true,
  });

  const columns: Column<Employee>[] = [
    {
      key: "employeeNumber",
      header: "Number",
      sortable: true,
      serverSortKey: "employeeNumber",
      cell: (e) => <span className="font-medium tabular">{e.employeeNumber}</span>,
    },
    {
      key: "fullName",
      header: "Name",
      sortable: true,
      serverSortKey: "fullName",
      cell: (e) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{e.fullName}</p>
          {e.email ? <p className="text-xs text-muted-foreground truncate">{e.email}</p> : null}
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      hideOnMobile: true,
      cell: (e) => e.department ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "designation",
      header: "Designation",
      hideOnMobile: true,
      cell: (e) => e.designation ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "isActive",
      header: "Status",
      cell: (e) => <StatusPill status={e.isActive ? "active" : "inactive"} dot />,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Directory"
        title="Employees"
        description="Employee directory and lifecycle records. Search, filter, and open profiles from the table below."
        actions={
          hasPermission(PermissionKeys.employeesWrite) ? (
            <Button asChild size="md">
              <Link href="/employees/new">
                <Plus className="h-4 w-4" />
                Add employee
              </Link>
            </Button>
          ) : null
        }
      />

      <ListPageKpiBand
        loading={metaTotals.isLoading}
        density="compact"
        items={[
          {
            key: "total",
            label: "Total employees",
            value: metaTotals.total ?? 0,
            icon: Users,
            tone: "violet",
          },
          {
            key: "active",
            label: "Active",
            value: metaTotals.active ?? 0,
            icon: UserCheck,
            tone: "green",
          },
          {
            key: "inactive",
            label: "Inactive",
            value: metaTotals.inactive ?? 0,
            icon: Users,
            tone: "neutral",
          },
        ]}
        columns={3}
      />

      <ListToolbar
        search={list.search}
        onSearchChange={(v) => {
          list.patch({ search: v, page: 1 });
        }}
        searchPlaceholder="Search name or number…"
        filters={
          <>
            <div className="w-full sm:w-56">
              <SearchableSelect
                aria-label="Department filter"
                value={departmentFilter}
                onChange={(v) => list.patch({ extras: { departmentId: v }, page: 1 })}
                options={[{ value: "", label: "All departments" }, ...departmentOptions]}
                placeholder="All departments"
                searchPlaceholder="Filter by department…"
              />
            </div>
            <FilterSelect
              aria-label="Status filter"
              value={activeFilter === "all" ? "" : activeFilter}
              onChange={(v) => {
                list.patch({ extras: { active: v || "all" }, page: 1 });
              }}
              placeholder="All statuses"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </>
        }
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive border-destructive/30">
          {error instanceof ApiClientError ? error.message : "Failed to load employees."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <SectionCard flush className="shadow-soft">
        <DataTableToolbar
          rangeLabel={`${total === 0 ? "No" : total} employee${total === 1 ? "" : "s"} in view`}
          trailing={
            <div className="flex flex-wrap items-center gap-2">
              {hasPermission(PermissionKeys.employeesWrite) ? (
                <ImportModal entity="employees" />
              ) : null}
              {hasPermission(PermissionKeys.reportsRead) ? (
                <ExportMenu
                  entity="employees"
                  filterParams={{
                    search: list.debouncedSearch || undefined,
                    active: activeFilter !== "all" ? activeFilter : undefined,
                    departmentId: departmentFilter || undefined,
                    sortBy: sortParams.sortBy,
                    sortDir: sortParams.sortDir,
                  }}
                />
              ) : null}
            </div>
          }
        />
        <DataTable
          tableId="employees"
          data={rows}
          columns={columns}
          getRowId={(e) => e.employeeId}
          loading={isLoading}
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          caption="Employee directory"
          onRowClick={(e) => router.push(`/employees/${e.employeeId}`)}
          empty={
            <EmptyState
              icon={Users}
              title="No employees found"
              description="Adjust filters or add a new employee."
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
            onPageSizeChange={(s) => {
              list.patch({ pageSize: s, page: 1 });
            }}
            itemLabel="employees"
          />
        </div>
      </SectionCard>
    </div>
  );
}
