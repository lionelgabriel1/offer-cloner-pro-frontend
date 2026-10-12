# Contrato de integração — v0 (frontend) + Manus (backend)

Este documento separa o que o frontend já chama do que ainda precisa de confirmação/implementação no backend. Não considerar uma funcionalidade integrada só porque existe um botão ou um tipo TypeScript.

## 1. Configuração do frontend

Variáveis usadas pelo frontend:
- `NEXT_PUBLIC_API_BASE_URL`: URL base da API Manus, sem depender de uma rota específica.
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: autenticação Supabase, quando usada.

O cliente envia `Authorization: Bearer <access_token>` nas chamadas autenticadas, excepto no health check. O backend tem de aceitar o token Supabase e validar utilizador/propriedade do recurso. Não colocar chaves secretas no frontend.

## 2. Rotas que o cliente já espera

| Método | Rota | Contrato esperado |
|---|---|---|
| GET | `/health` | `{ "ok": true }` |
| POST | `/api/crawl-jobs` | Entrada actual: `{ "url": "https://..." }`; resposta com `jobId`, `siteId`, `status`, `progress`, `links` |
| GET | `/api/crawl-jobs/:id` | Estado, URL inicial, opções, progresso e timestamps |
| GET | `/api/crawl-jobs/:id/pages?offset=&limit=&status=` | Lista paginada de páginas descobertas/analisadas |
| GET | `/api/crawl-jobs/:id/site-model` | Modelo global do site, erros e limitações |
| GET | `/api/crawl-jobs/:id/pages/:pageKey/page-model` | Modelo da página individual |
| GET | `/api/crawl-jobs/:id/report?format=json\|markdown` | Relatório de páginas, interacções, erros e limitações |
| GET | `/api/crawl-jobs/:id/artifacts?path=...` | Conteúdo binário de screenshot/asset autorizado |
| POST | `/api/crawl-jobs/:id/cancel` | Cancelar job ainda activo |
| POST | `/api/crawl-jobs/:id/resume` | Corpo directo com opções de crawl, por exemplo `{ "maxDepth": 2 }` (não envolver em `options`) |
| POST | `/api/crawl-jobs/:id/editor-project` | Entrada `{ "pageKey": "..." }`; resposta `201` com `project.id` e Page Model persistido |
| GET | `/api/projects/:id/editor` | `{ "project": {...}, "model": PageModel }` |
| PUT | `/api/projects/:id/editor/model` | Entrada `{ "model": PageModel }`; resposta `{ "ok": true, "status": "edited", "model": PageModel }` |

As rotas foram confirmadas no código da API e no OpenAPI. O frontend deve usar um JWT Bearer obtido da sessão Supabase Auth para todas as rotas excepto `/health`; a confirmação local não prova que uma instância Hetzner esteja publicada ou corretamente configurada.

## 2.1 Fluxo crawl → editor

1. Criar e acompanhar o crawl pelas rotas acima.
2. Listar páginas e obter o Page Model da página selecionada.
3. Enviar `POST /api/crawl-jobs/:id/editor-project` com `{ "pageKey": "<pageKey>" }` e o Bearer token.
4. Abrir `/editor/:project.id` usando o identificador devolvido (não usar o `jobId` como `projectId`).
5. Ler o modelo com `GET /api/projects/:id/editor`, guardar com `PUT /api/projects/:id/editor/model` e confirmar a persistência ao reler.

Este caminho passou um E2E local com Chromium numa fixture exclusiva de `localhost`, incluindo gravação e recuperação após reiniciar os adapters SQLite. Ainda não foi executado contra Supabase ou Hetzner.

## 3. Capacidades ainda por fechar

### A. Rastreamento de todo o site — comportamento local confirmado
- Começar pela URL fornecida e seguir links internos elegíveis.
- Normalizar URLs, remover fragmentos, controlar query strings e evitar ciclos/duplicados.
- Definir explicitamente o limite de páginas, profundidade, tempo, bytes e concorrência.
- Guardar por página: URL pedida/final, profundidade, origem do link, status HTTP, estado de análise, links encontrados, assets e limitações.
- Não seguir para outros domínios por defeito. Permitir subdomínios só com regra explícita.
- Aplicar protecção SSRF também a redireccionamentos e DNS/IP resolvidos; bloquear loopback, redes privadas, link-local e endpoints de metadados.
- O endpoint de criação aceita opções documentadas, mas o frontend envia atualmente apenas `{ "url": ... }`; só adicionar controlos depois de definir limites/UX.

