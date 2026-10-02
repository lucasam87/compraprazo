import { describe, expect, it } from 'vitest';
import { aplicarPagamento, avaliarCompra, calcularEncargos, dividirParcelas, gerarVencimentosMensais, reverterPagamento } from './calculos';

const regras = { jurosMensalBps: 100, multaBps: 200, carenciaDias: 0 };
const data = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('calcularEncargos', () => {
  it('não cobra parcela em dia', () => expect(calcularEncargos({ principalAbertoCentavos: 8000, vencimento: data('2026-01-10'), hoje: data('2026-01-10'), regras })).toEqual({ diasAtraso: 0, multaCentavos: 0, jurosCentavos: 0, totalCentavos: 8000 }));
  it('respeita a carência', () => expect(calcularEncargos({ principalAbertoCentavos: 8000, vencimento: data('2026-01-10'), hoje: data('2026-01-13'), regras: { ...regras, carenciaDias: 3 } }).totalCentavos).toBe(8000));
  it('calcula multa e juros simples em sete dias', () => expect(calcularEncargos({ principalAbertoCentavos: 8000, vencimento: data('2026-01-10'), hoje: data('2026-01-17'), regras })).toEqual({ diasAtraso: 7, multaCentavos: 160, jurosCentavos: 19, totalCentavos: 8179 }));
  it('cobra exatamente um mês de juros em trinta dias', () => expect(calcularEncargos({ principalAbertoCentavos: 8000, vencimento: data('2026-01-10'), hoje: data('2026-02-09'), regras })).toMatchObject({ jurosCentavos: 80 }));
  it('mantém resultado do snapshot antigo quando as regras mudam', () => {
    const entrada = { principalAbertoCentavos: 8000, vencimento: data('2026-01-10'), hoje: data('2026-01-17') };
    expect(calcularEncargos({ ...entrada, regras })).toEqual(calcularEncargos({ ...entrada, regras: { jurosMensalBps: 100, multaBps: 200, carenciaDias: 0 } }));
    expect(calcularEncargos({ ...entrada, regras: { jurosMensalBps: 200, multaBps: 500, carenciaDias: 0 } }).totalCentavos).toBeGreaterThan(8179);
  });
  it('rejeita dinheiro fracionário, bps negativo e data inválida', () => {
    expect(() => calcularEncargos({ principalAbertoCentavos: 1.5, vencimento: data('2026-01-10'), hoje: data('2026-01-11'), regras })).toThrow();
    expect(() => calcularEncargos({ principalAbertoCentavos: 1, vencimento: data('2026-01-10'), hoje: data('2026-01-11'), regras: { ...regras, multaBps: -1 } })).toThrow();
    expect(() => calcularEncargos({ principalAbertoCentavos: 1, vencimento: new Date('invalida'), hoje: data('2026-01-11'), regras })).toThrow();
  });
  it('rejeita inteiros fora da faixa segura', () => expect(() => calcularEncargos({ principalAbertoCentavos: Number.MAX_SAFE_INTEGER + 1, vencimento: data('2026-01-10'), hoje: data('2026-01-11'), regras })).toThrow());
});

describe('aplicarPagamento', () => {
  it('quita encargos antes de abater principal', () => {
    expect(aplicarPagamento({ valorRecebidoCentavos: 100, principalAbertoCentavos: 8000, encargosAbertosCentavos: 200 }))
      .toEqual({ encargosPagosCentavos: 100, principalPagoCentavos: 0, encargosRestantesCentavos: 100, principalRestanteCentavos: 8000, quitada: false });
  });

  it('abate o principal após quitar encargos e não cria saldo negativo', () => {
    expect(aplicarPagamento({ valorRecebidoCentavos: 9000, principalAbertoCentavos: 8000, encargosAbertosCentavos: 200 }))
      .toEqual({ encargosPagosCentavos: 200, principalPagoCentavos: 8000, encargosRestantesCentavos: 0, principalRestanteCentavos: 0, quitada: true });
  });
  it('reduz parcialmente o principal depois dos encargos', () => expect(aplicarPagamento({ valorRecebidoCentavos: 700, principalAbertoCentavos: 8000, encargosAbertosCentavos: 200 })).toEqual({ encargosPagosCentavos: 200, principalPagoCentavos: 500, encargosRestantesCentavos: 0, principalRestanteCentavos: 7500, quitada: false }));
});

describe('reverterPagamento', () => {
  it('reabre a parcela com os saldos anteriores ao pagamento', () => {
    expect(reverterPagamento({ principalAbertoAntesCentavos: 8000, encargosAbertosAntesCentavos: 200, principalPagoCentavos: 500, encargosPagosCentavos: 200 }))
      .toEqual({ principalAbertoCentavos: 8000, encargosAbertosCentavos: 200, quitada: false });
  });
});

describe('parcelas e vencimentos', () => {
  it('entrega o resto para a primeira parcela', () => expect(dividirParcelas(10000, 3)).toEqual([3334, 3333, 3333]));
  it('preserva o dia ou usa o último dia do mês', () => expect(gerarVencimentosMensais(data('2026-01-31'), 3).map((item) => item.toISOString().slice(0, 10))).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']));
  it('aceita fevereiro bissexto', () => expect(gerarVencimentosMensais(data('2024-01-31'), 2)[1].toISOString().slice(0, 10)).toBe('2024-02-29'));
});

describe('avaliarCompra', () => {
  it('permite compra dentro do limite', () => expect(avaliarCompra({ limiteEfetivoCentavos: 10000, principalAbertoCentavos: 3000, valorCompraCentavos: 7000, clienteBloqueado: false, excecaoAutorizada: false }).permitida).toBe(true));
  it('bloqueia compra acima do limite sem exceção', () => expect(avaliarCompra({ limiteEfetivoCentavos: 10000, principalAbertoCentavos: 3000, valorCompraCentavos: 7001, clienteBloqueado: false, excecaoAutorizada: false })).toEqual({ permitida: false, motivo: 'limite_excedido', limiteDisponivelCentavos: 7000 }));
  it('permite exceção autorizada para limite', () => expect(avaliarCompra({ limiteEfetivoCentavos: 10000, principalAbertoCentavos: 3000, valorCompraCentavos: 7001, clienteBloqueado: false, excecaoAutorizada: true }).permitida).toBe(true));
  it('nunca libera cliente bloqueado', () => expect(avaliarCompra({ limiteEfetivoCentavos: 10000, principalAbertoCentavos: 0, valorCompraCentavos: 1, clienteBloqueado: true, excecaoAutorizada: true })).toEqual({ permitida: false, motivo: 'cliente_bloqueado', limiteDisponivelCentavos: 10000 }));
});
