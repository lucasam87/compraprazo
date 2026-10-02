import { describe, expect, it } from 'vitest';
import { parseClienteForm } from './schemas';

function form(values: Record<string, string>) {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) => result.set(key, value));
  return result;
}

describe('parseClienteForm', () => {
  it('aceita telefone opcional e normaliza campos', () => {
    expect(parseClienteForm(form({ nome: '  Ana  ', telefone: '', observacoes: '  boa cliente ', limite_centavos: '' }))).toEqual({ nome: 'Ana', telefone: null, observacoes: 'boa cliente', limite_centavos: null });
  });
  it('aceita telefone somente com dígitos e limite em centavos', () => {
    expect(parseClienteForm(form({ nome: 'Ana', telefone: '11999998888', observacoes: '', limite_centavos: '35000' }))).toMatchObject({ telefone: '11999998888', limite_centavos: 35000 });
  });
  it.each([
    { nome: '', telefone: '', limite_centavos: '' },
    { nome: 'Ana', telefone: '(11) 99999-8888', limite_centavos: '' },
    { nome: 'Ana', telefone: '', limite_centavos: '-1' },
    { nome: 'Ana', telefone: '', limite_centavos: '1.5' },
  ])('rejeita entrada inválida %j', (values) => expect(() => parseClienteForm(form(values))).toThrow());
});
