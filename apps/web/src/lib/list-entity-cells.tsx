import Link from "next/link";
import {
  Building2,
  FileText,
  Handshake,
  KeyRound,
  Laptop,
  Package,
  Receipt,
  Users,
  Wrench,
  FolderTree,
  Bell,
} from "lucide-react";

import { EntityIdentityCell } from "@/components/common/EntityIdentityCell";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import type { Employee } from "@/lib/api/employees";
import type { Vendor } from "@/lib/api/vendors";
import type { Asset } from "@/lib/api/assets";
import type { PurchaseOrder } from "@/lib/api/purchase-orders";
import type { Contract } from "@/lib/api/contracts";
import type { Invoice } from "@/lib/api/invoices";
import type { SoftwareLicense } from "@/lib/api/software-licenses";
import type { MaintenanceRecord } from "@/lib/api/maintenance";
import type { Department } from "@/lib/api/departments";
import type { AssetCategory } from "@/lib/api/asset-categories";
import { PO_STATUS_LABELS, poStatusToPill } from "@/lib/domain/purchase-order-ui";
import { INVOICE_PAYMENT_LABELS, invoicePaymentToPill } from "@/lib/domain/invoice-ui";
import { MAINTENANCE_STATUS_LABELS, maintenanceStatusToPill } from "@/lib/domain/maintenance-ui";

export function employeeListCell(e: Employee) {
  return (
    <EntityIdentityCell
      icon={Users}
      title={e.fullName}
      subtitle={e.employeeNumber}
    />
  );
}

export function vendorListCell(v: Vendor) {
  return (
    <EntityIdentityCell
      icon={Building2}
      title={v.vendorName}
      subtitle={v.contactPerson ?? v.email ?? undefined}
    />
  );
}

export function departmentListCell(d: Department) {
  return (
    <EntityIdentityCell
      icon={Building2}
      title={d.departmentName}
      subtitle={d.departmentCode ?? undefined}
    />
  );
}

export function assetCategoryListCell(c: AssetCategory) {
  return (
    <EntityIdentityCell icon={FolderTree} title={c.categoryName} subtitle={c.description ?? undefined} />
  );
}

export function assetListCell(a: Asset & { currentAssigneeName?: string | null }) {
  return (
    <EntityIdentityCell
      icon={Laptop}
      title={
        <Link href={`/assets/${a.assetId}`} className="hover:text-primary hover:underline">
          {a.assetName}
        </Link>
      }
      subtitle={a.assetCode}
    />
  );
}

export function purchaseOrderListCell(po: PurchaseOrder) {
  return (
    <EntityIdentityCell
      icon={FileText}
      title={
        <Link href={`/purchase-orders/${po.purchaseOrderId}`} className="hover:text-primary hover:underline">
          {po.poNumber}
        </Link>
      }
      subtitle={po.vendor?.vendorName ?? (po as PurchaseOrder & { vendorName?: string }).vendorName ?? undefined}
      meta={
        <StatusPill
          status={poStatusToPill(po.status)}
          label={PO_STATUS_LABELS[po.status] ?? po.status}
          dot
        />
      }
    />
  );
}

export function contractListCell(c: Contract) {
  return (
    <EntityIdentityCell
      icon={Handshake}
      title={
        <Link href={`/contracts/${c.contractId}`} className="hover:text-primary hover:underline">
          {c.contractNumber}
        </Link>
      }
      subtitle={c.vendor?.vendorName ?? (c as Contract & { vendorName?: string }).vendorName ?? undefined}
    />
  );
}

export function invoiceListCell(inv: Invoice) {
  return (
    <EntityIdentityCell
      icon={Receipt}
      title={
        <Link href={`/invoices/${inv.invoiceId}`} className="hover:text-primary hover:underline">
          {inv.invoiceNumber}
        </Link>
      }
      subtitle={
        inv.purchaseOrder?.poNumber ??
        (inv as Invoice & { purchaseOrderNumber?: string }).purchaseOrderNumber ??
        undefined
      }
      meta={
        <StatusPill
          status={invoicePaymentToPill(inv.paymentStatus)}
          label={INVOICE_PAYMENT_LABELS[inv.paymentStatus] ?? inv.paymentStatus}
          dot
        />
      }
    />
  );
}

export function licenseListCell(l: SoftwareLicense) {
  return (
    <EntityIdentityCell
      icon={KeyRound}
      title={l.softwareName}
      subtitle={l.expiryDate ? `Expires ${l.expiryDate}` : undefined}
      meta={
        <StatusPill
          status={
            (l.status?.toLowerCase() === "expired"
              ? "inactive"
              : l.status?.toLowerCase() === "active"
                ? "active"
                : "active") as StatusKind
          }
          label={l.status}
          dot
        />
      }
    />
  );
}

export function maintenanceListCell(m: MaintenanceRecord) {
  return (
    <EntityIdentityCell
      icon={Wrench}
      title={m.maintenanceType}
      subtitle={
        m.asset?.assetName ??
        m.vendor?.vendorName ??
        (m as MaintenanceRecord & { assetName?: string; vendorName?: string }).assetName ??
        (m as MaintenanceRecord & { assetName?: string; vendorName?: string }).vendorName ??
        undefined
      }
      meta={
        <StatusPill
          status={maintenanceStatusToPill(m.status)}
          label={MAINTENANCE_STATUS_LABELS[m.status] ?? m.status}
          dot
        />
      }
    />
  );
}

export function nonAssetStockListCell(item: {
  stockCode: string;
  itemName: string;
  quantityAvailable?: number;
  unitOfMeasure?: string;
}) {
  return (
    <EntityIdentityCell
      icon={Package}
      title={item.itemName}
      subtitle={item.stockCode}
    />
  );
}

export function notificationListIcon() {
  return Bell;
}
