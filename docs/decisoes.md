# Decisões técnicas

## 2026-10-02 — Ambiente local

- O desenvolvimento local usa Node/npm diretamente.
- Dockerfile e Docker Compose existem para builds e ambientes compatíveis, mas Docker Desktop não é requisito.
- O banco principal será Supabase remoto; nenhum banco local é criado pelo Compose nesta etapa.
