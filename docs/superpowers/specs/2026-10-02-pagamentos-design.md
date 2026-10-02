# Design: recebimento de pagamentos

## Objetivo

Permitir receber pagamentos integrais ou parciais de parcelas abertas, distribuir o valor entre encargos e principal e gerar recibo copiável.

## Fluxo

1. Selecionar cliente e listar parcelas abertas da mais antiga para a mais nova.
2. Informar valor total recebido e forma (`dinheiro`, `pix`, `cartao` ou `outro`).
3. Exibir encargos atuais e prévia da distribuição, usando `calculos.ts`.
4. Confirmar chamando a RPC transacional `registrar_pagamento`.
5. Mostrar recibo textual com cliente, data, valor, forma e saldo restante.

## Segurança

- A Action exige perfil ativo; RLS e RPC continuam autoridade.
- Cliente bloqueado pode receber pagamento normalmente.
- A RPC rejeita valor superior ao saldo atualizado e altera a parcela para `paga` quando o principal chega a zero.
- Erros do banco viram mensagens neutras.
- Nenhum pagamento é apagado; estornos futuros usarão marcação e auditoria.

## Fora de escopo

- Estorno, renegociação, cobrança e envio de mensagens.
- Integração com meios de pagamento online.

## Testes

Cobrir distribuição parcial, pagamento integral, forma inválida, parcela inexistente, erro neutro da RPC, cliente bloqueado e recibo com saldo restante. E2E depende de Supabase de teste configurado.
