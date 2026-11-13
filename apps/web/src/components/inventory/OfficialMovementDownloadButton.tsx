"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { saveOfficialMovementXlsx, type OfficialMovementKind } from "@/lib/api/asset-movements";
import { ApiClientError } from "@/lib/api/client";

type Props = {
  documentId: string;
  kind: OfficialMovementKind;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "md";
  label?: string;
};

export function OfficialMovementDownloadButton({
  documentId,
  kind,
  variant = "outline",
  size = "sm",
  label = "Official XLSX",
}: Props) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={async () => {
        try {
          await saveOfficialMovementXlsx(documentId, kind);
          toast.success("Official form downloaded");
        } catch (err) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Official template is unavailable. Ensure client templates are installed under storage/client-templates.";
          toast.error(message);
        }
      }}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
