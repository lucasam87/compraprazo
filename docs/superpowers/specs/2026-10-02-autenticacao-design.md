# Design: autenticação e autorização inicial

## Objetivo

Adicionar autenticação por e-mail e senha ao Crediário sem cadastro público. Todas as rotas operacionais devem exigir uma sessão válida e um perfil ativo em `public.perfis`.

## Decisões

- Usar Supabase Auth com e-mail e senha.
- Manter cadastro público desativado no painel do Supabase.
- Exigir confirmação de e-mail antes do primeiro acesso.
- Criar o primeiro usuário manualmente no painel do Supabase e criar seu perfil com papel `dono` no SQL Editor.
- Não usar `service_role` no navegador nem em código do aplicativo.
- Usar `proxy.ts`, convenção do Next.js 16, para renovar sessão e proteger rotas.

## Fluxo

1. Visitante acessa uma rota privada.
2. O proxy atualiza a sessão Supabase com cookies e redireciona visitante sem sessão para `/login`.
3. O formulário de login envia e-mail e senha a uma Server Action.
4. Em caso de sucesso, o usuário retorna à página solicitada ou à rota inicial.
5. Páginas e Server Actions privadas usam uma guarda de servidor que obtém o usuário autenticado e lê `public.perfis`.
6. Perfil inexistente ou inativo não pode acessar dados do crediário.

## Componentes

- `proxy.ts`: sessão e redirecionamentos de rota.
- `src/lib/supabase/proxy.ts`: criação do cliente Supabase específico para o proxy e sincronização de cookies.
- `src/app/login/page.tsx`: página pública de login.
- `src/app/login/actions.ts`: Server Action de login e tratamento de falhas esperadas.
- `src/lib/auth.ts`: guarda reutilizável para exigir usuário autenticado e perfil ativo.
- `docs/acesso-inicial.md`: criação manual do primeiro usuário e perfil `dono`.

## Erros e segurança

- Credenciais inválidas e confirmação de e-mail pendente aparecem como mensagens neutras no formulário.
- Ausência de sessão redireciona para `/login`.
- Perfil ausente ou inativo recebe acesso negado, sem exposição de detalhes de outros usuários.
- A autorização também continua no banco por RLS; o proxy não substitui as políticas.
- Nenhuma senha, token pessoal, `service_role` ou secret key é registrada no repositório.

## Validação

- Testes unitários para a guarda de perfil ativo.
- Testes e2e para login válido, login inválido, sessão expirada e usuário inativo.
- Lint, testes e build de produção.
- Teste manual do primeiro acesso com e-mail confirmado.

## Fora de escopo

- Convite e gestão de atendentes.
- Recuperação de senha e autenticação multifator.
- Interfaces operacionais de clientes, compras e pagamentos.
