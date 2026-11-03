"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/utils";

type CopyButtonProps = Omit<ButtonProps, "onClick"> & {
  text: string;
  label?: string;
  copiedLabel?: string;
  successMessage?: string;
  errorMessage?: string;
};

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  successMessage = "Copied to clipboard",
  errorMessage = "Could not copy. Please select and copy manually.",
  className,
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const ok = await copyTextToClipboard(text);
      if (ok) {
        setCopied(true);
        toast.success(successMessage);
        window.setTimeout(() => setCopied(false), 1500);
      } else {
        toast.error(errorMessage);
      }
    } catch {
      toast.error(errorMessage);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleCopy}
      {...props}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
