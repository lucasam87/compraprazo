# Crediário — Sistema de compras a prazo

> Documento de especificação para implementação com Codex.
> Idioma do produto: português do Brasil. Moeda: BRL. Fuso: America/Sao_Paulo.

---

## 0. Instruções para o agente (leia primeiro)

1. Implemente **por fases** (seção 13). Termine uma fase, rode os testes, só então siga.
2. **Dinheiro é sempre inteiro em centavos** (`bigint`/`number`). Nunca `float`, nunca `numeric` com casas.
3. **Percentuais são inteiros em pontos-base (bps)**: 1% = 100 bps, 2,5% = 250 bps.
4. **Nunca apague registros.** Use `status = 'cancelada'` ou `ativo = false`.
5. **Juros e multa são calculados na leitura**, não gravados todo dia.
6. **Cada compra guarda um snapshot** das regras vigentes no dia da compra.
7. Toda regra de cálculo fica em **um único módulo** (`src/lib/calculos.ts`) com testes unitários. Nenhuma tela recalcula por conta própria.
8. Toda tabela com dados de cliente tem **RLS ativado**.
9. Interface **simples**: pouca informação por tela, uma ação principal por tela (seção 3).
10. Se algo não estiver especificado, escolha a opção mais simples e registre em `docs/decisoes.md`.

---

## 1. Visão do produto

**Para quem:** dono de farmácia que vende fiado (compra a prazo) para clientes conhecidos.

**Problema:** hoje o controle de quem deve, quanto, e quando cobrar é manual e se perde.

**O que o sistema faz:**
1. Cadastra clientes com limite de crédito.
2. Registra compras a prazo e gera as parcelas.
3. Registra pagamentos (inclusive parciais).
4. Calcula multa e juros de atraso com regras configuráveis.
5. Bloqueia cliente (manual e automático).
6. Gera mensagem de cobrança pronta para copiar e enviar no WhatsApp.

**Fora do escopo (por enquanto):** PDV, estoque, emissão de nota fiscal, envio automático de mensagens, pagamentos online.

**Decisão pendente do dono:** juros simples ou compostos. **Padrão adotado: juros simples.** Mudar depois exige alterar só `calculos.ts`.

---

## 2. Stack e arquitetura

| Camada | Escolha | Motivo |
|---|---|---|
| Front + back | Next.js (App Router) + TypeScript | Um projeto só |
| UI | Tailwind CSS | Rápido, sem biblioteca pesada |
| Banco/Auth | Supabase (Postgres + Auth + RLS) | Gratuito para começar |
| Validação | Zod | Mesmo schema no front e no servidor |
| Testes | Vitest (unitários), Playwright (fluxo principal) | |
| Hospedagem | Vercel | Deploy automático |
| Rotina diária | `pg_cron` no Supabase | Bloqueio automático |

```
Navegador (PWA, mobile-first)
        │
Next.js (Server Components + Server Actions)
        │  usa
   src/lib/calculos.ts  ←  fonte única das regras
        │
Supabase
 ├─ Auth (login e-mail/senha)
 ├─ Postgres (tabelas + views + funções RPC)
 ├─ RLS (acesso só de usuários autorizados)
 └─ pg_cron (bloqueio diário)
```

**Princípio:** regras que precisam ser atômicas (criar compra + parcelas, registrar pagamento) rodam como **funções SQL (RPC)** dentro de uma transação. O front só chama a função.

---

## 3. Design (UI/UX)

### 3.1 Direção
O sistema é usado no balcão, no celular, com pressa e interrupções. Logo:
- **Uma pergunta por tela:** "quem vence hoje?", "quanto esse cliente deve?"
- **Pouca informação de uma vez.** Máximo de 3 números em destaque por tela.
- **Nada de painéis cheios.** Listas respiram; detalhes ficam em uma segunda tela.
- **Cor só para status.** O resto é neutro.
- **Botões grandes** (alvo mínimo 48px), ação principal sempre embaixo, ao alcance do polegar.

### 3.2 Paleta
| Nome | Hex | Uso |
|---|---|---|
| Papel | `#F3F6F5` | Fundo |
| Branco | `#FFFFFF` | Superfície de listas e formulários |
| Tinta | `#17211F` | Texto principal |
| Névoa | `#5C6B67` | Texto secundário (contraste ≥ 4.5:1 sobre Papel) |
| Pinheiro | `#14524A` | Ação principal, links |
| Atrasado | `#B93A32` | Parcela atrasada, bloqueio |
| Hoje | `#A86A0B` | Vence hoje / próximo |
| Pago | `#2B7A4B` | Quitado |

