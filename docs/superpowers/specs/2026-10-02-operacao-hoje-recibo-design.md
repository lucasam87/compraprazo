# Operação Hoje e recibo copiável

## Objetivo

Completar o fluxo operacional do Crediário com um resumo diário na página inicial e um recibo reutilizável após o registro de pagamento, sem alterar as regras financeiras existentes.

## Escopo

- A página inicial autenticada exibirá indicadores simples do dia: parcelas vencendo hoje, total previsto e clientes com parcelas em atraso.
- Os dados serão lidos pelo cliente Supabase de servidor, respeitando a sessão atual e as políticas RLS.
- O recebimento continuará sendo feito pela Server Action existente `registrarPagamento`.
- Após sucesso, a Action devolverá ou montará um recibo textual com identificador, valor, forma de pagamento e data.
- A tela exibirá o recibo em área acessível e permitirá copiá-lo com `navigator.clipboard` quando disponível, mantendo alternativa de seleção manual.

## Restrições

- Valores exibidos continuam armazenados como centavos inteiros no domínio.
- Nenhuma regra financeira será criada fora de `src/lib/calculos.ts`.
- Nenhum registro será apagado.
- Nenhum segredo ou `service_role` será enviado ao navegador.

## Erros e estados

- Falhas de consulta exibem estado operacional neutro, sem expor detalhes internos.
- Falha ao copiar não impede a visualização do recibo.
- Pagamentos rejeitados pela Action não exibem recibo de sucesso.

## Verificação

- Testes unitários para a formatação do recibo.
- Lint, suíte unitária completa e build de produção.
- A validação e2e com dados reais do Supabase permanece separada e depende das variáveis locais de ambiente.
