# Acesso inicial ao Crediário

O primeiro acesso é criado manualmente. O aplicativo não possui cadastro público e não usa chaves privilegiadas do Supabase.

## Configurar o Supabase Auth

No painel do projeto Supabase, abra **Authentication > Providers > Email** e:

1. Desative o cadastro público por e-mail.
2. Mantenha a confirmação de e-mail obrigatória.
3. Crie o primeiro usuário pela área de usuários do Auth e faça a confirmação do e-mail.

Não registre senhas, tokens pessoais ou chaves `service_role` neste repositório, em documentos ou em variáveis `NEXT_PUBLIC_*`.

## Criar o perfil de dono

No SQL Editor, obtenha o UUID do usuário criado e use-o somente no parâmetro abaixo. Execute a consulta como administrador do projeto:

```sql
insert into public.perfis (id, nome, papel, ativo)
values ('<UUID_DO_USUARIO>', '<NOME_DO_DONO>', 'dono', true);
```

O UUID deve ser o mesmo do usuário em `auth.users`. Nunca use uma conta de aplicação com privilégios elevados para criar perfis no navegador.

## Primeiro login

Preencha apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`, inicie o app com `npm run dev` e entre pela rota `/login` após confirmar o e-mail. Sem um perfil ativo em `public.perfis`, o login não dá acesso às rotas privadas.

## Testes e2e locais

`npm run test:e2e` carrega `.env.local` antes de iniciar o Playwright. A suíte verifica redirecionamento sem sessão e erro neutro para credenciais inválidas quando as variáveis públicas do Supabase estão configuradas.

Para os demais cenários, crie contas dedicadas e preencha as variáveis `E2E_AUTH_*` mostradas em `.env.example`: uma conta ativa, uma com perfil inativo e uma com e-mail ainda não confirmado. Os cenários de login válido, perfil inativo, e-mail não confirmado e sessão removida ficam explicitamente pulados até as respectivas credenciais de teste estarem disponíveis. Todas essas variáveis devem ficar apenas em arquivos `.env*` ignorados pelo Git; nunca use contas de produção.