Regra: **status nunca depende só de cor.** Sempre cor + texto ("Atrasada 7 dias") + faixa lateral.

### 3.3 Tipografia
- Família única: **Atkinson Hyperlegible Next** (Google Fonts), pensada para legibilidade máxima.
- Números com `font-variant-numeric: tabular-nums` (valores alinhados).
- Escala: 14 / 16 (base) / 20 / 28 / 40. Peso 400, 600, 700.
- Linhas de texto com no máximo 60 caracteres. Frases curtas.
- Sem texto em caixa alta. Sem rótulo decorativo acima de títulos.

### 3.4 Layout e componentes
- **Mobile-first**, largura de conteúdo máxima 640px, centralizado também no desktop.
- **Linhas de lista, não cartões.** Cada linha: faixa vertical de 4px na cor do status à esquerda, nome em peso 600, detalhe em Névoa, valor à direita em peso 700.
- Raios: 8px em campos e botões; 0 nas linhas de lista. Sem sombras, só uma linha divisória de 1px.
- Botão principal: Pinheiro, texto branco, altura 52px, largura total no mobile.
- Botão secundário: contorno Pinheiro.
- Barra inferior com 4 destinos: **Hoje · Clientes · Nova compra · Ajustes**.
- Foco de teclado visível (anel 3px Pinheiro). Respeitar `prefers-reduced-motion`.
- Animação só em resposta a ação (abrir folha de confirmação, copiar mensagem → botão vira "Copiado").

### 3.5 Telas

**A. Hoje** (tela inicial)
```
┌───────────────────────────────┐
│ Hoje, sex 02 out              │
│                               │
│  R$ 1.240      3 clientes     │
│  vencem hoje   em atraso      │
│                               │
│ ▌Maria Souza        R$ 80,00  │  ← faixa âmbar
│  vence hoje                   │
│ ▌João Lima         R$ 150,00  │  ← faixa vermelha
│  atrasada 7 dias              │
│ ▌...                          │
│                               │
│ [ Ver todas as atrasadas ]    │
└───────────────────────────────┘
```
- Só 2 números no topo. Lista ordenada: atrasadas mais antigas primeiro, depois vence hoje.
- Tocar na linha abre **Cobrança** (tela D).
- Estado vazio: "Nada vence hoje. Bom dia!" + botão "Nova compra".

**B. Clientes**
- Campo de busca no topo (nome ou telefone), foco automático.
- Lista: nome, telefone, saldo devedor à direita. Faixa vermelha se bloqueado ("Bloqueado").
- Botão fixo "Novo cliente".

**C. Cliente (detalhe)**
- Topo: nome, telefone, **saldo devedor** e **limite disponível** (2 números).
- Botões: "Nova compra" e "Receber pagamento".
- Abaixo, abas simples: **Em aberto** · **Histórico**.
- Menu "…" : editar, bloquear/desbloquear, inativar.

**D. Cobrança** (a partir de uma parcela atrasada)
- Mostra: valor original, dias de atraso, multa, juros, **total atualizado** (só esses).
- Caixa de texto com a mensagem pronta (editável antes de copiar).
- Botões: **Copiar mensagem** (principal) e **Abrir no WhatsApp** (secundário, `wa.me`).
- Ao copiar/abrir, pergunta uma vez: "Registrar que cobrou?" → grava em `cobrancas`.

**E. Nova compra** (fluxo em 3 passos, um por vez)
1. Escolher cliente (busca). Mostra limite disponível.
2. Valor e descrição, número de parcelas, data da 1ª parcela. Mostra a **prévia das parcelas** em lista curta.
3. Confirmar. Se estourar limite ou cliente bloqueado: mensagem clara e botão "Autorizar mesmo assim" (só dono, registra na auditoria).

**F. Receber pagamento**
1. Cliente → lista das parcelas em aberto (mais antiga primeiro, já marcada).
2. Valor recebido e forma (dinheiro, Pix, cartão).
3. Confirmar → mostra **recibo** em texto com botão "Copiar recibo".

