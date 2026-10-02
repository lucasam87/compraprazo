# Crediário

Aplicação Next.js para gestão de crediário, usando Supabase remoto (Postgres, Auth e RLS).

## Configuração local

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env.local`.
3. No painel do Supabase, copie a URL do projeto e a chave **anon/publishable**. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`.
4. Inicie a aplicação com `npm run dev`.

`.env.local` e qualquer arquivo `.env*` são ignorados pelo Git. Não adicione chaves `service_role`, `secret` ou tokens pessoais em variáveis `NEXT_PUBLIC_*`, exemplos de ambiente, commits ou código do navegador.

## Banco de dados

As migrations ficam em `supabase/migrations` e devem ser aplicadas na ordem numérica.

1. Crie um Personal Access Token no painel do Supabase e registre-o em `.env.supabase.local`. Esse arquivo é ignorado pelo Git e é usado somente pela CLI.
2. Vincule o projeto remoto: `npm run db:link -- --project-ref <PROJECT_REF>`.
3. Revise o que será aplicado: `npx supabase migration list`.
4. Aplique as migrations: `npm run db:push`.

O `PROJECT_REF` é o trecho antes de `.supabase.co` na URL do projeto. Não use `db reset` contra o projeto remoto: ele é destrutivo.

Após aplicar, crie o primeiro usuário no Supabase Auth e insira seu perfil em `public.perfis` com papel `dono`; sem um perfil ativo, as políticas RLS bloqueiam o acesso aos dados.

## Validação

```bash
npm run lint
npm run test
```

## Docker

O Compose inicia somente a aplicação; o banco continua remoto no Supabase. Inicie o Docker Desktop antes de executar `docker compose up --build`.
