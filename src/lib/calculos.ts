export type RegrasEncargos = { jurosMensalBps: number; multaBps: number; carenciaDias: number };
const inteiroSeguro = (valor: number) => Number.isSafeInteger(valor);
const numeroSeguro = (valor: bigint) => { if (valor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Resultado fora da faixa segura.'); return Number(valor); };
const arredondarMeioParaCima = (numerador: bigint, denominador: bigint) => numeroSeguro((numerador + denominador / BigInt(2)) / denominador);

export function calcularEncargos(input: { principalAbertoCentavos: number; vencimento: Date; hoje: Date; regras: RegrasEncargos }) {
  const { principalAbertoCentavos: principal, vencimento, hoje, regras } = input;
  if (!inteiroSeguro(principal) || principal < 0) throw new Error('Principal inválido.');
  if (!inteiroSeguro(regras.jurosMensalBps) || regras.jurosMensalBps < 0 || !inteiroSeguro(regras.multaBps) || regras.multaBps < 0 || !inteiroSeguro(regras.carenciaDias) || regras.carenciaDias < 0) throw new Error('Regras inválidas.');
  if (Number.isNaN(vencimento.getTime()) || Number.isNaN(hoje.getTime())) throw new Error('Data inválida.');
  const dia = 86_400_000;
  const atraso = Math.max(0, Math.floor((Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()) - Date.UTC(vencimento.getUTCFullYear(), vencimento.getUTCMonth(), vencimento.getUTCDate())) / dia));
  if (atraso <= regras.carenciaDias) return { diasAtraso: atraso, multaCentavos: 0, jurosCentavos: 0, totalCentavos: principal };
  const multaCentavos = arredondarMeioParaCima(BigInt(principal) * BigInt(regras.multaBps), BigInt(10000));
  const jurosCentavos = arredondarMeioParaCima(BigInt(principal) * BigInt(regras.jurosMensalBps) * BigInt(atraso), BigInt(300000));
  const totalCentavos = principal + multaCentavos + jurosCentavos; if (!inteiroSeguro(totalCentavos)) throw new Error('Resultado fora da faixa segura.');
  return { diasAtraso: atraso, multaCentavos, jurosCentavos, totalCentavos };
}

export function aplicarPagamento(input: { valorRecebidoCentavos: number; principalAbertoCentavos: number; encargosAbertosCentavos: number }) {
  const { valorRecebidoCentavos, principalAbertoCentavos, encargosAbertosCentavos } = input;
  for (const valor of [valorRecebidoCentavos, principalAbertoCentavos, encargosAbertosCentavos]) {
    if (!inteiroSeguro(valor) || valor < 0) throw new Error('Valor inválido.');
  }
  const encargosPagosCentavos = Math.min(valorRecebidoCentavos, encargosAbertosCentavos);
  const principalPagoCentavos = Math.min(valorRecebidoCentavos - encargosPagosCentavos, principalAbertoCentavos);
  const encargosRestantesCentavos = encargosAbertosCentavos - encargosPagosCentavos;
  const principalRestanteCentavos = principalAbertoCentavos - principalPagoCentavos;
  return { encargosPagosCentavos, principalPagoCentavos, encargosRestantesCentavos, principalRestanteCentavos, quitada: encargosRestantesCentavos === 0 && principalRestanteCentavos === 0 };
}

export function reverterPagamento(input: { principalAbertoAntesCentavos: number; encargosAbertosAntesCentavos: number; principalPagoCentavos: number; encargosPagosCentavos: number }) {
  const { principalAbertoAntesCentavos, encargosAbertosAntesCentavos, principalPagoCentavos, encargosPagosCentavos } = input;
  for (const valor of [principalAbertoAntesCentavos, encargosAbertosAntesCentavos, principalPagoCentavos, encargosPagosCentavos]) {
    if (!inteiroSeguro(valor) || valor < 0) throw new Error('Valor inválido.');
  }
  return { principalAbertoCentavos: principalAbertoAntesCentavos, encargosAbertosCentavos: encargosAbertosAntesCentavos, quitada: false as const };
}

export function dividirParcelas(valorTotalCentavos: number, quantidadeParcelas: number): number[] {
  if (!inteiroSeguro(valorTotalCentavos) || valorTotalCentavos <= 0 || !inteiroSeguro(quantidadeParcelas) || quantidadeParcelas < 1 || quantidadeParcelas > 24) throw new Error('Parcelamento inválido.');
  const base = Math.floor(valorTotalCentavos / quantidadeParcelas);
  const resto = valorTotalCentavos % quantidadeParcelas;
  return Array.from({ length: quantidadeParcelas }, (_, indice) => base + (indice === 0 ? resto : 0));
}

export function gerarVencimentosMensais(primeiroVencimento: Date, quantidadeParcelas: number): Date[] {
  if (Number.isNaN(primeiroVencimento.getTime()) || !inteiroSeguro(quantidadeParcelas) || quantidadeParcelas < 1 || quantidadeParcelas > 24) throw new Error('Vencimento inválido.');
  const ano = primeiroVencimento.getUTCFullYear(); const mes = primeiroVencimento.getUTCMonth(); const dia = primeiroVencimento.getUTCDate();
  return Array.from({ length: quantidadeParcelas }, (_, indice) => { const alvo = mes + indice; const ultimo = new Date(Date.UTC(ano, alvo + 1, 0)).getUTCDate(); return new Date(Date.UTC(ano, alvo, Math.min(dia, ultimo))); });
}

export function avaliarCompra(input: { limiteEfetivoCentavos: number; principalAbertoCentavos: number; valorCompraCentavos: number; clienteBloqueado: boolean; excecaoAutorizada: boolean }) {
  const { limiteEfetivoCentavos, principalAbertoCentavos, valorCompraCentavos, clienteBloqueado, excecaoAutorizada } = input;
  for (const valor of [limiteEfetivoCentavos, principalAbertoCentavos, valorCompraCentavos]) if (!inteiroSeguro(valor) || valor < 0) throw new Error('Valor inválido.');
  const limiteDisponivelCentavos = limiteEfetivoCentavos - principalAbertoCentavos;
  if (clienteBloqueado) return { permitida: false, motivo: 'cliente_bloqueado' as const, limiteDisponivelCentavos };
  if (valorCompraCentavos > limiteDisponivelCentavos && !excecaoAutorizada) return { permitida: false, motivo: 'limite_excedido' as const, limiteDisponivelCentavos };
  return { permitida: true, limiteDisponivelCentavos };
}
