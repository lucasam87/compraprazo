import { expect, test } from '@playwright/test';

const hasSupabaseConfiguration = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const activeCredentials = {
  email: process.env.E2E_AUTH_ACTIVE_EMAIL,
  password: process.env.E2E_AUTH_ACTIVE_PASSWORD,
};
const inactiveCredentials = {
  email: process.env.E2E_AUTH_INACTIVE_EMAIL,
  password: process.env.E2E_AUTH_INACTIVE_PASSWORD,
};
const unconfirmedCredentials = {
  email: process.env.E2E_AUTH_UNCONFIRMED_EMAIL,
  password: process.env.E2E_AUTH_UNCONFIRMED_PASSWORD,
};

function hasCredentials(credentials: { email?: string; password?: string }) {
  return Boolean(credentials.email && credentials.password);
}

test.describe('autenticação', () => {
  test.skip(!hasSupabaseConfiguration, 'Configure as variáveis públicas do Supabase em .env.local para executar e2e.');

  test('redireciona visitante sem sessão para o login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login\?next=%2F$/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });

  test('mantém erro de credenciais neutro', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('invalido@example.invalid');
    await page.getByLabel('Senha').fill('senha-que-nao-existe');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Não foi possível entrar. Verifique e-mail e senha e tente novamente.');
  });

  test('permite que usuário ativo entre e retorna à rota privada', async ({ page }) => {
    test.skip(!hasCredentials(activeCredentials), 'Configure E2E_AUTH_ACTIVE_EMAIL e E2E_AUTH_ACTIVE_PASSWORD.');

    await page.goto('/login?next=%2F');
    await page.getByLabel('E-mail').fill(activeCredentials.email!);
    await page.getByLabel('Senha').fill(activeCredentials.password!);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Seu acesso está ativo.')).toBeVisible();
  });

  test('bloqueia usuário autenticado com perfil inativo', async ({ page }) => {
    test.skip(!hasCredentials(inactiveCredentials), 'Configure E2E_AUTH_INACTIVE_EMAIL e E2E_AUTH_INACTIVE_PASSWORD.');

    await page.goto('/login');
    await page.getByLabel('E-mail').fill(inactiveCredentials.email!);
    await page.getByLabel('Senha').fill(inactiveCredentials.password!);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible();
    await expect(page.getByText('Seu acesso está ativo.')).toHaveCount(0);
  });

  test('não revela confirmação pendente de e-mail', async ({ page }) => {
    test.skip(!hasCredentials(unconfirmedCredentials), 'Configure E2E_AUTH_UNCONFIRMED_EMAIL e E2E_AUTH_UNCONFIRMED_PASSWORD.');

    await page.goto('/login');
    await page.getByLabel('E-mail').fill(unconfirmedCredentials.email!);
    await page.getByLabel('Senha').fill(unconfirmedCredentials.password!);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Não foi possível entrar. Verifique e-mail e senha e tente novamente.');
  });

  test('redireciona sessão removida sem conteúdo privado', async ({ page }) => {
    test.skip(!hasCredentials(activeCredentials), 'Configure credenciais ativas para verificar o ciclo completo de sessão.');

    await page.goto('/login');
    await page.getByLabel('E-mail').fill(activeCredentials.email!);
    await page.getByLabel('Senha').fill(activeCredentials.password!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Seu acesso está ativo.')).toBeVisible();

    await page.context().clearCookies();
    await page.goto('/');

    await expect(page).toHaveURL(/\/login\?next=%2F$/);
    await expect(page.getByText('Seu acesso está ativo.')).toHaveCount(0);
  });
});
