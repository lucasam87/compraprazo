# Plano de implementação — Crediário

## Como este arquivo será usado

> Estado de execução: consulte `docs/status-plano.md`. Este arquivo é o roadmap detalhado; marcações históricas não constituem evidência de que uma funcionalidade exista no código atual.

- Cada tarefa será executada somente após autorização.
- Tarefas pendentes ficam marcadas com `[ ]`.
- Tarefas concluídas ficam marcadas com `[x]`.
- Após cada etapa, serão registrados os testes e validações realizados.
- Nenhuma etapa seguinte será iniciada automaticamente sem autorização.

## Etapa 0 — Preparação do projeto

- [x] Criar a estrutura do projeto Next.js com TypeScript.
- [ ] Criar `Dockerfile` para desenvolvimento e produção.
- [ ] Criar `docker-compose.yml` para execução opcional em ambientes compatíveis.
- [ ] Definir Docker como artefato reproduzível de build/execução; o desenvolvimento padrão local usará Node diretamente.
- [ ] Definir o uso do Docker Compose para serviços locais auxiliares, sem duplicar o banco remoto do Supabase.
- [x] Configurar Tailwind CSS.
- [x] Configurar Vitest.
- [x] Configurar Playwright.
- [ ] Configurar a integração inicial com Supabase.
- [x] Criar `.env.example`.
- [ ] Criar `AGENTS.md` com as regras essenciais da especificação.
- [x] Criar `docs/decisoes.md`.
- [x] Criar `docs/lgpd.md`.
- [x] Criar `docs/backup.md`.
- [ ] Registrar decisões não especificadas.

### Validação da Etapa 0

- [x] Executar o lint.
- [x] Executar os testes iniciais.
- [ ] Confirmar que o projeto inicia localmente.
- [ ] Confirmar que o projeto cria a imagem Docker sem erros.
- [ ] Confirmar que o app inicia localmente via Node e responde em uma porta documentada.
- [ ] Validar o Dockerfile em CI ou ambiente com daemon Docker disponível; Docker Desktop não é requisito local.
- [ ] Confirmar que variáveis de ambiente são injetadas sem registrar segredos nos logs.
- [x] Registrar resultado dos testes.

## Status da Etapa 0 — 02/10/2026

- [x] Estrutura Next.js, TypeScript e Tailwind criada.
- [x] Dockerfile, Docker Compose e `.dockerignore` criados.
- [x] Vitest e Playwright configurados.
- [x] `.env.example`, `AGENTS.md` e documentacao inicial criados.
- [x] Integracao inicial do Supabase criada em `src/lib/supabase`.
- [x] Lint executado com sucesso em `C:\Projetos\crediario`.
- [x] Testes iniciais executados com sucesso.
- [ ] Build Docker: aguardando daemon Docker compativel.
- [ ] Inicio local e injecao de ambiente: ainda nao validados.

## Fase 1 — Base do MVP

### Etapa 1 — Fundação visual e UI/UX

- [ ] Criar tokens de cores, tipografia e espaçamento.
- [ ] Configurar Atkinson Hyperlegible Next.
- [ ] Criar layout mobile-first.
- [ ] Criar barra inferior com Hoje, Clientes, Nova compra e Ajustes.
- [ ] Criar componente de botão principal.
- [ ] Criar componente de linha com status.
- [ ] Criar componente de campo de dinheiro.
- [ ] Criar componente de caixa de copiar.
- [ ] Criar estados de carregamento, vazio e erro.
- [ ] Implementar foco visível e acessibilidade básica.
- [ ] Conferir os componentes em largura de 375px.

### Validação da Etapa 1

- [ ] Verificar contraste mínimo de 4.5:1.
- [ ] Verificar alvos de toque mínimos de 48px.
- [ ] Verificar navegação por teclado.
- [ ] Verificar `prefers-reduced-motion`.
- [ ] Registrar decisões visuais.

### Etapa 2 — Banco de dados e segurança

