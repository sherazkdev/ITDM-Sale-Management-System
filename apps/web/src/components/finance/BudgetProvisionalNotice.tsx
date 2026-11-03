import { QuickTip } from "@/components/common/QuickTip";
import { BUDGET_PROVISIONAL_NOTICE } from "@/lib/domain/budget-ui";

/** D06–D08 — provisional budget figures only. */
export function BudgetProvisionalNotice({ message = BUDGET_PROVISIONAL_NOTICE }: { message?: string }) {
  return (
    <QuickTip title="Provisional budget data" variant="warning">
      {message}
    </QuickTip>
  );
}
