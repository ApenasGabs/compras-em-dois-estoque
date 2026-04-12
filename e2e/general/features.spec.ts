import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL ?? "";
const e2ePassword = process.env.E2E_PASSWORD ?? "";

test.describe("Navbar e visibilidade por sessao", () => {
  test("nao deve mostrar botoes privados sem login", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("button", { name: "Grupo" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Lista" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Historico" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Perfil" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sair" })).toHaveCount(0);
  });

  test("deve mostrar botoes privados apos login", async ({ page }) => {
    test.skip(
      !e2eEmail || !e2ePassword,
      "Defina E2E_EMAIL e E2E_PASSWORD para executar este teste",
    );

    await page.goto("/login");
    await page.locator("input[type='email']").fill(e2eEmail);
    await page.locator("input[type='password']").fill(e2ePassword);
    await page.getByRole("button", { name: /^Entrar$/ }).click();

    await expect(page).toHaveURL(/\/(group|list)$/);
    await expect(page.getByRole("button", { name: "Grupo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Perfil" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  });
});
