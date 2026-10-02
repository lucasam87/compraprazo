import { describe, expect, it } from 'vitest';
import { criarPreviaPagamento, gerarRecibo } from './pagamentos';

const data = (value: string) => new Date(`${value}T00:00:00.000Z`);
const parcela = { principalAbertoCentavos: 8000, vencimento: data('2026-01-10'), hoje: data('2026-01-17'), regras: { jurosMensalBps: 100, multaBps: 200, carenciaDias: 0 } };

describe('pagamentos', () => {
  it('distribui pagamento parcial entre encargos e principal', () => expect(criarPreviaPagamento({ ...parcela, valorRecebidoCentavos: 700 })).toMatchObject({ encargosPagosCentavos: 179, principalPagoCentavos: 521, principalRestanteCentavos: 7479 }));
  it('rejeita forma inválida e pagamento acima do saldo', () => {
    expect(() => criarPreviaPagamento({ ...parcela, valorRecebidoCentavos: 1, forma: 'cheque' })).toThrow();
    expect(() => criarPreviaPagamento({ ...parcela, valorRecebidoCentavos: 9000 })).toThrow();
  });
  it('gera recibo sem saldo negativo', () => expect(gerarRecibo({ cliente: 'Ana', data: data('2026-01-17'), valorPagoCentavos: 700, forma: 'pix', saldoRestanteCentavos: 7479 })).toContain('Saldo restante: 7479 centavos'));
});
