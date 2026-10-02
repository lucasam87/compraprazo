# Autenticação e autorização inicial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proteger o Crediário com login por e-mail e senha, sessão SSR e perfil ativo no Supabase.

**Architecture:** O `proxy.ts` do Next.js 16 renova cookies de sessão e envia visitantes à rota pública `/login`. Páginas e Server Actions não confiam somente no proxy: usam uma guarda de servidor que obtém o usuário autenticado e seu perfil ativo sob RLS. O primeiro dono é criado fora do app pelo painel e pelo SQL Editor do Supabase.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@supabase/ssr`, Supabase Auth, Vitest e Playwright.

**Spec:** `docs/superpowers/specs/2026-10-02-autenticacao-design.md`

## Global Constraints

- Cadastro público fica desativado no Supabase Auth e a confirmação de e-mail fica habilitada.
- Nunca expor `service_role`, secret keys ou o token pessoal da CLI no navegador ou em arquivos versionados.
- RLS continua sendo a autorização de dados; proxy e UI não a substituem.
- Perfil válido é um registro ativo em `public.perfis`, com `papel` igual a `dono` ou `atendente`.
- Todas as alterações financeiras continuam exclusivamente em `src/lib/calculos.ts`.
- Esta pasta não é um repositório Git; não executar etapas de commit.

## Review Focus

- Sessão expirada deve redirecionar para `/login`, sem renderizar conteúdo privado.
- E-mail não confirmado deve resultar em mensagem neutra, sem revelar detalhes internos do Auth.
- Usuário autenticado sem perfil em `public.perfis` deve ser bloqueado.
- Perfil inativo deve ser bloqueado mesmo quando o cookie de sessão for válido.
- O parâmetro de retorno após login deve aceitar apenas caminho interno para não permitir redirecionamento externo.

---

## File Structure

- Create: `src/lib/supabase/proxy.ts` — cliente SSR para o proxy e atualização de cookies.
- Create: `proxy.ts` — proteção de rotas e matcher do Next.js 16.
- Create: `src/lib/auth.ts` — leitura de usuário e perfil ativo no servidor.
- Create: `src/lib/auth.test.ts` — testes da guarda com cliente Supabase falso limitado à interface usada.
- Create: `src/app/login/actions.ts` — Server Action de login e sanitização de retorno.
- Create: `src/app/login/page.tsx` — formulário público de login.
- Create: `src/app/login/login-form.tsx` — componente cliente que exibe estado e erro da ação.
- Create: `src/app/login/actions.test.ts` — testes do fluxo de login com dependência de autenticação isolada.
- Modify: `src/app/page.tsx` — exigir perfil ativo e apresentar destino privado mínimo.
- Create: `docs/acesso-inicial.md` — criação segura do dono e configuração manual do Auth.
- Create: `tests/e2e/auth.spec.ts` — cenários reais contra projeto configurado, executados somente com credenciais de teste.
- Modify: `docs/status-plano.md` — registrar a etapa somente depois das validações.

### Task 1: Sessão SSR e proteção de rotas

**Files:**
- Create: `src/lib/supabase/proxy.ts`
- Create: `proxy.ts`
- Test: `src/lib/supabase/proxy.test.ts`

**Interfaces:**
- Consumes: `getSupabasePublicEnvironment()` de `src/lib/supabase/environment.ts`.
- Produces: `updateSession(request: NextRequest): Promise<NextResponse>` e `proxy(request: NextRequest): Promise<NextResponse>`.

- [ ] **Step 1: Escrever os testes que demonstram que `/login` é público e que as rotas privadas usam o matcher.**

Use `unstable_doesProxyMatch` de `next/experimental/testing/server`; confira que `/_next/static/*` não passa pelo proxy e que `/` e `/login` são tratados segundo o matcher definido.

- [ ] **Step 2: Executar o teste para confirmar a falha inicial.**

Run: `npm run test -- src/lib/supabase/proxy.test.ts`

Expected: FAIL porque `proxy.ts` e o módulo de sessão ainda não existem.

- [ ] **Step 3: Implementar `updateSession(request: NextRequest): Promise<NextResponse>`.**

Criar um `createServerClient` com `getAll`/`setAll` de cookies. Chamar `auth.getUser()` para renovar/validar a sessão; não usar `getSession()` como verificação de segurança. Preservar cookies atualizados no `NextResponse`.

- [ ] **Step 4: Implementar `proxy(request: NextRequest): Promise<NextResponse>` em `proxy.ts`.**

Permitir `/login`; redirecionar rota privada sem usuário para `/login?next=<pathname>`; redirecionar usuário autenticado que visita `/login` para `/`. Exportar `config.matcher` que exclua `_next`, arquivos estáticos e imagens.

- [ ] **Step 5: Executar o teste do proxy.**

Run: `npm run test -- src/lib/supabase/proxy.test.ts`

Expected: PASS.

### Task 2: Guarda de usuário e perfil ativo

**Files:**
- Create: `src/lib/auth.ts`
- Test: `src/lib/auth.test.ts`

**Interfaces:**
- Consumes: cliente criado por `createClient()` de `src/lib/supabase/server.ts`.
- Produces: `getCurrentAccess(client): Promise<AccessResult>` e `requireActiveProfile(client): Promise<ActiveProfile>`.
- `AccessResult` discrimina `unauthenticated`, `profile_missing`, `inactive` e `active`; `ActiveProfile` contém `id`, `nome` e `papel`.

- [ ] **Step 1: Escrever testes de `getCurrentAccess` para sessão ausente, perfil ausente, perfil inativo e perfil ativo.**

Os fakes devem implementar somente `auth.getUser()` e a consulta `from('perfis').select(...).eq(...).maybeSingle()` necessária; asserções verificam o resultado discriminado, não chamadas de mock.

- [ ] **Step 2: Executar os testes para confirmar a falha inicial.**

Run: `npm run test -- src/lib/auth.test.ts`

Expected: FAIL porque o módulo e as interfaces ainda não existem.

- [ ] **Step 3: Implementar `getCurrentAccess` e `requireActiveProfile`.**

Usar `auth.getUser()` e buscar somente o perfil do usuário autenticado. `requireActiveProfile` deve lançar erro tipado para cada estado não autorizado, sem dados de terceiros.

- [ ] **Step 4: Executar os testes da guarda e a suíte completa.**

Run: `npm run test -- src/lib/auth.test.ts; npm run test`

Expected: PASS.

### Task 3: Login por senha e rota privada mínima

**Files:**
- Create: `src/app/login/actions.ts`
- Create: `src/app/login/login-form.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `createClient()` de `src/lib/supabase/server.ts` e `requireActiveProfile()` de `src/lib/auth.ts`.
- Produces: `signIn(formData: FormData): Promise<LoginState>`, `getSafeRedirectPath(value: FormDataEntryValue | null): string` e rota pública `/login`.
- `LoginState` é `{ error?: string }`; nunca contém senha, token ou mensagem bruta do Supabase.

- [ ] **Step 1: Escrever testes para falha de credenciais, retorno interno válido e rejeição de URL externa em `next`.**

O teste de URL usa `https://externo.example` e espera retorno `/`; o teste de falha espera uma mensagem neutra para o usuário.

- [ ] **Step 2: Executar os testes para confirmar a falha inicial.**

Run: `npm run test -- src/app/login/actions.test.ts`

Expected: FAIL porque a ação e a página ainda não existem.

- [ ] **Step 3: Implementar `signIn(formData: FormData): Promise<LoginState>`.**

Validar e-mail/senha não vazios; chamar `auth.signInWithPassword`; converter falhas esperadas em mensagem neutra. Aceitar `next` somente se começar com `/` e não começar com `//`; chamar `redirect()` fora de blocos `try/catch`.

- [ ] **Step 4: Implementar a página e o formulário de login.**

O componente cliente usa `useActionState` para exibir erro e estado de envio. A página descreve que o acesso é restrito e oferece somente login, sem link de cadastro público.

- [ ] **Step 5: Tornar `src/app/page.tsx` privada.**

Chamar `requireActiveProfile` no Server Component e renderizar uma página mínima que identifica o usuário pelo nome e papel. Mapear ausência de sessão para login e perfil ausente/inativo para acesso negado.

- [ ] **Step 6: Executar testes da rota de login e a suíte completa.**

Run: `npm run test -- src/app/login/actions.test.ts; npm run test`

Expected: PASS.

### Task 4: Operação manual do primeiro dono e e2e

**Files:**
- Create: `docs/acesso-inicial.md`
- Create: `tests/e2e/auth.spec.ts`
- Modify: `docs/status-plano.md`

**Interfaces:**
- Consumes: projeto Supabase vinculado, e-mail de teste confirmado e perfil `dono` criado manualmente.
- Produces: roteiro operacional reproduzível e cenários e2e de autenticação.

- [ ] **Step 1: Documentar a configuração do Supabase Auth e o perfil inicial.**

Documentar no painel: desativar signup público, exigir confirmação de e-mail e criar usuário. Incluir SQL parametrizado para inserir em `public.perfis` usando o UUID de `auth.users`; proibir senhas/tokens no documento.

- [ ] **Step 2: Escrever o teste e2e de redirecionamento sem sessão.**

O cenário abre `/` sem cookies e espera `/login`; testes que exigem credenciais reais devem ser condicionais a variáveis de ambiente de teste e não usar a conta de produção.

- [ ] **Step 3: Executar o teste e2e para confirmar a falha inicial.**

Run: `npm run test:e2e -- tests/e2e/auth.spec.ts`

Expected: FAIL antes do proxy e da rota de login existirem, ou SKIP documentado quando as credenciais de e2e não estiverem configuradas.

- [ ] **Step 4: Executar e validar o fluxo configurado.**

Criar manualmente o usuário `dono`, confirmar o e-mail e preencher somente variáveis de teste locais. Confirmar login válido, credenciais inválidas, sessão ausente e perfil inativo.

- [ ] **Step 5: Atualizar `docs/status-plano.md` com evidências.**

Marcar autenticação como concluída somente após os comandos abaixo retornarem sucesso:

Run: `npm run lint; npm run test; npm run build; npm run test:e2e`

Expected: PASS, com qualquer teste de credencial externa explicitamente marcado como SKIP quando não configurado.

## Self-review

- Cobertura da especificação: Tasks 1–4 implementam sessão, login, perfil ativo, primeiro dono, segurança e validação.
- Consistência: `updateSession`, `getCurrentAccess`, `requireActiveProfile` e `signIn` são definidos antes de seus consumidores.
- Review Focus: sessão expirada (Task 1), e-mail não confirmado e `next` externo (Task 3), perfil ausente/inativo (Task 2).
- Proporção: o plano especifica contratos e verificações sem transcrever a implementação.
