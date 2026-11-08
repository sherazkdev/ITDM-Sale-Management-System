"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftRight, RotateCcw, Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterSelect } from "@/components/common/FilterSelect";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { WorkflowSection } from "@/components/premium/WorkflowSection";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { fetchEmployees } from "@/lib/api/employees";
import { fetchAssets, type Asset } from "@/lib/api/assets";
import { issueAssets, returnAssets } from "@/lib/api/asset-movements";
import {
  issueAssetsSchema,
  returnAssetsSchema,
  type IssueAssetsInput,
  type ReturnAssetsInput,
} from "@/lib/validators/asset-movement";
import { ApiClientError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

type IssueFormValues = IssueAssetsInput;
type ReturnFormValues = ReturnAssetsInput;

function movementSuccessToast(documentId: string, kind: "issue" | "return") {
  toast.success(kind === "issue" ? "Assets issued" : "Assets returned", {
    description: (
      <Link href={`/asset-history?documentId=${encodeURIComponent(documentId)}`} className="underline">
        Document {documentId}
      </Link>
    ),
  });
}

function AssetCheckboxList({
  assets,
  selected,
  onToggle,
  conditionNotes,
  onConditionChange,
  loading,
}: {
  assets: Asset[];
  selected: Set<string>;
  onToggle: (assetId: string, checked: boolean) => void;
  conditionNotes: Record<string, string>;
  onConditionChange: (assetId: string, value: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading assets…</p>;
  }
  if (assets.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No eligible assets"
        description="Nothing available for this employee or status filter."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {assets.map((asset) => {
        const checked = selected.has(asset.assetId);
        return (
          <li
            key={asset.assetId}
            className={`rounded-lg border p-3 transition-colors ${
              checked ? "border-primary/40 bg-primary/[0.03]" : "border-border bg-card"
            }`}
          >
            <Checkbox
              checked={checked}
              onChange={(e) => onToggle(asset.assetId, e.target.checked)}
              label={
                <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0.5">
                  <span className="font-semibold tabular text-foreground break-all">{asset.assetCode}</span>
                  <span className="text-sm text-muted-foreground break-words">{asset.assetName}</span>
                  <Badge variant="neutral" className="w-fit shrink-0 text-[10px]">
                    {asset.assetStatus.replace(/_/g, " ")}
                  </Badge>
                </span>
              }
            />
            {checked ? (
              <div className="mt-3 pl-6 border-t border-border pt-3">
                <Label htmlFor={`notes-${asset.assetId}`} className="text-xs text-muted-foreground">
                  Condition notes (optional)
                </Label>
                <Input
                  id={`notes-${asset.assetId}`}
                  className="mt-1.5"
                  value={conditionNotes[asset.assetId] ?? ""}
                  onChange={(e) => onConditionChange(asset.assetId, e.target.value)}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function AssetIssuancePage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const employeeSearch = searchParams.get("employee")?.trim() ?? "";
  const { hasPermission } = useAuth();
  const canIssue = hasPermission(PermissionKeys.assetsIssue);
  const canReturn = hasPermission(PermissionKeys.assetsReturn);

  const [issueSelected, setIssueSelected] = useState<Set<string>>(() => new Set());
  const [issueNotes, setIssueNotes] = useState<Record<string, string>>({});
  const [issueAssetCache, setIssueAssetCache] = useState<Record<string, Asset>>({});
  const [issueAssetSearch, setIssueAssetSearch] = useState("");
  const debouncedIssueAssetSearch = useDebouncedValue(issueAssetSearch);
  const [returnSelected, setReturnSelected] = useState<Set<string>>(() => new Set());
  const [returnNotes, setReturnNotes] = useState<Record<string, string>>({});
  const [returnAssetCache, setReturnAssetCache] = useState<Record<string, Asset>>({});
  const [returnAssetSearch, setReturnAssetSearch] = useState("");
  const debouncedReturnAssetSearch = useDebouncedValue(returnAssetSearch);
  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false);
  const [pendingIssue, setPendingIssue] = useState<IssueFormValues | null>(null);

  const { data: employeePage, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees", "select", "issuance", employeeSearch],
    queryFn: () =>
      fetchEmployees({
        page: 1,
        pageSize: 100,
        isActive: true,
        search: employeeSearch || undefined,
      }),
  });

  const employeeOptions = useMemo(
    () =>
      (employeePage?.data ?? []).map((e) => ({
        value: e.employeeId,
        label: `${e.fullName} (${e.employeeNumber})`,
        hint: e.department ?? undefined,
      })),
    [employeePage?.data],
  );

  const issueForm = useForm<IssueFormValues>({
    defaultValues: {
      employeeId: "",
      receivingDepartment: "",
      referenceNumber: "",
      occurredAt: "",
      assets: [],
    },
  });

  const returnForm = useForm<ReturnFormValues>({
    defaultValues: {
      employeeId: "",
      referenceNumber: "",
      occurredAt: "",
      assets: [],
    },
  });

  const issueEmployeeId = issueForm.watch("employeeId");
  const issueDepartment = issueForm.watch("receivingDepartment");
  const returnEmployeeId = returnForm.watch("employeeId");

  useEffect(() => {
    if (!issueEmployeeId) return;
    const emp = employeePage?.data?.find((e) => e.employeeId === issueEmployeeId);
    if (emp?.department && !issueForm.getValues("receivingDepartment")) {
      issueForm.setValue("receivingDepartment", emp.department, { shouldDirty: true });
    }
  }, [issueEmployeeId, employeePage?.data, issueForm]);

  const { data: inStockPage, isLoading: inStockLoading } = useQuery({
    queryKey: ["assets", "IN_STOCK", "issuance", debouncedIssueAssetSearch],
    queryFn: () =>
      fetchAssets({
        page: 1,
        pageSize: 100,
        status: "IN_STOCK",
        search: debouncedIssueAssetSearch || undefined,
      }),
    enabled: canIssue,
  });

  const inStockAssets = useMemo(() => inStockPage?.data ?? [], [inStockPage?.data]);

  const visibleIssueAssets = useMemo(() => {
    const seen = new Set(inStockAssets.map((a) => a.assetId));
    const retained = [...issueSelected]
      .filter((id) => !seen.has(id))
      .map((id) => issueAssetCache[id])
      .filter((a): a is Asset => Boolean(a));
    return [...retained, ...inStockAssets];
  }, [inStockAssets, issueSelected, issueAssetCache]);

  const { data: issuedPage, isLoading: issuedLoading } = useQuery({
    queryKey: ["assets", "ISSUED", "return", returnEmployeeId, debouncedReturnAssetSearch],
    queryFn: () =>
      fetchAssets({
        page: 1,
        pageSize: 100,
        status: "ISSUED",
        search: debouncedReturnAssetSearch || undefined,
      }),
    enabled: canReturn && !!returnEmployeeId,
  });

  const issuedForEmployee = useMemo(
    () =>
      (issuedPage?.data ?? []).filter(
        (a) => a.currentAssigneeEmployeeId === returnEmployeeId,
      ),
    [issuedPage?.data, returnEmployeeId],
  );

  const visibleReturnAssets = useMemo(() => {
    const seen = new Set(issuedForEmployee.map((a) => a.assetId));
    const retained = [...returnSelected]
      .filter((id) => !seen.has(id))
      .map((id) => returnAssetCache[id])
      .filter((a): a is Asset => Boolean(a));
    return [...retained, ...issuedForEmployee];
  }, [issuedForEmployee, returnSelected, returnAssetCache]);

  const invalidateAfterMovement = () => {
    void queryClient.invalidateQueries({ queryKey: ["assets"] });
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const issueMutation = useMutation({
    mutationFn: issueAssets,
    onSuccess: (doc) => {
      setIssueConfirmOpen(false);
      setPendingIssue(null);
      movementSuccessToast(doc.documentId, "issue");
      invalidateAfterMovement();
      setIssueSelected(new Set());
      setIssueNotes({});
      issueForm.reset({
        employeeId: issueEmployeeId,
        receivingDepartment: issueDepartment,
        referenceNumber: "",
        occurredAt: "",
        assets: [],
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Issue failed");
    },
  });

  const returnMutation = useMutation({
    mutationFn: returnAssets,
    onSuccess: (doc) => {
      movementSuccessToast(doc.documentId, "return");
      invalidateAfterMovement();
      setReturnSelected(new Set());
      setReturnNotes({});
      returnForm.reset({
        employeeId: returnEmployeeId,
        referenceNumber: "",
        occurredAt: "",
        assets: [],
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Return failed");
    },
  });

  const toggleIssueAsset = (assetId: string, checked: boolean) => {
    setIssueSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(assetId);
      else next.delete(assetId);
      return next;
    });
    if (checked) {
      const asset = inStockAssets.find((a) => a.assetId === assetId) ?? issueAssetCache[assetId];
      if (asset) {
        setIssueAssetCache((prev) => ({ ...prev, [assetId]: asset }));
      }
    }
  };

  const toggleReturnAsset = (assetId: string, checked: boolean) => {
    setReturnSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(assetId);
      else next.delete(assetId);
      return next;
    });
    if (checked) {
      const asset =
        issuedForEmployee.find((a) => a.assetId === assetId) ?? returnAssetCache[assetId];
      if (asset) {
        setReturnAssetCache((prev) => ({ ...prev, [assetId]: asset }));
      }
    }
  };

  const clearIssueSelection = () => {
    setIssueSelected(new Set());
    setIssueNotes({});
    setIssueAssetCache({});
  };

  const clearReturnSelection = () => {
    setReturnSelected(new Set());
    setReturnNotes({});
    setReturnAssetCache({});
  };

  const submitIssue = issueForm.handleSubmit(() => {
    const assets = [...issueSelected].map((assetId) => ({
      assetId,
      conditionNotes: issueNotes[assetId] ?? "",
    }));
    const parsed = issueAssetsSchema.safeParse({
      employeeId: issueEmployeeId,
      receivingDepartment: issueForm.getValues("receivingDepartment"),
      referenceNumber: issueForm.getValues("referenceNumber"),
      occurredAt: issueForm.getValues("occurredAt"),
      assets,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setPendingIssue(parsed.data);
    setIssueConfirmOpen(true);
  });

  const submitReturn = returnForm.handleSubmit(() => {
    const assets = [...returnSelected].map((assetId) => ({
      assetId,
      conditionNotes: returnNotes[assetId] ?? "",
    }));
    const parsed = returnAssetsSchema.safeParse({
      employeeId: returnEmployeeId,
      referenceNumber: returnForm.getValues("referenceNumber"),
      occurredAt: returnForm.getValues("occurredAt"),
      assets,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    returnMutation.mutate(parsed.data);
  });

  if (!canIssue && !canReturn) {
    return (
      <div className="page-stack">
        <PageHeader
          variant="standard"
          title="Issuance & returns"
          description="Issue and return workflows."
        />
        <Card className="p-6 text-sm text-muted-foreground">
          You need assets.issue or assets.return permission to use this module.
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Inventory"
        title="Issuance & returns"
        description="Issue in-stock assets to employees and process returns. Selections are submitted as atomic movements with audit history."
      />

      <Tabs defaultValue={canIssue ? "issue" : "return"} className="w-full">
        <TabsList className="flex h-auto min-h-11 max-w-full flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {canIssue ? (
            <TabsTrigger value="issue" className="shrink-0 rounded-md px-3 text-sm data-[state=active]:bg-card data-[state=active]:shadow-card sm:px-4">
              Issue assets
            </TabsTrigger>
          ) : null}
          {canReturn ? (
            <TabsTrigger value="return" className="shrink-0 rounded-md px-3 text-sm data-[state=active]:bg-card data-[state=active]:shadow-card sm:px-4">
              Return assets
            </TabsTrigger>
          ) : null}
        </TabsList>

        {canIssue ? (
          <TabsContent value="issue" className="mt-6 space-y-6">
            <form onSubmit={submitIssue} className="flex flex-col gap-6" noValidate>
              <WorkflowSection
                step="Step 1"
                title="Issuance details"
                description="Choose the receiving employee, department snapshot, and reference for this issue."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="issue-employee">Receiving employee</Label>
                    <Controller
                      control={issueForm.control}
                      name="employeeId"
                      render={({ field }) => (
                        <SearchableSelect
                          aria-label="Receiving employee"
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            const emp = employeePage?.data?.find((e) => e.employeeId === v);
                            if (emp?.department) {
                              issueForm.setValue("receivingDepartment", emp.department, {
                                shouldDirty: true,
                              });
                            }
                          }}
                          placeholder={employeesLoading ? "Loading…" : "Search employees…"}
                          searchPlaceholder="Search by name or number"
                          options={employeeOptions}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="issue-dept" required>
                      Receiving department
                    </Label>
                    <Input
                      id="issue-dept"
                      placeholder="e.g. IT"
                      {...issueForm.register("receivingDepartment", { required: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recorded on the issuance document and does not update the employee master record.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="issue-ref">Reference number</Label>
                    <Input id="issue-ref" {...issueForm.register("referenceNumber")} />
                  </div>
                </div>
              </WorkflowSection>

              <WorkflowSection
                step="Step 2"
                title="Available assets"
                description="Search and select one or more in-stock assets to issue. Selected assets stay checked if they leave the current filter."
              >
                <div className="mb-4 flex flex-col gap-3">
                  <Input
                    value={issueAssetSearch}
                    onChange={(e) => setIssueAssetSearch(e.target.value)}
                    placeholder="Filter by code, name, or serial…"
                    leftIcon={<Search className="h-4 w-4" />}
                    aria-label="Filter available assets"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground min-w-0">
                      <span className="font-semibold text-foreground tabular">{issueSelected.size}</span>{" "}
                      selected
                      {debouncedIssueAssetSearch ? (
                        <span className="ml-2">· showing matches for “{debouncedIssueAssetSearch}”</span>
                      ) : null}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={clearIssueSelection}
                      disabled={issueSelected.size === 0}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Clear selection
                    </Button>
                  </div>
                </div>
                <AssetCheckboxList
                  assets={visibleIssueAssets}
                  selected={issueSelected}
                  onToggle={toggleIssueAsset}
                  conditionNotes={issueNotes}
                  onConditionChange={(id, v) => setIssueNotes((prev) => ({ ...prev, [id]: v }))}
                  loading={inStockLoading}
                />
              </WorkflowSection>

              <WorkflowSection step="Step 3" title="Submit issue">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {issueSelected.size === 0
                      ? "Select at least one asset to continue."
                      : `Ready to issue ${issueSelected.size} asset(s).`}
                  </p>
                  <Button
                    type="submit"
                    loading={issueMutation.isPending}
                    disabled={
                      issueMutation.isPending ||
                      issueSelected.size === 0 ||
                      !issueEmployeeId ||
                      !issueDepartment?.trim()
                    }
                  >
                    Review issue
                  </Button>
                </div>
              </WorkflowSection>
              <ConfirmDialog
                open={issueConfirmOpen}
                onOpenChange={setIssueConfirmOpen}
                title="Confirm asset issuance"
                description={
                  pendingIssue
                    ? `Issue ${pendingIssue.assets.length} asset(s) to ${employeeOptions.find((o) => o.value === pendingIssue.employeeId)?.label ?? "employee"} · Department: ${pendingIssue.receivingDepartment}`
                    : "Confirm issuance"
                }
                confirmLabel="Issue assets"
                loading={issueMutation.isPending}
                onConfirm={() => {
                  if (pendingIssue) issueMutation.mutate(pendingIssue);
                }}
              />
            </form>
          </TabsContent>
        ) : null}

        {canReturn ? (
          <TabsContent value="return" className="mt-6 space-y-6">
            <form onSubmit={submitReturn} className="flex flex-col gap-6" noValidate>
              <WorkflowSection
                step="Step 1"
                title="Return details"
                description="Select the employee returning previously issued assets."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="return-employee">Employee</Label>
                    <Controller
                      control={returnForm.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FilterSelect
                          aria-label="Employee"
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            setReturnSelected(new Set());
                            setReturnNotes({});
                            setReturnAssetCache({});
                            setReturnAssetSearch("");
                          }}
                          placeholder={employeesLoading ? "Loading…" : "Select employee"}
                          options={employeeOptions}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="return-ref">Reference number</Label>
                    <Input id="return-ref" {...returnForm.register("referenceNumber")} />
                  </div>
                </div>
              </WorkflowSection>

              <WorkflowSection
                step="Step 2"
                title="Issued assets for employee"
                description="Only assets currently issued to the selected employee are listed. Use search to narrow large inventories."
              >
                <div className="mb-4 flex flex-col gap-3">
                  <Input
                    value={returnAssetSearch}
                    onChange={(e) => setReturnAssetSearch(e.target.value)}
                    placeholder="Filter by code, name, or serial…"
                    leftIcon={<Search className="h-4 w-4" />}
                    aria-label="Filter issued assets"
                    disabled={!returnEmployeeId}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground min-w-0">
                      <span className="font-semibold text-foreground tabular">{returnSelected.size}</span>{" "}
                      selected
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearReturnSelection}
                      disabled={returnSelected.size === 0}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Clear selection
                    </Button>
                  </div>
                </div>
                <AssetCheckboxList
                  assets={visibleReturnAssets}
                  selected={returnSelected}
                  onToggle={toggleReturnAsset}
                  conditionNotes={returnNotes}
                  onConditionChange={(id, v) => setReturnNotes((prev) => ({ ...prev, [id]: v }))}
                  loading={!returnEmployeeId || issuedLoading}
                />
              </WorkflowSection>

              <WorkflowSection step="Step 3" title="Submit return">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {returnSelected.size === 0
                      ? "Select assets to return."
                      : `Ready to return ${returnSelected.size} asset(s).`}
                  </p>
                  <Button
                    type="submit"
                    loading={returnMutation.isPending}
                    disabled={
                      returnMutation.isPending ||
                      returnSelected.size === 0 ||
                      !returnEmployeeId
                    }
                  >
                    Return selected
                  </Button>
                </div>
              </WorkflowSection>
            </form>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