**G. Ajustes** (painel de configuração, só dono)
Uma tela com 6 campos e "Salvar alterações":
1. Juros de atraso ao mês (%)
2. Multa por atraso (%)
3. Dias de carência
4. Limite de crédito padrão (R$)
5. Bloquear automaticamente (liga/desliga)
6. Bloquear após quantos dias de atraso

Abaixo, link "Modelos de mensagem" (tela com 3 modelos editáveis e a lista de campos permitidos).
Aviso fixo: "Mudanças valem para compras novas. Compras antigas mantêm as regras do dia."

### 3.6 Textos da interface
- Verbos claros: "Salvar alterações", "Registrar pagamento", "Copiar mensagem".
- Mesmo nome em todo o fluxo ("Registrar pagamento" → "Pagamento registrado").
- Erros dizem o que houve e o que fazer: "Esta compra passa do limite (faltam R$ 50,00). Reduza o valor ou autorize."
- Sem emojis nas telas. Sem mensagens de desculpa.

---

## 4. Modelo de dados (PostgreSQL / Supabase)

Convenções: `id uuid default gen_random_uuid()`, `criado_em timestamptz default now()`, nomes em português sem acento, valores em centavos (`bigint`), taxas em bps (`integer`).

```sql
-- 4.1 Perfis (quem pode usar o sistema)
create table perfis (
  id uuid primary key references auth.users(id) on delete restrict,
  nome text not null,
  papel text not null check (papel in ('dono','atendente')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- 4.2 Configurações (1 linha)
create table configuracoes (
  id smallint primary key default 1 check (id = 1),
  juros_mensal_bps integer not null default 100,      -- 1,00% ao mês
  multa_bps integer not null default 200,             -- 2,00% única
  carencia_dias integer not null default 0,
  limite_padrao_centavos bigint not null default 30000,
  bloqueio_auto boolean not null default true,
  bloqueio_dias_atraso integer not null default 30,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references perfis(id)
);
insert into configuracoes default values;

-- 4.3 Clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,                                       -- só dígitos, com DDD
  observacoes text,
  limite_centavos bigint,                              -- null = usa o padrão
  bloqueado boolean not null default false,
  motivo_bloqueio text,
  bloqueado_em timestamptz,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid references perfis(id)
);
create index on clientes using gin (to_tsvector('portuguese', nome));
create index on clientes (telefone);

-- 4.4 Compras (com snapshot das regras)
create table compras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  data_compra date not null default current_date,
  valor_total_centavos bigint not null check (valor_total_centavos > 0),
  descricao text,
  qtd_parcelas integer not null check (qtd_parcelas between 1 and 24),
  -- snapshot das regras do dia
  juros_mensal_bps integer not null,
  multa_bps integer not null,
  carencia_dias integer not null,
  status text not null default 'ativa' check (status in ('ativa','cancelada')),
  autorizada_excecao boolean not null default false,   -- passou do limite com autorização
  criado_em timestamptz not null default now(),
  criado_por uuid references perfis(id)
);
create index on compras (cliente_id);

-- 4.5 Parcelas
create table parcelas (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references compras(id),
  cliente_id uuid not null references clientes(id),    -- redundante de propósito (consultas rápidas)
  numero integer not null,
  valor_centavos bigint not null check (valor_centavos > 0),
  vencimento date not null,
  status text not null default 'aberta' check (status in ('aberta','paga','cancelada')),
  unique (compra_id, numero)
);
create index on parcelas (vencimento) where status = 'aberta';
create index on parcelas (cliente_id) where status = 'aberta';

-- 4.6 Pagamentos (aceita pagamento parcial)
create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references parcelas(id),
  cliente_id uuid not null references clientes(id),
  data_pagamento date not null default current_date,
  principal_centavos bigint not null check (principal_centavos >= 0),
  encargos_centavos bigint not null default 0 check (encargos_centavos >= 0),  -- multa + juros pagos
  forma text not null check (forma in ('dinheiro','pix','cartao','outro')),
  estornado boolean not null default false,
  estornado_em timestamptz,
  criado_em timestamptz not null default now(),
  criado_por uuid references perfis(id),
  check (principal_centavos + encargos_centavos > 0)
);
create index on pagamentos (parcela_id);

-- 4.7 Cobranças enviadas
create table cobrancas (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references parcelas(id),
  cliente_id uuid not null references clientes(id),
  modelo text not null,                                -- lembrete | cobranca | aviso_bloqueio
  canal text not null default 'whatsapp',
  texto text not null,
  enviada_em timestamptz not null default now(),
  criado_por uuid references perfis(id)
);
create index on cobrancas (parcela_id, enviada_em desc);

-- 4.8 Modelos de mensagem
create table modelos_mensagem (
  codigo text primary key check (codigo in ('lembrete','cobranca','aviso_bloqueio')),
  dias_min integer not null,       -- faixa de atraso em que o modelo é sugerido
  dias_max integer,                -- null = sem limite
  texto text not null
);

-- 4.9 Auditoria
create table auditoria (
  id bigserial primary key,
  quando timestamptz not null default now(),
  usuario_id uuid references perfis(id),
  acao text not null,              -- ex.: 'cliente.bloqueado', 'compra.excecao', 'pagamento.estornado'
  entidade text not null,
  entidade_id uuid,
  detalhes jsonb
);
```

