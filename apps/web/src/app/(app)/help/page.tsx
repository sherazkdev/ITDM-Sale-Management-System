"use client";

import Link from "next/link";
import { BookOpen, FileText, Package, Receipt, Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";

const TOPICS = [
  {
    title: "PO search",
    description:
      "Look up an exact purchase order number to see linked vendor, contract, inventory, invoices, and documents.",
    href: "/search",
    icon: Search,
  },
  {
    title: "Issuance & returns",
    description: "Issue in-stock assets to employees or return issued assets as an atomic movement.",
    href: "/asset-issuance",
    icon: Package,
  },
  {
    title: "Invoices & payments",
    description: "Filter the invoice register by number, PO, or payment status, then open a row for posting and payments.",
    href: "/invoices",
    icon: Receipt,
  },
  {
    title: "Reports & exports",
    description:
      "Download operational CSV, PDF, or Excel extracts. Exports marked NON-OFFICIAL-D12 are not official organizational templates.",
    href: "/reports",
    icon: FileText,
  },
] as const;

export default function HelpPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Support"
        title="Help"
        description="Quick links for common ITDMS workflows. Keyboard shortcut: Ctrl+K or ⌘K opens PO search (when you are not typing in a form field)."
      />

      <SectionCard title="Getting started">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Use the sidebar for module navigation. Permissions control which modules you can open; the API
            enforces the same rules on every request.
          </p>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <SectionCard key={topic.href} title={topic.title}>
              <p className="mb-4 text-sm text-muted-foreground">{topic.description}</p>
              <Button asChild variant="outline" size="sm">
                <Link href={topic.href}>
                  <Icon className="h-4 w-4" />
                  Open
                </Link>
              </Button>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
