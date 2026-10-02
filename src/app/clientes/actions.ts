'use server';

import { requireActiveProfile } from '../../lib/auth';
import { parseClienteForm } from '../../lib/schemas';
import { createClient } from '../../lib/supabase/server';

export type ClienteActionState = { ok: true } | { ok: false; erro: string };

async function authorized() {
  try {
    const client = await createClient();
    const profile = await requireActiveProfile(client as never);
    return { client, profile };
  } catch {
    return null;
  }
}

export async function criarCliente(formData: FormData): Promise<ClienteActionState> {
  const access = await authorized();
  if (!access) return { ok: false, erro: 'Acesso negado.' };
  try {
    const dados = parseClienteForm(formData);
    const { error } = await access.client.from('clientes').insert({ ...dados, criado_por: access.profile.id, ativo: true });
    if (error) return { ok: false, erro: 'Não foi possível salvar o cliente.' };
    return { ok: true };
  } catch { return { ok: false, erro: 'Não foi possível salvar o cliente.' }; }
}

export async function editarCliente(formData: FormData): Promise<ClienteActionState> {
  const access = await authorized();
  if (!access) return { ok: false, erro: 'Acesso negado.' };
  try {
    const id = String(formData.get('id') ?? '');
    if (!id) return { ok: false, erro: 'Cliente inválido.' };
    const dados = parseClienteForm(formData);
    const { error } = await access.client.from('clientes').update(dados).eq('id', id);
    if (error) return { ok: false, erro: 'Não foi possível salvar o cliente.' };
    return { ok: true };
  } catch { return { ok: false, erro: 'Não foi possível salvar o cliente.' }; }
}

export async function inativarCliente(formData: FormData): Promise<ClienteActionState> {
  const access = await authorized();
  if (!access) return { ok: false, erro: 'Acesso negado.' };
  try {
    const id = String(formData.get('id') ?? '');
    if (!id) return { ok: false, erro: 'Cliente inválido.' };
    const { error } = await access.client.from('clientes').update({ ativo: false }).eq('id', id);
    if (error) return { ok: false, erro: 'Não foi possível inativar o cliente.' };
    return { ok: true };
  } catch { return { ok: false, erro: 'Não foi possível inativar o cliente.' }; }
}
