# Núcleo de cálculos financeiros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar regras financeiras puras e testadas para compras parceladas, encargos, pagamentos e decisão de crédito.

**Architecture:** Um único módulo `src/lib/calculos.ts` exporta tipos e funções determinísticas, todas recebendo valores inteiros e datas explícitas. `src/lib/calculos.test.ts` especifica os comportamentos sem mocks ou acesso a banco; telas, actions e RPCs serão consumidores futuros.

**Tech Stack:** TypeScript, Vitest e Next.js.

**Spec:** `docs/superpowers/specs/2026-10-02-calculos-financeiros-design.md`

## Global Constraints

- Dinheiro usa `number` inteiro em centavos; valores fracionários ou negativos são inválidos.
- Percentuais usam inteiros em bps: 1% equivale a 100 bps.
- Juros são simples, sobre o principal aberto, proporcionais aos dias de atraso.
- Arredondamento é meio para cima.
- Datas de referência são argumentos explícitos; não usar a data do sistema.
- Regras financeiras ficam exclusivamente em `src/lib/calculos.ts`.
- Não acessar Supabase, UI, RPCs ou persistência a partir deste módulo.
- Esta pasta não é um repositório Git; não executar commits.

## Review Focus

- Valor com fração, negativo ou `NaN` deve falhar antes de gerar um resultado financeiro — cobrir na Task 1.
- Datas em meses curtos e anos bissextos devem preservar o dia de vencimento quando possível — cobrir na Task 3.
- Carência deve impedir tanto juros como multa no limite exato de dias — cobrir na Task 1.
- Uma exceção de limite não pode liberar cliente bloqueado — cobrir na Task 4.
- Pagamento que supera a dívida não pode gerar saldo negativo nem crédito silencioso — cobrir na Task 2.

---

## File Structure

- Create: `src/lib/calculos.ts` — tipos, validações e todas as regras financeiras puras.
- Create: `src/lib/calculos.test.ts` — testes unitários dos contratos financeiros.
- Modify: `docs/status-plano.md` — evidência da etapa somente após validação completa.

### Task 1: Encargos por atraso e validações numéricas

**Files:**
- Create: `src/lib/calculos.ts`
- Create: `src/lib/calculos.test.ts`

**Interfaces:**
- Produces: `type RegrasEncargos = { jurosMensalBps: number; multaBps: number; carenciaDias: number }`.
- Produces: `calcularEncargos(input: { principalAbertoCentavos: number; vencimento: Date; hoje: Date; regras: RegrasEncargos }): { diasAtraso: number; multaCentavos: number; jurosCentavos: number; totalCentavos: number }`.
- Produces: validação interna reutilizável para centavos, bps e datas; funções futuras usam os mesmos critérios.

- [ ] **Step 1: Escrever testes de parcela em dia, carência, atrasos de 7 e 30 dias e entradas inválidas.**

Use vencimento `2026-01-10`; para sete dias, principal `8000`, multa `200`, juros `100`, carência `0`, espere multa `160`, juros `19` e total `8179`. Para trinta dias, espere juros `80`. No limite da carência, espere encargos zero. Teste principal fracionário/negativo, bps negativo e data inválida.

- [ ] **Step 2: Executar o teste para confirmar a falha inicial.**

Run: `npm run test -- src/lib/calculos.test.ts`

Expected: FAIL porque o módulo e a função ainda não existem.

- [ ] **Step 3: Implementar `calcularEncargos` em `src/lib/calculos.ts`.**

Calcule dias por data de calendário em UTC, aplique carência antes de multa/juros e arredonde meio para cima. Multa é aplicada uma vez sobre o principal; juros usam a fórmula especificada.

- [ ] **Step 4: Executar os testes de encargos.**

Run: `npm run test -- src/lib/calculos.test.ts`

Expected: PASS para os testes da Task 1.

### Task 2: Distribuição de pagamento e estorno calculado

**Files:**
- Modify: `src/lib/calculos.ts`
- Modify: `src/lib/calculos.test.ts`

**Interfaces:**
- Consumes: validação monetária da Task 1.
- Produces: `aplicarPagamento(input: { valorRecebidoCentavos: number; principalAbertoCentavos: number; encargosAbertosCentavos: number }): { encargosPagosCentavos: number; principalPagoCentavos: number; encargosRestantesCentavos: number; principalRestanteCentavos: number; quitada: boolean }`.
- Produces: `reverterPagamento(input: { principalAbertoAntesCentavos: number; encargosAbertosAntesCentavos: number; principalPagoCentavos: number; encargosPagosCentavos: number }): { principalAbertoCentavos: number; encargosAbertosCentavos: number; quitada: false }`.

- [ ] **Step 1: Escrever testes de pagamento menor que encargos, parcial de principal, quitação e excedente.**