- [ ] Criar tabelas de perfis e configurações.
- [ ] Criar tabelas de clientes, compras, parcelas e pagamentos.
- [ ] Criar tabelas de cobranças, modelos e auditoria.
- [ ] Criar views de parcelas abertas e saldo por cliente.
- [ ] Criar migrations organizadas.
- [ ] Criar RLS em todas as tabelas.
- [ ] Configurar permissões para dono e atendente.
- [ ] Criar seeds com dados fictícios.
- [ ] Criar RPCs transacionais para operações críticas.

### Validação da Etapa 2

- [ ] Confirmar que todas as tabelas possuem RLS.
- [ ] Testar acesso de usuário ativo.
- [ ] Testar bloqueio de acesso de usuário inativo.
- [ ] Testar permissões de dono e atendente.
- [ ] Testar transações de compra e pagamento.

### Etapa 3 — Regras financeiras

- [x] Criar `src/lib/calculos.ts`.
- [x] Implementar valores em centavos inteiros.
- [x] Implementar percentuais em pontos-base.
- [x] Implementar juros simples.
- [ ] Implementar multa e carência.
- [x] Implementar arredondamento meio para cima.
- [x] Implementar pagamento parcial.
- [x] Implementar abatimento de encargos antes do principal.
- [ ] Implementar divisão de parcelas.
- [x] Implementar vencimentos mensais.
- [ ] Implementar limite de crédito.
- [ ] Criar testes unitários obrigatórios.

### Validação da Etapa 3

- [x] Testar parcela em dia.
- [ ] Testar carência.
- [x] Testar atraso de 7 dias.
- [ ] Testar atraso de 30 dias.
- [ ] Testar snapshot de configuração.
- [ ] Testar divisão com resto na primeira parcela.
- [ ] Testar vencimento no fim do mês.
- [x] Testar pagamento menor que os encargos.
- [x] Testar pagamento parcial do principal.
- [ ] Testar limite e exceção autorizada.
- [ ] Testar cliente bloqueado.
- [ ] Testar estorno.

### Etapa 4 — Autenticação

- [ ] Criar tela de login.
- [ ] Configurar autenticação por e-mail e senha.
- [ ] Restringir criação de contas ao dono.
- [ ] Proteger rotas autenticadas.
- [ ] Validar perfil ativo e papel do usuário.

### Validação da Etapa 4

- [ ] Testar login válido.
- [ ] Testar login inválido.
- [ ] Testar sessão expirada.
- [ ] Testar usuário inativo.

### Etapa 5 — Clientes

- [ ] Criar lista de clientes.
- [ ] Criar busca por nome ou telefone.
- [ ] Criar cadastro de cliente.
- [ ] Criar edição de cliente.
- [ ] Criar inativação sem apagar registros.
- [ ] Criar tela de detalhes do cliente.
- [ ] Exibir saldo devedor e limite disponível.

### Validação da Etapa 5

- [ ] Testar cadastro.
- [ ] Testar edição.
- [ ] Testar busca.
- [ ] Testar inativação.
- [ ] Testar cálculo do saldo exibido.

### Etapa 6 — Compras

- [ ] Criar fluxo de nova compra em três passos.
- [ ] Criar seleção e busca de cliente.
- [ ] Exibir limite disponível.
- [ ] Criar entrada de valor e descrição.
- [ ] Criar seleção de quantidade de parcelas.
- [ ] Criar prévia das parcelas.
- [ ] Criar confirmação da compra.
- [ ] Bloquear cliente impedido.
- [ ] Bloquear compra acima do limite.
- [ ] Criar exceção somente para dono.
- [ ] Registrar exceção na auditoria.

### Validação da Etapa 6

- [ ] Testar compra normal.
- [ ] Testar cliente bloqueado.
- [ ] Testar limite excedido.
- [ ] Testar exceção autorizada.
- [ ] Confirmar soma exata das parcelas.

### Etapa 7 — Pagamentos

