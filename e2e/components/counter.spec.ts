import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL ?? "";
const e2ePassword = process.env.E2E_PASSWORD ?? "";

test.describe("Rotas autenticadas - smoke", () => {
  test("deve redirecionar /profile para /login sem sessao", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("deve abrir /profile apos login", async ({ page }) => {
    test.skip(
      !e2eEmail || !e2ePassword,
      "Defina E2E_EMAIL e E2E_PASSWORD para executar este teste",
    );

    await page.goto("/login");
    await page.locator("input[type='email']").fill(e2eEmail);
    await page.locator("input[type='password']").fill(e2ePassword);
    await page.getByRole("button", { name: /^Entrar$/ }).click();

    await expect(page).toHaveURL(/\/(group|list)$/);
    await page.goto("/profile");

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Perfil" })).toBeVisible();
  });
});
