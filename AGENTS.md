# Regras do projeto Crediário

- Dinheiro é armazenado e calculado em centavos inteiros.
- Percentuais usam pontos-base: 1% = 100 bps.
- Regras financeiras ficam exclusivamente em `src/lib/calculos.ts`.
- Registros nunca são apagados; use status ou inativação.
- Toda tabela com dados de clientes deve ter RLS.
- Nunca exponha a `service_role` do Supabase no navegador.
- Execute lint e testes antes de considerar uma etapa concluída.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
