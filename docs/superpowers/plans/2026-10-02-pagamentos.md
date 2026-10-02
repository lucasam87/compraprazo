# Pagamentos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Implementar recebimento parcial/integral com RPC transacional e recibo copiável.

**Architecture:** Uma Action protegida consulta parcelas abertas, usa `calculos.ts` para a prévia e chama `registrar_pagamento`; a interface server-rendered lista parcelas e um formulário cliente mostra distribuição/recibo. Nenhuma mutação será feita diretamente no navegador.

**Tech Stack:** Next.js App Router, TypeScript, React, Supabase SSR, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-02-pagamentos-design.md`

## Global Constraints

- Valores em centavos inteiros e formas limitadas a dinheiro, Pix, cartão ou outro.
- Encargos/principal usam exclusivamente `src/lib/calculos.ts`.
- RPC transacional é responsável pela persistência e mudança de status.
- Pagamentos não são apagados; estorno futuro será separado.

## Review Focus

- Pagamento parcial deve abater encargos antes do principal — Task 1.
- Valor maior que saldo deve ser rejeitado antes de confirmação — Task 1/2.
- Forma inválida deve ser rejeitada — Task 1.
- Cliente bloqueado continua podendo pagar — Task 2.
- Recibo não pode exibir saldo negativo — Task 3.

## File Structure

- Create: `src/lib/pagamentos.ts` e teste — schema, prévia e recibo.
- Create: `src/app/pagamentos/actions.ts` e teste — Action/RPC.
- Create: `src/app/pagamentos/[clienteId]/page.tsx` — parcelas abertas.
- Create: `src/app/pagamentos/receber-form.tsx` — formulário e prévia.
- Modify: `docs/status-plano.md` — evidência.

### Task 1: Prévia e recibo

- [ ] Escrever testes de formas válidas, distribuição parcial/integral, excesso e recibo.
- [ ] Confirmar falha inicial.
- [ ] Implementar `criarPreviaPagamento` e `gerarRecibo` usando `calcularEncargos`/`aplicarPagamento`.
- [ ] Rodar `npm run test -- src/lib/pagamentos.test.ts` até verde.

### Task 2: Action transacional

- [ ] Testar perfil ausente, parcela inválida, forma inválida, cliente bloqueado e erro neutro da RPC.
- [ ] Confirmar falha inicial.
- [ ] Implementar `registrarPagamento(formData)` chamando `rpc('registrar_pagamento', args)`.
- [ ] Rodar Actions e suíte completa.

### Task 3: Interface

- [ ] Listar parcelas abertas por vencimento.
- [ ] Criar formulário de valor/forma com prévia e recibo após sucesso.
- [ ] Rodar `npm run lint; npm run test; npm run build` e atualizar status.

## Self-review

O plano cobre pagamento, RPC e recibo; estorno e renegociação permanecem fora do escopo.