### 4.10 Views de leitura

```sql
-- Parcela com saldo e atraso (encargos são calculados no app via calculos.ts,
-- a view entrega só os insumos)
create view vw_parcelas_abertas as
select
  p.id as parcela_id, p.compra_id, p.cliente_id, p.numero, p.valor_centavos, p.vencimento,
  c.juros_mensal_bps, c.multa_bps, c.carencia_dias,
  coalesce(sum(pg.principal_centavos) filter (where not pg.estornado), 0) as principal_pago_centavos,
  p.valor_centavos - coalesce(sum(pg.principal_centavos) filter (where not pg.estornado), 0) as saldo_principal_centavos,
  greatest((current_date - p.vencimento), 0) as dias_atraso
from parcelas p
join compras c on c.id = p.compra_id
left join pagamentos pg on pg.parcela_id = p.id
where p.status = 'aberta' and c.status = 'ativa'
group by p.id, c.id;

-- Saldo devedor de principal por cliente (usado para limite)
create view vw_saldo_cliente as
select cliente_id, sum(saldo_principal_centavos) as saldo_principal_centavos
from vw_parcelas_abertas
group by cliente_id;
```

### 4.11 Funções RPC (transacionais)

Implementar como `security definer` com checagem de papel e `search_path` fixo.

1. `criar_compra(p_cliente uuid, p_valor bigint, p_descricao text, p_parcelas int, p_primeiro_venc date, p_autorizar_excecao boolean default false) returns uuid`
   - Falha se cliente inativo ou `bloqueado` (exceto exceção autorizada por **dono**).
   - Calcula limite efetivo: `coalesce(clientes.limite_centavos, configuracoes.limite_padrao_centavos)`.
   - Falha se `saldo_principal + p_valor > limite` (exceto exceção por dono; marca `autorizada_excecao` e grava auditoria).
   - Copia o snapshot de `configuracoes` para a compra.
   - Divide o valor em parcelas: `base = floor(valor / n)`, **o resto vai na primeira parcela**. Soma das parcelas = valor total, sempre.
   - Vencimentos mensais a partir de `p_primeiro_venc`; se o dia não existir no mês, usa o último dia do mês.
2. `registrar_pagamento(p_parcela uuid, p_principal bigint, p_encargos bigint, p_forma text, p_data date default current_date) returns uuid`
   - Falha se `p_principal > saldo_principal` da parcela.
   - Insere pagamento; se saldo chegou a 0, `parcelas.status = 'paga'`.
   - Se o cliente estava bloqueado **automaticamente** e não há mais parcela vencida além do limite, não desbloqueia sozinho (desbloqueio é ação manual do dono).
3. `estornar_pagamento(p_pagamento uuid, p_motivo text)` — só dono; marca `estornado`, reabre parcela se necessário, grava auditoria.
4. `cancelar_compra(p_compra uuid, p_motivo text)` — só dono; só se não houver pagamento ativo; marca compra e parcelas como canceladas.
5. `bloquear_cliente(p_cliente uuid, p_motivo text)` / `desbloquear_cliente(p_cliente uuid)` — registram auditoria.
6. `rotina_bloqueio_diario()` — bloqueia clientes com parcela aberta cujo `dias_atraso > configuracoes.bloqueio_dias_atraso`, se `bloqueio_auto = true`. Motivo: `'Bloqueio automático: N dias de atraso'`. Agendar com `pg_cron` às 06:00 America/Sao_Paulo (09:00 UTC).

---

## 5. Regras de negócio e cálculo

Fonte única: `src/lib/calculos.ts`. Funções puras, sem acesso a banco.

