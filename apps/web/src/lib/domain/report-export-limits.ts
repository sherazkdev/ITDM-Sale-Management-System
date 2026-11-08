/** Matches `take: 5000` caps in `apps/api/src/modules/reports/report.service.ts`. */
export const REPORT_EXPORT_ROW_LIMIT = 5000;

export const REPORT_EXPORT_LIMIT_NOTE = `Each export includes up to ${REPORT_EXPORT_ROW_LIMIT.toLocaleString()} rows. Narrow filters in a future release may reduce scope; today's exports reflect the full register cap.`;
