import { z } from 'zod';

const centavos = z.string().trim().regex(/^\d+$/, 'Limite inválido.').transform(Number)
  .refine((value) => Number.isSafeInteger(value) && value > 0, 'Limite inválido.');

export const clienteInputSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.'),
  telefone: z.string().trim().regex(/^\d+$/, 'Telefone inválido.').nullable(),
  observacoes: z.string().trim().nullable(),
  limite_centavos: z.number().nullable(),
});

export function parseClienteForm(formData: FormData) {
  const telefone = String(formData.get('telefone') ?? '').trim();
  const observacoes = String(formData.get('observacoes') ?? '').trim();
  const limite = String(formData.get('limite_centavos') ?? '').trim();
  return clienteInputSchema.parse({
    nome: String(formData.get('nome') ?? ''),
    telefone: telefone || null,
    observacoes: observacoes || null,
    limite_centavos: limite ? centavos.parse(limite) : null,
  });
}
