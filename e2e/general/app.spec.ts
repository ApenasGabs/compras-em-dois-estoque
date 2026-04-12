import { expect, test, type Page } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL ?? "";
const e2ePassword = process.env.E2E_PASSWORD ?? "";

const ensureOnListPage = async (page: Page): Promise<void> => {
  await page.goto("/list");

  if (page.url().includes("/list")) {
    return;
  }

  await expect(page).toHaveURL(/\/group$/);

  const useButtons = page.getByRole("button", { name: "Usar" });
  if ((await useButtons.count()) > 0) {
    await useButtons.first().click();
    await expect(page).toHaveURL(/\/list$/);
    return;
  }

  const groupNameInput = page.locator("input[type='text']").first();
  await groupNameInput.fill(`Grupo E2E ${Date.now()}`);
  await page.getByRole("button", { name: /^Criar$/ }).click();

  const goToListButton = page.getByRole("button", { name: "Ir para a lista" });
  if ((await goToListButton.count()) > 0) {
    await goToListButton.first().click();
  } else {
    await page.goto("/list");
  }

  await expect(page).toHaveURL(/\/list$/);
};

const loginWithCredentials = async (page: Page): Promise<void> => {
  await page.goto("/login");
  await page.locator("input[type='email']").fill(e2eEmail);
  await page.locator("input[type='password']").fill(e2ePassword);
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/(group|list)$/);
};

test.describe("Fluxo funcional - auth e lista", () => {
  test("deve proteger rota /list sem sessao", async ({ page }) => {
    await page.goto("/list");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Compras em Dois" })).toBeVisible();
  });

  test("deve manter contexto apos reload em /list", async ({ page }) => {
    test.skip(
      !e2eEmail || !e2ePassword,
      "Defina E2E_EMAIL e E2E_PASSWORD para executar este teste",
    );

    await loginWithCredentials(page);
    await ensureOnListPage(page);

    await expect(page.getByRole("heading", { name: "Lista" })).toBeVisible();
    await page.reload();

    await expect(page).toHaveURL(/\/list$/);
    await expect(page.getByRole("heading", { name: "Lista" })).toBeVisible();
  });

  test("deve permitir logout pela navbar", async ({ page }) => {
    test.skip(
      !e2eEmail || !e2ePassword,
      "Defina E2E_EMAIL e E2E_PASSWORD para executar este teste",
    );

    await loginWithCredentials(page);
    await ensureOnListPage(page);

    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Compras em Dois" })).toBeVisible();
  });
});