### 5.1 Encargos de uma parcela (juros simples)
Entradas: `saldoPrincipal`, `diasAtraso`, snapshot `{ jurosMensalBps, multaBps, carenciaDias }`.

```
diasCobraveis = max(diasAtraso - carenciaDias, 0)

se diasCobraveis == 0:
    multa = 0 ; juros = 0
senão:
    multa = round(saldoPrincipal * multaBps / 10000)
    juros = round(saldoPrincipal * jurosMensalBps / 10000 * diasCobraveis / 30)

totalAtualizado = saldoPrincipal + multa + juros
```

- Arredondamento: **meio para cima** (`Math.round` sobre inteiro já em centavos).
- Multa é cobrada **uma vez**, no primeiro dia cobrável.
- Juros são **pro rata por dia** (mês comercial de 30 dias).
- Sempre calculados **na hora de mostrar**. Quando há pagamento, grava-se o que foi pago de principal e de encargos.

> Confirmar com o dono/contador os limites legais de multa e juros para este tipo de venda antes de usar em produção. O sistema não impede valores, mas o painel mostra aviso se multa > 2% ou juros > 1% ao mês (valores de referência do Código de Defesa do Consumidor e da prática comum; validar).

### 5.2 Pagamento parcial
- Cliente paga valor `V` em uma parcela com saldo e encargos calculados.
- Ordem de abatimento dentro do pagamento: **encargos primeiro, depois principal**.
- Se `V < encargos`, tudo vira `encargos_centavos` e o principal não muda.
- Sobra de principal continua em aberto e **segue acumulando juros** sobre o novo saldo.

### 5.3 Limite de crédito
```
limiteEfetivo = cliente.limite ?? configuracoes.limite_padrao
disponivel    = limiteEfetivo - saldoPrincipalAberto
compra permitida se: !bloqueado && valorCompra <= disponivel
```
O limite considera **principal em aberto**, sem encargos.

### 5.4 Bloqueio
- **Manual:** dono bloqueia/desbloqueia a qualquer momento, com motivo.
- **Automático:** rotina diária (4.11 item 6).
- Cliente bloqueado **não consegue** nova compra; pode **receber pagamento** normalmente.
- Aviso na tela "Cobrança" quando faltam ≤ 5 dias para o bloqueio automático.

### 5.5 Mensagens de cobrança
Escolha do modelo pelo atraso (`dias_min`/`dias_max`, editáveis):
| Modelo | Atraso padrão |
|---|---|
| `lembrete` | 0 a 3 dias |
| `cobranca` | 4 a 15 dias |
| `aviso_bloqueio` | 16 dias em diante |

Campos permitidos nos textos: `{nome}`, `{valor}`, `{vencimento}`, `{dias_atraso}`, `{total_atualizado}`, `{loja}`.
Valores em reais formatados (`R$ 1.234,56`), datas `dd/mm`.

Texto padrão do `cobranca`:
> Olá, {nome}! Tudo bem? Aqui é da {loja}. Passando para lembrar da parcela de {valor} que venceu em {vencimento} ({dias_atraso} dias de atraso). Com juros e multa, o valor atualizado é {total_atualizado}. Pode me confirmar quando conseguir pagar? Obrigado!

- O sistema **nunca envia sozinho**. Dono copia ou abre `wa.me/55{telefone}?text={texto codificado}`.
- Impedir duas cobranças da mesma parcela no mesmo dia sem aviso ("Você já cobrou hoje às 09:12. Cobrar de novo?").

### 5.6 Recibo (texto)
> Recibo — {loja}
> Cliente: {nome}
> Pago em {data}: {valor} ({forma})
> Saldo restante: {saldo}

---

## 6. Segurança e privacidade

1. **Auth:** Supabase Auth com e-mail e senha. Sem cadastro público: contas criadas apenas pelo dono.
2. **RLS em todas as tabelas.** Política base: acesso só se existir `perfis.id = auth.uid()` com `ativo = true`.
   - `configuracoes`: leitura para todos os perfis; escrita só `dono`.
   - Funções de exceção, estorno, cancelamento: só `dono`.
