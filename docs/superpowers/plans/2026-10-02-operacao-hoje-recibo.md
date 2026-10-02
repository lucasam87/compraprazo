# Operação Hoje e recibo copiável Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Exibir um resumo operacional diário e entregar um recibo copiável após pagamentos confirmados.

**Architecture:** Extrair a formatação do recibo para `src/lib/pagamentos.ts`, mantendo a Server Action como fronteira de persistência. A página inicial fará consultas agregadas no Supabase server-side; o componente de pagamento exibirá e copiará o texto já retornado pela Action.

**Tech Stack:** Next.js App Router, Server Actions, Supabase SSR, React, Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-02-operacao-hoje-recibo-design.md`

## Global Constraints

- Dinheiro permanece em centavos inteiros.
- Regras financeiras permanecem exclusivamente em `src/lib/calculos.ts`.
- Nenhum registro será apagado.
- Consultas respeitam RLS e nenhuma `service_role` chega ao navegador.

## Review Focus

- Pagamento rejeitado não pode produzir recibo de sucesso — teste da Action/form state.
- Falha do Clipboard API não pode ocultar o recibo — teste do componente e fallback visual.
- Nenhuma parcela encontrada hoje deve renderizar indicadores zerados — teste da página/consulta.
- Valores em centavos devem ser formatados consistentemente no recibo — teste unitário.
- Erro de consulta operacional não deve expor detalhes internos — teste da função de agregação.

### Task 1: Recibo textual puro

**Files:**
- Modify: `src/lib/pagamentos.ts`
- Test: `src/lib/pagamentos.test.ts`

**Interfaces:**
- Produces `gerarReciboPagamento(input: { pagamentoId: string; valorCentavos: number; forma: FormaPagamento; criadoEm: Date }): string`.

- [ ] Write failing tests for identifiers, payment method, date and cent formatting.
- [ ] Run `npm run test -- src/lib/pagamentos.test.ts` and observe failure.
- [ ] Implement the pure formatter without database access.
- [ ] Run the focused test and then the full suite.
- [ ] Commit `feat: format payment receipts`.

### Task 2: Action returns receipt

**Files:**
- Modify: `src/app/pagamentos/actions.ts`
- Modify: `src/app/pagamentos/receber-form.tsx`

**Interfaces:**
- `registrarPagamento` success result becomes `{ ok: true; pagamentoId: string; recibo: string }`.

- [ ] Add an Action test asserting rejected payments have no receipt and successful results expose it.
- [ ] Run the focused Action test and observe failure.
- [ ] Call `gerarReciboPagamento` only after the RPC succeeds.
- [ ] Add a client-side copy button with visible “Copiado”/fallback status while always rendering the receipt.
- [ ] Run lint and all tests.
- [ ] Commit `feat: show copyable payment receipts`.

### Task 3: Resumo operacional Hoje

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/lib/hoje.ts`
- Test: `src/lib/hoje.test.ts`

**Interfaces:**
- `resumirHoje(rows: Array<{ vencimento: string; valor_centavos: number; status: string; cliente_id: string }>, hoje: string): { vencendoHoje: number; totalPrevistoCentavos: number; clientesEmAtraso: number }`.

- [ ] Write failing tests for today, overdue, duplicate overdue clients and empty input.
- [ ] Implement the pure aggregation in `src/lib/hoje.ts`.
- [ ] Query only the fields needed for the authenticated user on the home page; on query failure render neutral zero-state data.
- [ ] Render three accessible summary cards and preserve existing access-denied behavior.
- [ ] Run full lint, tests and build with configured public Supabase environment.
- [ ] Commit `feat: add operational today summary`.

### Task 4: Final verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run test` and confirm all test files pass.
- [ ] Run `npm run build` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured.
- [ ] Run `git diff --check` and inspect `git status --short`.
