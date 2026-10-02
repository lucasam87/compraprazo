import { dividirParcelas, gerarVencimentosMensais } from './calculos';

export function criarPreviaCompra(input: { valorTotalCentavos: number; quantidadeParcelas: number; primeiroVencimento: Date }) {
  if (Number.isNaN(input.primeiroVencimento.getTime())) throw new Error('Data inválida.');
  const valoresCentavos = dividirParcelas(input.valorTotalCentavos, input.quantidadeParcelas);
  const vencimentos = gerarVencimentosMensais(input.primeiroVencimento, input.quantidadeParcelas);
  return { valoresCentavos, vencimentos };
}
