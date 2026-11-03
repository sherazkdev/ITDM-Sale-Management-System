"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { ListToolbar } from "@/components/crud/ListToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/common/FilterSelect";
import { fetchEmployees, type Employee } from "@/lib/api/employees";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ListPageKpiBand } from "@/components/crud/ListPageKpiBand";
import { SectionCard } from "@/components/common/SectionCard";
import { useListMetaTotals } from "@/lib/hooks/use-list-meta";
import { ApiClientError } from "@/lib/api/client";

export default function EmployeesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["employees", page, pageSize, debouncedSearch, activeFilter],
    queryFn: () =>
      fetchEmployees({ page, pageSize, search: debouncedSearch || undefined, isActive }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const metaTotals = useListMetaTotals(["employees", "summary"], fetchEmployees, {
    includeInactive: true,
  });

  const columns: Column<Employee>[] = [
    {
      key: "employeeNumber",
      header: "Number",
      sortable: true,
      cell: (e) => <span className="font-medium tabular">{e.employeeNumber}</span>,
    },
    {
      key: "fullName",
      header: "Name",
      sortable: true,
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
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search name or number…"
        filters={
          <FilterSelect
            aria-label="Status filter"
            value={activeFilter === "all" ? "" : activeFilter}
            onChange={(v) => {
              setActiveFilter(v || "all");
              setPage(1);
            }}
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
          {error instanceof ApiClientError ? error.message : "Failed to load employees."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <SectionCard flush className="shadow-soft">
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(e) => e.employeeId}
          loading={isLoading}
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
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            itemLabel="employees"
          />
        </div>
      </SectionCard>
    </div>
  );
}
