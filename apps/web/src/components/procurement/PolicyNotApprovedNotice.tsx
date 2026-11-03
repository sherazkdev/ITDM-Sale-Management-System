import { QuickTip } from "@/components/common/QuickTip";

type PolicyNotApprovedNoticeProps = {
  title?: string;
  message: string;
};

/** Shown when backend returns POLICY_NOT_APPROVED or workflow is known blocked (D03). */
export function PolicyNotApprovedNotice({
  title = "Workflow unavailable",
  message,
}: PolicyNotApprovedNoticeProps) {
  return (
    <QuickTip title={title} variant="warning">
      {message}
    </QuickTip>
  );
}
