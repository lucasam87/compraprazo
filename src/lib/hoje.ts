export type LinhaHoje = {
  vencimento: string;
  valor_centavos: number;
  status: string;
  cliente_id: string;
};

export function resumirHoje(rows: LinhaHoje[], hoje: string) {
  const vencendoHoje = rows.filter((row) => row.status === 'aberta' && row.vencimento === hoje);
  const atrasados = new Set(
    rows
      .filter((row) => row.status === 'aberta' && row.vencimento < hoje)
      .map((row) => row.cliente_id),
  );
  return {
    vencendoHoje: vencendoHoje.length,
    totalPrevistoCentavos: vencendoHoje.reduce((total, row) => total + row.valor_centavos, 0),
    clientesEmAtraso: atrasados.size,
  };
}