- [ ] Criar fluxo de recebimento.
- [ ] Listar parcelas abertas por ordem de vencimento.
- [ ] Aceitar pagamentos parciais.
- [ ] Permitir dinheiro, Pix, cartão e outro.
- [ ] Atualizar status da parcela.
- [ ] Exibir saldo restante.
- [ ] Gerar recibo copiável.

### Validação da Etapa 7

- [ ] Testar pagamento integral.
- [ ] Testar pagamento parcial.
- [ ] Testar pagamento de cliente bloqueado.
- [ ] Testar mudança para parcela paga.
- [ ] Testar recibo.

### Etapa 8 — Tela Hoje

- [ ] Exibir vencimentos do dia.
- [ ] Exibir clientes em atraso.
- [ ] Exibir no máximo dois números principais.
- [ ] Ordenar atrasos mais antigos primeiro.
- [ ] Criar estado vazio.
- [ ] Abrir tela de cobrança a partir de uma parcela.

### Validação da Etapa 8

- [ ] Testar vencimentos do dia.
- [ ] Testar ordenação de atrasos.
- [ ] Testar estado vazio.
- [ ] Testar abertura da cobrança.

### Gate da Fase 1

- [ ] Executar testes unitários.
- [ ] Executar fluxo e2e principal.
- [ ] Conferir as telas em 375px.
- [ ] Conferir acessibilidade básica.
- [ ] Confirmar que é possível cadastrar cliente, vender a prazo, receber pagamento parcial e ver o saldo correto.

## Fase 2 — Regras e cobrança

### Etapa 9 — Ajustes e bloqueios

- [ ] Criar tela Ajustes.
- [ ] Editar juros, multa, carência e limite padrão.
- [ ] Configurar bloqueio automático.
- [ ] Exibir aviso sobre limites legais.
- [ ] Criar bloqueio manual.
- [ ] Criar desbloqueio manual.
- [ ] Criar rotina automática de bloqueio.
- [ ] Configurar `pg_cron`.
- [ ] Confirmar que compras antigas preservam o snapshot das regras.

### Etapa 10 — Cobranças

- [ ] Criar tela de cobrança.
- [ ] Calcular encargos no momento da leitura.
- [ ] Criar modelos de mensagem.
- [ ] Permitir edição da mensagem.
- [ ] Permitir copiar a mensagem.
- [ ] Criar abertura pelo `wa.me`.
- [ ] Registrar cobrança manual.
- [ ] Alertar sobre cobrança repetida no mesmo dia.
- [ ] Criar recibo em texto.

### Validação da Fase 2

- [ ] Testar mudança de configuração.
- [ ] Testar bloqueio automático.
- [ ] Testar cobrança e mensagem.
- [ ] Testar registro de cobrança.
- [ ] Testar recibo.

## Fase 3 — Conforto e administração

- [ ] Criar renegociação de parcelas atrasadas.
- [ ] Criar estorno de pagamento.
- [ ] Criar cancelamento de compra.
- [ ] Registrar auditoria das ações sensíveis.
- [ ] Criar tela de auditoria.
- [ ] Tornar o sistema instalável como PWA.
- [ ] Documentar backup e restauração.
- [ ] Melhorar observabilidade sem registrar dados pessoais nos logs.

## Fase 4 — Futuro

- [ ] Pontuação de bom pagador.
- [ ] Relatório mensal.
- [ ] Exportação Excel/PDF.
- [ ] Integração com PDV.
- [ ] Controle de estoque.
- [ ] Emissão de nota fiscal.
- [ ] Pagamentos online.
- [ ] Envio automático de mensagens.

## Definição de pronto geral

- [ ] Testes unitários passando.
- [ ] Testes e2e passando.
- [ ] Todas as tabelas com RLS conferido.
- [ ] Nenhum cálculo de dinheiro fora de `calculos.ts`.
- [ ] Telas conferidas em 375px.
- [ ] `docs/decisoes.md` atualizado.
- [ ] Documentação de LGPD criada.
- [ ] Documentação de backup criada.
