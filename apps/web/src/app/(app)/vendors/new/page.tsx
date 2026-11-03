"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreateFormActions,
  CreateFormLayout,
} from "@/components/crud/CreateFormLayout";
import {
  CreateFormTips,
  CreateFormValidationCard,
} from "@/components/crud/CreateFormAside";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { createVendor, type Vendor } from "@/lib/api/vendors";
import { createVendorSchema, type CreateVendorInput } from "@/lib/validators/vendor";
import { ApiClientError } from "@/lib/api/client";

export default function NewVendorPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.vendorsManage);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateVendorInput>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: {
      vendorName: "",
      registrationNumber: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createVendor,
    onSuccess: (vendor: Vendor) => {
      toast.success("Vendor created");
      router.push(`/vendors/${vendor.vendorId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create vendor");
    },
  });

  if (!canManage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader variant="standard" title="Add vendor" description="Create a new vendor record." />
        <Card className="p-6 text-sm text-muted-foreground">
          You need the vendors.manage permission to add vendors.{" "}
          <Link href="/vendors" className="text-primary hover:underline">
            Back to list
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader variant="standard"
        title="Add vendor"
        description="Register a vendor for procurement and maintenance."
        breadcrumbs={[{ label: "Vendors", href: "/vendors" }, { label: "New" }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/vendors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <CreateFormLayout
        aside={
          <>
            <CreateFormValidationCard requiredFields={["Vendor name"]} />
            <CreateFormTips
              tips={[
                "Registration and contact details help link contracts and purchase orders.",
                "Deactivate vendors instead of deleting when historical POs exist.",
              ]}
            />
          </>
        }
      >
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendorName">Vendor name</Label>
            <Input id="vendorName" error={!!errors.vendorName} {...register("vendorName")} />
            {errors.vendorName ? (
              <p className="text-xs text-destructive">{errors.vendorName.message}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="registrationNumber">Registration number</Label>
              <Input id="registrationNumber" {...register("registrationNumber")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input id="contactPerson" {...register("contactPerson")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" error={!!errors.email} {...register("email")} />
              {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>
            </CardContent>
          </Card>
          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/vendors">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Create vendor
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}
