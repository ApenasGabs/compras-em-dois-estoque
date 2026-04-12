import { expect, test } from "@playwright/test";

test.describe("ThemeSelector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();
  });

  test("deve abrir o drawer de temas", async ({ page }) => {
    await page.getByRole("button", { name: "Temas" }).click();
    await expect(page.getByTestId("theme-menu")).toBeVisible();
  });

  test("deve aplicar e persistir tema dark", async ({ page }) => {
    await page.getByRole("button", { name: "Temas" }).click();
    await page.getByRole("radio", { name: "Dark" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
