import { aplicarPagamento, calcularEncargos, type RegrasEncargos } from './calculos';

export const formasPagamento = ['dinheiro', 'pix', 'cartao', 'outro'] as const;
export type FormaPagamento = typeof formasPagamento[number];

export function criarPreviaPagamento(input: { principalAbertoCentavos: number; vencimento: Date; hoje: Date; regras: RegrasEncargos; valorRecebidoCentavos: number; forma?: string }) {
  if (input.forma !== undefined && !formasPagamento.includes(input.forma as FormaPagamento)) throw new Error('Forma inválida.');
  const encargos = calcularEncargos({ principalAbertoCentavos: input.principalAbertoCentavos, vencimento: input.vencimento, hoje: input.hoje, regras: input.regras });
  if (input.valorRecebidoCentavos > input.principalAbertoCentavos + encargos.multaCentavos + encargos.jurosCentavos) throw new Error('Pagamento maior que o saldo atualizado.');
  return { ...aplicarPagamento({ valorRecebidoCentavos: input.valorRecebidoCentavos, principalAbertoCentavos: input.principalAbertoCentavos, encargosAbertosCentavos: encargos.multaCentavos + encargos.jurosCentavos }), encargosAtuaisCentavos: encargos.multaCentavos + encargos.jurosCentavos };
}

export function gerarRecibo(input: { cliente: string; data: Date; valorPagoCentavos: number; forma: FormaPagamento; saldoRestanteCentavos: number }) {
  if (input.saldoRestanteCentavos < 0) throw new Error('Saldo inválido.');
  return `Recibo — Crediário\nCliente: ${input.cliente}\nPago em ${input.data.toISOString().slice(0, 10)}: ${input.valorPagoCentavos} centavos (${input.forma})\nSaldo restante: ${input.saldoRestanteCentavos} centavos`;
}

const nomesFormas: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao: 'Cartão',
  outro: 'Outro',
};

export function gerarReciboPagamento(input: { pagamentoId: string; valorCentavos: number; forma: FormaPagamento; criadoEm: Date }): string {
  if (!input.pagamentoId || !Number.isSafeInteger(input.valorCentavos) || input.valorCentavos < 0) throw new Error('Dados do recibo inválidos.');
  if (Number.isNaN(input.criadoEm.getTime())) throw new Error('Data do recibo inválida.');
  const valor = (input.valorCentavos / 100).toFixed(2).replace('.', ',');
  const data = input.criadoEm.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `Recibo — Crediário\nPagamento: ${input.pagamentoId}\nValor: R$ ${valor}\nForma: ${nomesFormas[input.forma]}\nData: ${data}`;
}
