import { describe, expect, it } from 'vitest';
import { criarPreviaCompra } from './compras';

const data = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('criarPreviaCompra', () => {
  it('divide exatamente e gera vencimentos mensais', () => {
    const previa = criarPreviaCompra({ valorTotalCentavos: 10000, quantidadeParcelas: 3, primeiroVencimento: data('2026-01-31') });
    expect(previa.valoresCentavos).toEqual([3334, 3333, 3333]);
    expect(previa.vencimentos.map((item) => item.toISOString().slice(0, 10))).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });
  it('rejeita dados inválidos', () => expect(() => criarPreviaCompra({ valorTotalCentavos: 0, quantidadeParcelas: 3, primeiroVencimento: data('2026-01-01') })).toThrow());
});
