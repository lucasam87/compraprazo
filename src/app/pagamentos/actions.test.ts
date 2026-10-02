import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registrarPagamento } from './actions';

const deps = vi.hoisted(() => ({ createClient: vi.fn(), requireActiveProfile: vi.fn() }));
vi.mock('../../lib/supabase/server', () => ({ createClient: deps.createClient }));
vi.mock('../../lib/auth', () => ({ requireActiveProfile: deps.requireActiveProfile }));

const form = (values: Record<string, string>) => {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) => result.set(key, value));
  return result;
};

beforeEach(() => {
  vi.resetAllMocks();
  deps.requireActiveProfile.mockResolvedValue({ id: 'user-1', nome: 'Ana', papel: 'dono' });
});

describe('registrarPagamento', () => {
  it('retorna recibo quando a RPC confirma o pagamento', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'pag-1', error: null });
    deps.createClient.mockResolvedValue({ rpc });

    const result = await registrarPagamento(form({ parcela_id: 'parcela-1', valor_centavos: '1250', forma: 'pix' }));

    expect(result).toMatchObject({ ok: true, pagamentoId: 'pag-1' });
    expect(result.ok && result.recibo).toContain('Pagamento: pag-1');
  });

  it('não retorna recibo quando a RPC falha', async () => {
    deps.createClient.mockResolvedValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('segredo') }) });

    const result = await registrarPagamento(form({ parcela_id: 'parcela-1', valor_centavos: '1250', forma: 'pix' }));

    expect(result).toEqual({ ok: false, erro: 'Não foi possível registrar o pagamento.' });
  });
});
