import { beforeEach, describe, expect, it, vi } from 'vitest';
import { criarCliente, editarCliente, inativarCliente } from './actions';

const deps = vi.hoisted(() => ({ createClient: vi.fn(), requireActiveProfile: vi.fn() }));
vi.mock('../../lib/supabase/server', () => ({ createClient: deps.createClient }));
vi.mock('../../lib/auth', () => ({ requireActiveProfile: deps.requireActiveProfile }));

const form = (values: Record<string, string>) => { const result = new FormData(); Object.entries(values).forEach(([key, value]) => result.set(key, value)); return result; };

beforeEach(() => { vi.resetAllMocks(); deps.requireActiveProfile.mockResolvedValue({ id: 'user-1', nome: 'Ana', papel: 'dono' }); });

describe('criarCliente', () => {
  it('insere cliente com autor autenticado', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    deps.createClient.mockResolvedValue({ from: () => ({ insert }) });
    expect(await criarCliente(form({ nome: 'Ana', telefone: '', observacoes: '', limite_centavos: '' }))).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({ nome: 'Ana', telefone: null, observacoes: null, limite_centavos: null, criado_por: 'user-1', ativo: true });
  });
  it('retorna erro neutro quando o banco falha', async () => {
    deps.createClient.mockResolvedValue({ from: () => ({ insert: vi.fn().mockResolvedValue({ error: new Error('segredo') }) }) });
    expect(await criarCliente(form({ nome: 'Ana', telefone: '', observacoes: '', limite_centavos: '' }))).toEqual({ ok: false, erro: 'Não foi possível salvar o cliente.' });
  });
});

describe('editarCliente e inativarCliente', () => {
  it('atualiza campos permitidos pelo id', async () => {
    const update = vi.fn().mockReturnThis(); const eq = vi.fn().mockResolvedValue({ error: null });
    deps.createClient.mockResolvedValue({ from: () => ({ update, eq }) });
    expect(await editarCliente(form({ id: 'client-1', nome: 'Bia', telefone: '', observacoes: '', limite_centavos: '' }))).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ nome: 'Bia', telefone: null, observacoes: null, limite_centavos: null });
    expect(eq).toHaveBeenCalledWith('id', 'client-1');
  });
  it('inativa sem usar delete', async () => {
    const update = vi.fn().mockReturnThis(); const eq = vi.fn().mockResolvedValue({ error: null });
    deps.createClient.mockResolvedValue({ from: () => ({ update, eq }) });
    expect(await inativarCliente(form({ id: 'client-1' }))).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ ativo: false });
  });
  it('bloqueia ação sem perfil ativo', async () => {
    deps.requireActiveProfile.mockRejectedValue(new Error('sem acesso'));
    expect(await criarCliente(form({ nome: 'Ana', telefone: '', observacoes: '', limite_centavos: '' }))).toEqual({ ok: false, erro: 'Acesso negado.' });
  });
});
