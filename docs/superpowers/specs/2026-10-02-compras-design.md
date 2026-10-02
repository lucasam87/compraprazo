# Design: fluxo de compras parceladas

## Objetivo

Permitir registrar uma compra a prazo para cliente ativo, gerar prévia de parcelas e confirmar a operação com atomicidade no Supabase.

## Fluxo

1. Selecionar cliente ativo por busca de nome/telefone e exibir limite disponível.
2. Informar valor em centavos, descrição opcional, quantidade de 1–24 parcelas e data da primeira parcela.
3. Exibir prévia das parcelas usando exclusivamente `dividirParcelas` e `gerarVencimentosMensais` de `src/lib/calculos.ts`.
4. Confirmar pela RPC transacional `criar_compra`, enviando snapshot das configurações atuais e usuário autenticado.

## Segurança e crédito

- A Action exige perfil ativo no servidor; RLS continua sendo autoridade.
- Cliente inativo ou bloqueado não pode receber nova compra.
- Compra acima do limite disponível é rejeitada, salvo exceção autorizada por perfil `dono`.
- Exceção registra auditoria e marca `autorizada_excecao = true`.
- A operação cria compra e parcelas atomicamente; a tela não faz inserts separados.

## Validação

Zod valida cliente, valor inteiro positivo em centavos, descrição opcional, parcelas entre 1 e 24 e data ISO válida. Mensagens informam o que corrigir sem expor erro bruto do banco.

## Fora de escopo

- Registro de pagamentos, renegociação, cobrança e estorno.
- Alteração de configurações financeiras.
- Exceção para atendente.

## Testes

Testes cobrem prévia com soma exata, cliente bloqueado, limite excedido, exceção somente para dono, erro neutro da RPC e ausência de perfil. E2E real depende de projeto Supabase e contas de teste configurados.
