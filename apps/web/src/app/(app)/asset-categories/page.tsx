"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderTree, Pencil, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import {
  createAssetCategory,
  fetchAssetCategories,
  updateAssetCategory,
  type AssetCategory,
} from "@/lib/api/asset-categories";
import {
  createAssetCategorySchema,
  type CreateAssetCategoryInput,
} from "@/lib/validators/asset";
import { ImportModal } from "@/components/data-management/ImportModal";
import { ExportMenu } from "@/components/data-management/ExportMenu";
import { ApiClientError } from "@/lib/api/client";

type CategoryFormValues = CreateAssetCategoryInput;

export default function AssetCategoriesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.assetsManage);

  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<AssetCategory | null>(null);

  const { data: categories = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: fetchAssetCategories,
  });

  const createForm = useForm<CategoryFormValues>({
    resolver: zodResolver(createAssetCategorySchema),
    defaultValues: { categoryName: "", description: "" },
  });

  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(createAssetCategorySchema),
    values: editCategory
      ? {
          categoryName: editCategory.categoryName,
          description: editCategory.description ?? "",
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: createAssetCategory,
    onSuccess: () => {
      toast.success("Category created");
      void queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Create failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryFormValues }) =>
      updateAssetCategory(id, input),
    onSuccess: () => {
      toast.success("Category updated");
      void queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      setEditCategory(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const columns: Column<AssetCategory>[] = [
    {
      key: "categoryName",
      header: "Name",
      cell: (c) => <span className="font-medium">{c.categoryName}</span>,
    },
    {
      key: "description",
      header: "Description",
      cell: (c) => c.description ?? <span className="text-muted-foreground">—</span>,
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            cell: (c: AssetCategory) => (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditCategory(c);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            ),
          } as Column<AssetCategory>,
        ]
      : []),
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Asset categories"
        description="Category taxonomy for the asset register."
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <ImportModal entity="asset-categories" />
              <ExportMenu entity="asset-categories" />
              <Button size="md" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Add category
              </Button>
            </div>
          ) : null
        }
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load categories."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <DataTable
          data={categories}
          columns={columns}
          getRowId={(c) => c.categoryId}
          loading={isLoading}
          empty={
            <EmptyState
              icon={FolderTree}
              title="No categories"
              description="Create categories to classify assets."
            />
          }
        />
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                error={!!createForm.formState.errors.categoryName}
                {...createForm.register("categoryName")}
              />
              {createForm.formState.errors.categoryName ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.categoryName.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-desc">Description</Label>
              <Input id="create-desc" {...createForm.register("description")} />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCategory} onOpenChange={(open) => !open && setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          {editCategory ? (
            <form
              onSubmit={editForm.handleSubmit((values) =>
                updateMutation.mutate({ id: editCategory.categoryId, input: values }),
              )}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" {...editForm.register("categoryName")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-desc">Description</Label>
                <Input id="edit-desc" {...editForm.register("description")} />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setEditCategory(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={updateMutation.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