### B. Exploração segura de formulários e quizzes — testes locais existentes
- Registar campos, opções, passos, progresso, estados e transições observáveis.
- Usar exclusivamente dados fictícios e marcados como teste.
- Nunca enviar leads reais, criar contas reais, efectuar pagamentos, aceitar contratos ou executar acções irreversíveis.
- Não contornar login, CAPTCHA, paywall nem outros controlos de acesso.
- Reportar estados alcançados e não alcançados, motivo, limites e confiança; não declarar um fluxo completo quando só se viu o primeiro passo.
- O relatório deve distinguir links descobertos de transições efectivamente testadas.

### C. Listagem de projectos e jobs — em falta
O frontend ainda não tem um contrato confirmado para listagem agregada. Definir endpoints paginados, filtrados pelo utilizador autenticado, para projectos e jobs recentes. Não expor recursos de outro utilizador.

### D. Preview e exportação — exportação de projeto em falta
Definir se a exportação é feita pelo backend ou no browser e qual o formato. Se o servidor gerar ficheiros:
- endpoint de criação de exportação e estado do job;
- formatos suportados (por exemplo, ZIP React/Tailwind e/ou HTML/CSS/JS);
- endpoint para descarregar o ficheiro;
- expiração, tamanho máximo, erros e limpeza dos artefactos.
Não apresentar um botão como funcional até existir a rota e o fluxo de erro/sucesso.

### E. Assets
- Informar se os caminhos em `assets` são URLs públicas, paths locais ou paths de artefactos.
- Fornecer um mecanismo autenticado para obter artefactos; não assumir que o browser consegue abrir paths do disco do worker.
- Indicar falhas de download e preservar o URL original para diagnóstico.

## 4. Autenticação, erros e operação
- Definir CORS para os domínios reais do frontend.
- Documentar 400/401/403/404/409/413/422/429/500/503.
- Usar mensagens seguras sem stack traces, tokens ou dados internos.
- Definir rate limits, timeout, limites de payload, cancelamento e idempotência.
- Validar propriedade do recurso em todas as rotas, incluindo leitura de assets e exportações.
- Garantir que o frontend possa distinguir sessão expirada, falta de permissões, recurso inexistente, limite atingido e falha temporária.

## 5. Critérios de integração ponta a ponta

1. Frontend aponta para a URL de API real em `NEXT_PUBLIC_API_BASE_URL`.
2. Health check responde e CORS permite a origem do frontend.
3. Um URL público cria um job e devolve identificadores reais.
4. O frontend acompanha o job até estado terminal e mostra progresso real.
5. O crawler descobre múltiplas páginas internas, respeitando limites e segurança.
6. O relatório lista páginas, assets, interacções testadas, erros e limitações.
7. O editor carrega o Page Model real, altera-o e guarda; ao recarregar, as alterações persistem. Confirmado localmente com adapter SQLite e fixture Chromium.
8. Testes de formulário/quiz usam dados fictícios e não executam conversões reais.
9. Preview/export só são considerados concluídos após abrir/testar o artefacto produzido.
10. Utilizador A não consegue ler, alterar ou descarregar recursos do utilizador B.

## 6. Evidência e bloqueios remotos

Para fechar a integração de produção, ainda falta:
- executar os testes reais de Supabase Auth, PostgreSQL e Storage com credenciais privadas de servidor;
- confirmar a URL HTTPS Hetzner e a allowlist CORS para as origens Vercel/Lovable;
- executar o E2E com autenticação Supabase e provar isolamento entre dois utilizadores;
- definir endpoints de listagem/exportação se forem necessários no produto.

Não colocar tokens, chaves privadas ou credenciais nos exemplos, issues ou documentação.