3. **Nunca** usar a `service_role` key no navegador. Ela só existe em variáveis de ambiente do servidor, se necessário.
4. **LGPD:** coletar só nome e telefone. Não guardar CPF nesta versão. Registrar a base legal (execução de contrato/relação de consumo) em `docs/lgpd.md`. Prever exportar e anonimizar um cliente quando ele pedir (`anonimizar_cliente(id)`: troca nome/telefone por "Cliente removido", mantém valores).
5. **Auditoria** das ações sensíveis (bloqueio, exceção de limite, estorno, cancelamento, mudança de configuração).
6. **Validação** com Zod no servidor para toda entrada (telefone só dígitos, valores positivos, parcelas 1–24).
7. **Backup:** confirmar no painel do Supabase que o backup diário está ativo; documentar a restauração em `docs/backup.md`.
8. Cabeçalhos de segurança padrão do Next.js; cookies de sessão `httpOnly`, `secure`.

---

## 7. Estrutura do projeto

```
crediario/
├─ AGENTS.md                      # cópia da seção 0 deste documento
├─ docs/
│  ├─ decisoes.md
│  ├─ lgpd.md
│  └─ backup.md
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_tabelas.sql
│  │  ├─ 0002_views.sql
│  │  ├─ 0003_funcoes_rpc.sql
│  │  ├─ 0004_rls.sql
│  │  ├─ 0005_cron_bloqueio.sql
│  │  └─ 0006_seed_modelos.sql
│  └─ seed.sql                    # dados de teste (clientes e compras fictícios)
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx            # barra inferior
│  │  │  ├─ hoje/page.tsx
│  │  │  ├─ clientes/page.tsx
│  │  │  ├─ clientes/novo/page.tsx
│  │  │  ├─ clientes/[id]/page.tsx
│  │  │  ├─ cobranca/[parcelaId]/page.tsx
│  │  │  ├─ compra/nova/page.tsx
│  │  │  ├─ pagamento/novo/page.tsx
│  │  │  └─ ajustes/
│  │  │     ├─ page.tsx
│  │  │     └─ modelos/page.tsx
│  │  └─ globals.css              # tokens de cor e tipografia (seção 3)
│  ├─ lib/
│  │  ├─ calculos.ts              # regras da seção 5 (puro)
│  │  ├─ calculos.test.ts
│  │  ├─ dinheiro.ts              # formatar centavos <-> "R$ 1.234,56"
│  │  ├─ datas.ts                 # fuso America/Sao_Paulo, soma de meses
│  │  ├─ mensagens.ts             # preenche modelos
│  │  ├─ supabase/{server,client}.ts
│  │  └─ schemas.ts               # Zod
│  ├─ actions/                    # Server Actions chamando as RPCs
│  │  ├─ clientes.ts
│  │  ├─ compras.ts
│  │  ├─ pagamentos.ts
│  │  ├─ cobrancas.ts
│  │  └─ configuracoes.ts
│  └─ components/
│     ├─ LinhaStatus.tsx          # linha de lista com faixa de cor
│     ├─ BarraInferior.tsx
│     ├─ BotaoPrincipal.tsx
│     ├─ CampoDinheiro.tsx
│     └─ CaixaCopiar.tsx
├─ tests/e2e/fluxo-principal.spec.ts
└─ .env.example
```

