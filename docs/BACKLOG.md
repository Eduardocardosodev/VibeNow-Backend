# Backlog VibeNow — Backend

**Prioridade atual:** **Performance** (picos de uso — fins de semana à noite).

Use este documento como checklist. Reordene datas conforme a sprint; itens **P0** devem vir antes de escalar tráfego.

---

## Legenda de prioridade

| Tag | Significado |
|-----|-------------|
| **P0** | Bloqueador de escala / risco alto de degradar ou derrubar sob carga |
| **P1** | Ganho relevante de performance ou custo; fazer logo após P0 |
| **P2** | Importante para médio prazo (segurança, consistência, DX) |
| **P3** | Melhoria contínua |

---

## P0 — Performance (fazer primeiro)

### T0.1 — Prisma: uma única instância (singleton global) ✅
- [x] Criar `PrismaModule` (`@Global()`) com **um** `PrismaService` (`extends PrismaClient`) + `$connect`/`$disconnect` + `enableShutdownHooks` no `main.ts`.
- [x] Remover `PrismaClient` dos `providers` dos módulos (`user`, `establishment`, `feedback`, `menu`, `quotes`, `events-schedule`).
- [x] Importar `PrismaModule` no `AppModule`; repositórios injetam `PrismaService`.
- **Por quê:** Várias instâncias multiplicam conexões com o Postgres e esgotam `max_connections` sob pico.
- **Critério de pronto:** Uma conexão pool por processo Node; documentar no README.

### T0.2 — AuthGuard: eliminar `findById` em toda requisição autenticada
- [ ] Opção A (rápida): após `jwt.verify`, usar apenas claims confiáveis do access token (`id` / `sub`) e **não** consultar o usuário no banco no guard.
- [ ] Opção B (híbrida): cache Redis/Memory com TTL curto (ex.: 30–60s) para `userId` → existência/versão mínima; invalidar em mudança de senha/perfil.
- [ ] Garantir que operações **críticas** (pagamento, dono de estabelecimento) revalidem onde necessário.
- **Por quê:** Em pico, cada request vira 2+ round-trips; isso domina latência e CPU do DB.
- **Critério de pronto:** Medição antes/depois (p95 de latência em rota autenticada simples).

### T0.3 — `findNear` (estabelecimentos): parar de carregar tabela inteira na memória
- [x] **`GET /establishments/map-bounds`**: filtro por retângulo no SQL + índice `(latitude, longitude)` + limite; app de mapa deve usar este fluxo (ver `docs/EXPO-MAP-BOUNDS.md`).
- [x] **`findNear`**: pré-filtro por bounding box aproximado do círculo antes do Haversine (não carrega mais a tabela inteira).
- [ ] Opcional evolução: **PostGIS** `ST_DWithin` para círculo perfeito e escala global (antimeridiano).
- [ ] Definir limite máximo de resultados (ex.: 100) e índice adequado (`GIST` em geometria ou estratégia equivalente).
- **Por quê:** Crescimento linear de linhas = RAM, CPU e tempo de resposta inaceitáveis.
- **Critério de pronto:** Teste com N estabelecimentos grande (seed ou script); tempo estável.

### T0.4 — Índices no banco alinhados às queries quentes
- [ ] `EventRegistration`: índice em `userId` (ex.: `@@index([userId])`) — lista “minhas inscrições”.
- [ ] `Feedback`: índice em `establishmentId` — listagem por estabelecimento + recálculo de score.
- [ ] `Quote`: índice composto ou em `establishmentId` + `expiresAt` — quotes ativas por estabelecimento.
- [ ] Revisar `scheduled_events`: se `findAllUpcoming` filtra só por `eventStartsAt`, avaliar índice que cubra `WHERE eventStartsAt >= ? ORDER BY eventStartsAt` (já existe composto com `establishmentId`; validar `EXPLAIN` no Postgres).
- **Critério de pronto:** `EXPLAIN ANALYZE` nas 5 queries mais frequentes sem sequential scan indevido.

### T0.5 — Recálculo de score de estabelecimento (feedbacks)
- [ ] Substituir “buscar todos feedbacks + média em JS” por **`AVG(rating)`** (e `COUNT`) em SQL único.
- [ ] Opcional: atualizar score de forma **assíncrona** (fila/Bull) após create/update/delete de feedback para não segurar a resposta HTTP.
- **Por quê:** Estabelecimentos com muitos feedbacks viram gargalo em toda escrita.
- **Critério de pronto:** Tempo de `POST /feedbacks` estável com volume alto de feedbacks por estab.

