# Backup e restauração

Antes de produção, confirmar no painel do Supabase que o backup diário está ativo e registrar o procedimento de restauração específico do plano contratado.

Credenciais privilegiadas (como `service_role` e secret keys) não devem constar em arquivos versionados, arquivos `.env.example` ou código de navegador. Caso uma delas seja exposta, revogue/rotacione-a no painel do Supabase, remova-a do histórico quando aplicável e atualize apenas o ambiente de servidor que realmente a utiliza.