Variáveis de ambiente (`.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_NOME_LOJA=
```

---

## 8. Contratos das Server Actions

Todas validam com Zod, chamam a RPC correspondente e retornam `{ ok: true, data } | { ok: false, erro: string }` (mensagem pronta para a tela).

| Action | Chama | Entrada |
|---|---|---|
| `criarCliente` | insert em `clientes` | nome, telefone, limite? |
| `editarCliente` | update | id, campos |
| `bloquearCliente` / `desbloquearCliente` | RPC | id, motivo |
| `criarCompra` | `criar_compra` | clienteId, valor, descricao, parcelas, primeiroVenc, autorizar? |
| `registrarPagamento` | `registrar_pagamento` | parcelaId, valorRecebido, forma |
| `estornarPagamento` | `estornar_pagamento` | id, motivo |
| `registrarCobranca` | insert em `cobrancas` | parcelaId, modelo, texto |
| `salvarConfiguracoes` | update `configuracoes` | 6 campos |
| `salvarModelo` | update `modelos_mensagem` | codigo, texto, faixa |

`registrarPagamento` recebe o **valor total recebido** e divide em encargos/principal usando `calculos.ts` (regra 5.2) antes de chamar a RPC.

---

## 9. Casos de teste obrigatórios (`calculos.test.ts`)

1. Parcela em dia: encargos = 0.
2. Atraso dentro da carência: encargos = 0.
3. Atraso de 7 dias, saldo R$ 80,00, multa 2%, juros 1% a.m., carência 0 → multa R$ 1,60; juros `round(8000*100/10000*7/30)` = R$ 0,19; total R$ 81,79.
4. Atraso de 30 dias: juros = exatamente 1% do saldo.
5. Mudança de configuração **não altera** compra antiga (snapshot).
6. Divisão de R$ 100,00 em 3 parcelas → 3334 + 3333 + 3333 centavos, soma = 10000.
7. Vencimento de 31/01 com parcelas mensais → 28/02 (ou 29), 31/03.
8. Pagamento menor que os encargos: principal intacto.
9. Pagamento parcial de principal: saldo restante correto e juros recalculados sobre ele.
10. Compra que estoura limite: bloqueada; com exceção do dono: permitida e auditada.
11. Cliente bloqueado: compra negada, pagamento aceito.
12. Estorno reabre a parcela.

Fluxo e2e (Playwright): login → criar cliente → compra em 3 parcelas → ver em "Hoje" (com data simulada) → gerar cobrança → registrar pagamento parcial → conferir saldo.

---

## 10. Acessibilidade e qualidade

- Contraste mínimo 4.5:1 em texto.
- Alvos de toque ≥ 48px.
- Todo campo com `label` visível; erros ligados ao campo (`aria-describedby`).
- Funciona sem JavaScript pesado: listas renderizadas no servidor.
- PWA instalável (manifest + ícone), para abrir como app no celular.
- Lighthouse mobile: Performance ≥ 90, Acessibilidade ≥ 95.

---

## 11. Observabilidade

- Erros no servidor registrados com contexto (ação, usuário), sem dados pessoais no log.
- Tabela `auditoria` consultável por tela simples no futuro (fase 3).

---

## 12. Dados de exemplo (`supabase/seed.sql`)

Criar 5 clientes fictícios com cenários: em dia, vence hoje, atrasado 7 dias, atrasado 40 dias (bloqueio automático), pagamento parcial. **Nunca** usar dados reais no seed.

---

## 13. Plano de entrega por fases

### Fase 1 — Base (MVP utilizável)
1. Projeto Next.js + Tailwind + tokens de design (seção 3.2–3.4).
2. Migrations 0001–0004 (tabelas, views, RPCs, RLS).
3. Login e perfis (dono/atendente).
4. `calculos.ts` + testes (seção 9) **antes** das telas.
5. Telas: Clientes, Cliente (detalhe), Nova compra, Receber pagamento.
6. Tela **Hoje** com 2 números e lista.
**Pronto quando:** dá para cadastrar cliente, vender a prazo, receber parcial e ver o saldo correto.

### Fase 2 — Regras e cobrança
1. Tela **Ajustes** (6 campos) + aviso de limites legais.
2. Bloqueio manual e automático (migration 0005).
3. Tela **Cobrança** com mensagem pronta, copiar e `wa.me`.
4. Modelos de mensagem editáveis + registro em `cobrancas`.
5. Recibo em texto.
**Pronto quando:** compra antiga mantém a taxa antiga após mudar Ajustes, e cliente atrasado é bloqueado pela rotina.

### Fase 3 — Conforto
1. Renegociação de parcelas atrasadas.
2. Estorno e cancelamento (dono) com auditoria.
3. Tela de auditoria.
4. PWA instalável e backup documentado.

### Fase 4 — Depois
Pontuação de bom pagador, relatório mensal, exportar Excel/PDF, integração com PDV.

---

## 14. Riscos conhecidos e como evitá-los

| Risco | Prevenção |
|---|---|
| Erro de centavos | Inteiros em tudo; testes da seção 9 |
| Taxa mudar e quebrar compras antigas | Snapshot na compra |
| Saldo inconsistente em falha | RPCs transacionais |
| Vazamento de dados | RLS + sem `service_role` no front |
| Cobrar quem já pagou | Envio manual, nunca automático |
| Escopo crescer | Seguir as fases; PDV e estoque ficam fora |

---

## 15. Definição de pronto (geral)

- Testes unitários e e2e passando.
- Nenhuma tabela sem RLS (`select * from pg_tables` + `pg_policies` conferidos).
- Nenhum cálculo de dinheiro fora de `calculos.ts`.
- Telas conferidas em 375px de largura.
- `docs/decisoes.md` atualizado com tudo que foi decidido sem consulta.
