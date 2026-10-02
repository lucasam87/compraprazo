# Estado auditado do projeto — 02/10/2026

Este é o registro de referência do estado atual. O `plano-implementacao.md` é um roadmap detalhado e contém marcações históricas que não substituem esta auditoria.

## Confirmado

- Estrutura Next.js, TypeScript, Tailwind, Dockerfile e Docker Compose existem.
- A aplicação possui clientes Supabase para navegador e servidor, com validação explícita das variáveis públicas de ambiente.
- As migrations `0001` a `0004` estão reconciliadas no Supabase remoto.
- As 9 tabelas esperadas, as 2 views, as funções RPC e as políticas RLS foram verificadas no banco remoto.
- A credencial privilegiada foi removida do arquivo de exemplo; o token da CLI fica apenas em `.env.supabase.local`, ignorado pelo Git.
- Lint, testes unitários (99 testes) e build de produção passam quando as variáveis públicas do Supabase estão configuradas no processo.
- A documentação inicial de LGPD e backup existe.
- Autenticação por e-mail e senha foi implementada com sessão SSR, proteção de rotas, retorno interno seguro e guarda de perfil ativo.
- O núcleo financeiro em `src/lib/calculos.ts` implementa encargos, pagamento parcial, estorno calculado, parcelamento, vencimentos e avaliação de crédito sem acessar UI ou banco.
- O fluxo inicial de clientes foi criado: schemas Zod, Actions protegidas, lista com busca, cadastro, edição e inativação sem exclusão.
- O núcleo do fluxo de compras foi criado: prévia pura de parcelas, Action protegida para a RPC `criar_compra` e tela inicial de nova compra.
- O núcleo de pagamentos foi criado: prévia de distribuição, recibo textual e Action protegida para a RPC `registrar_pagamento`.
- O recibo copiável foi integrado ao recebimento e a página inicial agora exibe o resumo operacional de hoje.
- Existe roteiro para criar o primeiro dono em `docs/acesso-inicial.md` e teste e2e de redirecionamento sem sessão em `tests/e2e/auth.spec.ts`.

## Ainda não implementado ou não verificado

- Configuração manual do Supabase Auth e execução dos cenários e2e com projeto e credenciais de teste. Os seis cenários e2e são pulados explicitamente enquanto `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiverem configurados em `.env.local`; os casos de conta ativa, inativa e não confirmada também exigem as respectivas variáveis `E2E_AUTH_*` locais.
- Server Actions, schemas de formulário e integração com Supabase dos fluxos operacionais (clientes, compras e pagamentos) estão implementados; falta validação e2e contra um projeto de teste.
- Integração e2e do fluxo de clientes com Supabase de teste e e2e de compras/pagamentos continuam pendentes.
- Validação visual de limite/bloqueio e e2e da compra ainda não foram validados com Supabase de teste.
- Testes de RLS, RPCs e fluxo e2e.
- Validação do Docker em daemon disponível e deploy na Vercel.

## Próxima etapa recomendada

Configurar o Supabase Auth e credenciais de teste, executar os cenários e2e/RLS/RPC e finalizar o recibo copiável antes do deploy.
