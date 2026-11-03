import { QuickTip } from "@/components/common/QuickTip";
import { NON_OFFICIAL_EXPORT_DISCLAIMER } from "@/lib/domain/export-ui";

export function ExportDisclaimerNotice({ message = NON_OFFICIAL_EXPORT_DISCLAIMER }: { message?: string }) {
  return (
    <QuickTip title="Provisional export (D12)" variant="warning">
      {message}
    </QuickTip>
  );
}
