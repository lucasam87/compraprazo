# Design: núcleo de cálculos financeiros

## Objetivo

Criar `src/lib/calculos.ts` como único módulo de regras financeiras do Crediário. Ele será puro, determinístico e independente de Supabase, UI e Server Actions, para que compras, pagamentos e cobranças compartilhem os mesmos resultados.

## Restrições

- Dinheiro usa `number` inteiro em centavos; valores com fração ou negativos são inválidos.
- Percentuais usam inteiros em pontos-base: 1% equivale a 100 bps.
- Juros são simples, proporcionais aos dias de atraso e calculados sobre o principal ainda aberto.
- Arredondamentos usam meio para cima.
- Todas as funções recebem datas de referência explicitamente; não usam a data do sistema.
- Nenhuma função persiste, chama RPC, consulta banco ou formata valores para a interface.

## Componentes e contratos

### Encargos de parcela

Uma função recebe saldo principal, vencimento, data de referência e snapshot de regras (`jurosMensalBps`, `multaBps`, `carenciaDias`). Ela retorna `diasAtraso`, `multaCentavos`, `jurosCentavos` e `totalCentavos`.

- Dentro da carência, encargos são zero.
- A multa é única e aplicada somente quando há atraso após a carência.
- Juros simples seguem `round(saldoPrincipal * jurosMensalBps / 10000 * diasAtraso / 30)`.

### Pagamento parcial

Uma função recebe o valor recebido, principal aberto e encargos atuais. O resultado discrimina encargos pagos, principal pago, saldo principal restante, encargos restantes e se a parcela está quitada.

O valor recebido é aplicado primeiro aos encargos. O principal remanescente continua sendo a base de juros de leituras futuras.

### Parcelas e vencimentos

Uma função divide o valor total em 1 a 24 parcelas. A primeira recebe todos os centavos de resto e a soma é exatamente o total informado.

Outra função gera vencimentos mensais a partir da primeira data, preservando o dia original quando ele existe e usando o último dia em meses mais curtos.

### Crédito e bloqueio

Uma função recebe limite efetivo, principal aberto, valor da compra, estado de bloqueio e autorização de exceção. Ela retorna decisão permitida/negada e motivo estruturado.

- Cliente bloqueado não pode comprar, mesmo com exceção de limite.
- Compra dentro do limite é permitida.
- Compra acima do limite só é permitida com exceção autorizada pelo dono.
- Pagamentos não passam por essa decisão e seguem permitidos para clientes bloqueados.

### Estorno

O módulo expõe uma transformação pura do estado calculado para uma parcela após estorno: pagamento estornado deixa de abater principal e encargos. A RPC futura persistirá a auditoria e a alteração de status.

## Validação de entradas

Funções lançam erro para valores monetários não inteiros ou negativos, bps negativos, parcelas fora de 1–24 e datas inválidas. Erros impedem resultados financeiros silenciosamente incorretos.

## Testes

`src/lib/calculos.test.ts` cobrirá os 12 cenários obrigatórios da especificação do produto:

1. Parcela em dia.
2. Atraso dentro da carência.
3. Atraso de sete dias.
4. Atraso de trinta dias.
5. Snapshot de regras antigo.
6. Divisão com resto na primeira parcela.
7. Vencimento no fim do mês.
8. Pagamento menor que encargos.
9. Pagamento parcial do principal.
10. Limite excedido e exceção autorizada.
11. Cliente bloqueado com pagamento permitido.
12. Estorno reabre a parcela.

Também serão testadas entradas inválidas que possam produzir erro de centavos, datas ou bps.

## Fora de escopo

- Persistência de compras, parcelas, pagamentos ou auditoria.
- Regras de UI e formatação em BRL.
- Juros compostos.
- Integração com Supabase e RPCs, que serão consumidores futuros deste módulo.
