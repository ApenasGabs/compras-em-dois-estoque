import { expect, test } from "@playwright/test";

test.describe("Acessibilidade e responsividade", () => {
  test("deve renderizar heading principal na tela de login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Compras em Dois" })).toBeVisible();
  });

  test("deve exibir footer no login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator(".footer")).toBeVisible();
  });

  test("deve manter navegação visível em viewport mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");

    await expect(page.getByTestId("navbar-title")).toBeVisible();
    await expect(page.getByRole("button", { name: "Temas" })).toBeVisible();
  });
});