---

## P1 — Performance (logo após P0)

### T1.1 — Cache para leituras quentes
- [ ] Identificar endpoints mais chamados no pico (ex.: `GET /events-schedule/upcoming`, `GET establishments/near`, detalhe de evento).
- [ ] Introduzir Redis (ou cache em memória com TTL por ambiente) com TTL curto (ex.: 30s–2min) e **invalidação** ao atualizar recurso.
- [ ] Headers `Cache-Control` / ETag onde fizer sentido para clients.
- **Critério de pronto:** Redução mensurável de QPS no Postgres nas rotas cacheadas.

### T1.2 — Paginação e limites máximos
- [ ] `GET /establishments` (e similares): `cursor` ou `page/limit` com **teto** (ex.: max 100).
- [ ] `upcoming` já tem limite; auditar outras listas sem teto.
- **Por quê:** Evita payloads gigantes e picos de memória no Node e no app mobile.

### T1.3 — Pool e tuning do Postgres
- [ ] Documentar `connection_limit` no `DATABASE_URL` do Prisma conforme instância (ex.: serverless vs VM).
- [ ] Alinhar número de **réplicas** da API × conexões por réplica para não estourar o banco.
- [ ] Habilitar **read replica** no futuro para relatórios e listagens pesadas (task de infra).

### T1.4 — Otimizar fluxo de inscrição em evento (opcional)
- [ ] Avaliar transação única ou `INSERT ... ON CONFLICT` para reduzir round-trips mantendo `@@unique([userId, scheduledEventId])`.
- **Prioridade:** menor que T0.x se a métrica de inscrições ainda for baixa.

---

## P2 — Segurança e integridade (não esquecer após performance)

### T2.1 — Ownership / autorização
- [ ] Eventos, cardápio, quotes, estabelecimentos: só **dono** (ou role admin) pode criar/editar/apagar — vincular `User` ↔ `Establishment` ou claims no JWT.
- [ ] `PATCH/DELETE /feedbacks/:id`: apenas autor ou moderador.

### T2.2 — Exposição de usuários
- [ ] Restringir `GET /users` e `GET /users/:id` (admin apenas ou remover listagem aberta).

### T2.3 — Rate limiting
- [ ] Throttle em `POST /auth/login`, `POST /auth/refresh`, `POST /users`.

### T2.4 — CORS e headers
- [ ] Restringir `origin` por ambiente; considerar `helmet`.

---

## P3 — Qualidade e produto

### T3.1 — Contrato da API
- [ ] Alinhar `listMyRegistrations` com o mesmo shape de evento que `GET /events-schedule/:id` (campos de mesa/camarote/preço).
- [ ] Swagger/OpenAPI completo.

### T3.2 — Reservas reais (mesa/camarote)
- [ ] Modelar consumo de `tablesAvailable` / `boothsAvailable` com transações para evitar overbooking.

### T3.3 — Testes e observabilidade
- [ ] Testes de carga mínimos (k6/Artillery) nas rotas P0.
- [ ] Logs estruturados + correlation id; métricas p95/p99 por rota.

---

## Ordem sugerida de execução (sprint única “performance”)

1. **T0.1** → **T0.2** → **T0.4** (rápidos, alto impacto)  
2. **T0.5** → **T0.3** (dependem um pouco mais de SQL/migração)  
3. **T1.1** → **T1.2** → **T1.3**  
4. Depois: **P2** conforme risco de ir a produção com usuários reais.

---

## Referência rápida — impacto esperado

| Task | Impacto principal |
|------|-------------------|
| T0.1 | Menos conexões, mais estabilidade |
| T0.2 | Menos carga no DB, menor latência |
| T0.3 | `near` escalável |
| T0.4 | Leituras indexadas |
| T0.5 | Escrita de feedback escalável |
| T1.1 | Menos leituras repetidas no pico |

---

*Documento gerado para alinhamento de backlog; atualize os checkboxes conforme for concluindo.*

---

## Medição (baseline antes / depois)

Use **`docs/LOAD-TESTING.md`** e o script **`load-tests/baseline.js`**. Após cada mudança relevante de performance, exporte o summary do k6 (`--summary-export`) e guarde em `load-tests/results/` para comparar.
