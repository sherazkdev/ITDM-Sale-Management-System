import type { Page } from "@playwright/test";

/** Pick an option in Phase D `SearchableSelect` controls. */
export async function pickSearchableSelect(
  page: Page,
  triggerAriaLabel: string,
  search: string,
  optionPattern: RegExp | string,
) {
  await page.getByRole("button", { name: triggerAriaLabel }).click();
  await page.getByRole("textbox", { name: "Filter options" }).fill(search);
  await page.getByRole("option", { name: optionPattern }).first().click();
}