Verifique que `100` recebidos contra `200` de encargos não abatem principal; que um pagamento após encargos reduz corretamente o principal; e que um valor maior que a dívida não cria saldo negativo. Teste que `reverterPagamento` restaura os saldos antes do pagamento e sempre marca a parcela como aberta.

- [ ] **Step 2: Executar o teste para confirmar a falha inicial.**

Run: `npm run test -- src/lib/calculos.test.ts`

Expected: FAIL porque as funções de pagamento e estorno ainda não existem.

- [ ] **Step 3: Implementar `aplicarPagamento` e `reverterPagamento`.**

Abata encargos primeiro, depois principal, e limite cada abatimento ao saldo da respectiva camada. `reverterPagamento` não persiste nem calcula novos encargos: apenas recompõe o estado financeiro informado.

- [ ] **Step 4: Executar os testes de pagamentos.**

Run: `npm run test -- src/lib/calculos.test.ts`

Expected: PASS para as Tasks 1 e 2.

### Task 3: Parcelamento e vencimentos mensais

**Files:**
- Modify: `src/lib/calculos.ts`
- Modify: `src/lib/calculos.test.ts`

**Interfaces:**
- Consumes: validação monetária da Task 1.
- Produces: `dividirParcelas(valorTotalCentavos: number, quantidadeParcelas: number): number[]`.
- Produces: `gerarVencimentosMensais(primeiroVencimento: Date, quantidadeParcelas: number): Date[]`.

- [ ] **Step 1: Escrever testes de divisão exata e vencimentos de fim de mês.**

Para `10000` em três parcelas, espere `[3334, 3333, 3333]` e soma `10000`. Para primeiro vencimento em `2026-01-31`, espere `2026-01-31`, `2026-02-28` e `2026-03-31`; inclua fevereiro bissexto. Teste quantidade fora de 1–24.

- [ ] **Step 2: Executar o teste para confirmar a falha inicial.**

Run: `npm run test -- src/lib/calculos.test.ts`

Expected: FAIL porque as funções de parcelamento e vencimento ainda não existem.

- [ ] **Step 3: Implementar `dividirParcelas` e `gerarVencimentosMensais`.**

Entregue o resto para o primeiro item. Trabalhe com componentes UTC de data e determine o último dia do mês para evitar deslocamento por fuso horário.

- [ ] **Step 4: Executar os testes de parcelamento.**

Run: `npm run test -- src/lib/calculos.test.ts`

Expected: PASS para as Tasks 1–3.

### Task 4: Decisão de crédito, regressão de snapshot e validação final

**Files:**
- Modify: `src/lib/calculos.ts`
- Modify: `src/lib/calculos.test.ts`
- Modify: `docs/status-plano.md`

**Interfaces:**
- Consumes: `calcularEncargos` da Task 1.
- Produces: `avaliarCompra(input: { limiteEfetivoCentavos: number; principalAbertoCentavos: number; valorCompraCentavos: number; clienteBloqueado: boolean; excecaoAutorizada: boolean }): { permitida: boolean; motivo?: 'cliente_bloqueado' | 'limite_excedido'; limiteDisponivelCentavos: number }`.

- [ ] **Step 1: Escrever testes de limite, exceção, bloqueio e snapshot de regras.**

Teste compra dentro e acima do limite, autorização de exceção e cliente bloqueado com exceção. Demonstre snapshot chamando `calcularEncargos` com regras antigas e novas sobre os mesmos dados: o resultado com o snapshot antigo deve permanecer idêntico. Registre que pagamentos são aceitos fora da decisão de compra.

- [ ] **Step 2: Executar o teste para confirmar a falha inicial.**

Run: `npm run test -- src/lib/calculos.test.ts`

Expected: FAIL porque `avaliarCompra` ainda não existe.

- [ ] **Step 3: Implementar `avaliarCompra`.**

Priorize `cliente_bloqueado`; calcule limite disponível somente com principal aberto e só aceite exceção quando o cliente não estiver bloqueado.

- [ ] **Step 4: Executar validação completa e atualizar o status auditado.**

Run: `npm run lint; npm run test; npm run build`

Expected: lint, testes e build passam. Atualize `docs/status-plano.md` com a contagem de testes e a evidência da etapa; não marque integrações de compra/pagamento como concluídas.

## Self-review

- Cobertura: Tasks 1–4 implementam todos os componentes da especificação e os 12 cenários obrigatórios.
- Consistência: Tasks 2–4 usam as validações e contratos definidos na Task 1; nenhum consumidor externo é criado.
- Review Focus: entradas inválidas, carência, anos bissextos, cliente bloqueado com exceção e pagamento excedente estão incluídos nas respectivas tasks.
- Proporção: o plano define assinaturas, dados de teste e verificações, sem transcrever a implementação.
