import { describe, expect, it } from 'vitest';
import { resumirHoje } from './hoje';

describe('resumirHoje', () => {
  it('conta vencimentos de hoje e soma o previsto', () => {
    expect(resumirHoje([
      { vencimento: '2026-02-03', valor_centavos: 1000, status: 'aberta', cliente_id: 'a' },
      { vencimento: '2026-02-03', valor_centavos: 2500, status: 'aberta', cliente_id: 'b' },
      { vencimento: '2026-02-04', valor_centavos: 900, status: 'aberta', cliente_id: 'c' },
    ], '2026-02-03')).toEqual({ vencendoHoje: 2, totalPrevistoCentavos: 3500, clientesEmAtraso: 0 });
  });

  it('conta clientes atrasados uma única vez', () => {
    expect(resumirHoje([
      { vencimento: '2026-02-01', valor_centavos: 1000, status: 'aberta', cliente_id: 'a' },
      { vencimento: '2026-02-02', valor_centavos: 1200, status: 'aberta', cliente_id: 'a' },
      { vencimento: '2026-02-02', valor_centavos: 800, status: 'paga', cliente_id: 'b' },
    ], '2026-02-03').clientesEmAtraso).toBe(1);
  });

  it('retorna zeros sem parcelas', () => {
    expect(resumirHoje([], '2026-02-03')).toEqual({ vencendoHoje: 0, totalPrevistoCentavos: 0, clientesEmAtraso: 0 });
  });
});
