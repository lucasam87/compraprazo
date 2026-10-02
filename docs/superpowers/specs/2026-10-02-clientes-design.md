# Design: fluxo de clientes

## Objetivo

Permitir cadastrar, buscar, editar, consultar e inativar clientes com segurança, mantendo todos os registros históricos.

## Campos e validação

- `nome`: obrigatório, texto aparado e não vazio.
- `telefone`: opcional; quando informado, contém somente dígitos.
- `observacoes`: opcional.
- `limite_centavos`: opcional, inteiro seguro positivo em centavos; quando nulo, aplica-se o limite padrão da configuração.

## Arquitetura

- `src/lib/schemas.ts` concentra schemas Zod e conversão dos campos de formulário.
- `src/app/clientes/actions.ts` contém Actions protegidas por `requireActiveProfile`, para criar, editar e inativar. Erros retornam mensagens neutras.
- Páginas Server Components em `src/app/clientes` fazem leitura pelo cliente Supabase de servidor, sob RLS.
- Componentes de formulário podem ser clientes para usar `useActionState`, mas não acessam banco diretamente.

## Fluxos

### Lista e busca

A lista mostra clientes ativos por padrão, com nome, telefone e status. A busca normaliza texto e aceita nome ou telefone; resultados têm limite seguro. A busca não expõe dados se o perfil não estiver ativo, pois RLS e a guarda do servidor se aplicam.

### Cadastro e edição

O usuário autorizado cria e edita apenas os campos permitidos. O servidor valida os dados com Zod, registra `criado_por` usando o perfil autenticado e mantém o telefone opcional.

### Inativação

Inativar troca somente `ativo` para `false`. Não há `delete`; compras, pagamentos e auditoria permanecem preservados. A interface pede confirmação antes da ação.

## Fora de escopo

- Saldo devedor e limite disponível na tela de detalhes, dependentes do fluxo de compras.
- Bloqueio manual/automático, compras, pagamentos e cobrança.
- E2E contra banco remoto até existir projeto e contas de teste configurados.

## Testes

Testes unitários cobrem schemas e Actions para cadastro, edição e inativação, incluindo telefone opcional/inválido, limite inválido e acesso ausente. O fluxo e2e será adicionado quando as variáveis de teste do Supabase estiverem disponíveis.
