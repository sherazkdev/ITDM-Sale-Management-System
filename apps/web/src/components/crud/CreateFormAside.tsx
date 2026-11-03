"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickTip } from "@/components/common/QuickTip";

type CreateFormTipsProps = {
  title?: string;
  tips: string[];
};

export function CreateFormTips({ title = "Quick tips", tips }: CreateFormTipsProps) {
  return (
    <QuickTip title={title}>
      <ul className="mt-1 flex flex-col gap-1.5">
        {tips.map((tip) => (
          <li key={tip} className="text-sm text-muted-foreground">
            {tip}
          </li>
        ))}
      </ul>
    </QuickTip>
  );
}

type CreateFormPreviewCardProps = {
  title: string;
  children: React.ReactNode;
};

export function CreateFormPreviewCard({ title, children }: CreateFormPreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}

type CreateFormValidationCardProps = {
  title?: string;
  requiredFields: string[];
};

/** Derived from existing form requirements — not business policy. */
export function CreateFormValidationCard({
  title = "Required fields",
  requiredFields,
}: CreateFormValidationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {requiredFields.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
