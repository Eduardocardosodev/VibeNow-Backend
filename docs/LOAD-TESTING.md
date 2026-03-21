# Teste de carga e métricas — VibeNow Backend

Objetivo: **medir baseline** antes das otimizações de performance, **repetir** após mudanças e **comparar** números.

---

## 1. Métricas no backend (Prometheus)

### Endpoints

| Rota | Auth | Descrição |
|------|------|-----------|
| `GET /health` | Não | Liveness (não bate no banco). |
| `GET /metrics` | Não | Texto no formato **Prometheus** (histogramas, Node.js default metrics). |

### O que é exposto (principais)

- **`http_request_duration_seconds`** — histograma por `method`, `route` (paths com `:id` para não explodir cardinalidade), `status_code`.
- **`http_requests_in_flight`** — requisições em processamento.
- **`nodejs_*`** — CPU, memória, event loop lag (via `collectDefaultMetrics`).

### Ver localmente

```bash
npm run start:dev
curl -s http://127.0.0.1:3004/health | jq
curl -s http://127.0.0.1:3004/metrics | head -80
```

### Segurança em produção

- **Não** exponha `/metrics` na internet sem proteção (VPN, IP allowlist, ou autenticação).
- Opcional futuro: variável `METRICS_ENABLED=false` para desligar o controller em prod.

---

## 2. Instalar k6

- macOS: `brew install k6`
- Outros: https://k6.io/docs/get-started/installation/

---

## 3. Rodar o teste baseline

1. Suba o backend e o Postgres (seed opcional para ter dados).
2. Na raiz do projeto `backend/`:

```bash
k6 run load-tests/baseline.js
```

Variáveis úteis:

| Variável | Exemplo | Efeito |
|----------|---------|--------|
| `BASE_URL` | `http://127.0.0.1:3004` | URL da API |
| `K6_VUS` | `50` | Usuários virtuais simultâneos |
| `K6_DURATION` | `3m` | Duração do cenário `steady` |
| `K6_ACCESS_TOKEN` | JWT | Pula criação de usuário no `setup` |
| `K6_SKIP_AUTH` | `1` | Só bate em `/health` e `/metrics` (sem rotas protegidas) |
| `K6_PHONE` / `K6_PASSWORD` | Celular BR + senha | Reutiliza usuário existente (evita `POST /users` no setup) |

O `setup` gera celular **`+55119` + 8 dígitos** (formato válido para `IsPhoneNumber('BR')`). Antes estava **9** dígitos após o `9`, o que quebrava a validação e retornava **400**.

Exemplo com export do resumo para arquivo (comparar antes/depois):

```bash
mkdir -p load-tests/results
k6 run --summary-export=load-tests/results/baseline-antes.json load-tests/baseline.js
# ... aplicar otimizações ...
k6 run --summary-export=load-tests/results/baseline-depois.json load-tests/baseline.js
```

O **setup** do script cria um usuário novo (telefone único) e faz login para obter token, a menos que você passe `K6_ACCESS_TOKEN`.

---

## 4. O que comparar (checklist)

### No terminal do k6 (fim do run)

- **`http_req_duration`**: `avg`, `p(90)`, `p(95)`, `max`
- **`http_reqs`**: total de requisições / taxa (req/s)
- **`http_req_failed`**: taxa de falha
- **`iterations`**: quantas vezes o `default` rodou
- **Thresholds**: passou ou falhou

### No `/metrics` (após o teste)

Procure histogramas agregados, por exemplo:

```bash
curl -s http://127.0.0.1:3004/metrics | grep http_request_duration_seconds_bucket
```

Compare **buckets** e **`_sum` / `_count`** entre o run “antes” e “depois” para as mesmas rotas (`GET /events-schedule/upcoming`, `GET /establishments/near`, etc.).

### Tabela manual (copiar para planilha)

| Métrica | Run A (antes) | Run B (depois) | Notas |
|---------|---------------|----------------|-------|
| k6 `http_req_duration` p(95) | | | |
| k6 `http_reqs` / duration → RPS | | | |
| k6 `http_req_failed` % | | | |
| Prometheus p95 estimado (rota X) | | | |

---

## 5. Limitações atuais

- Carga **realista** depende de dados (eventos, estabelecimentos) e de **token** válido.
- Teste local ≠ produção (latência de rede, tamanho do DB, réplicas).
- Para produção: mesmo script apontando para **staging** com limites menores de VUS.

---

## 6. NPM (opcional)

Não adicionamos `k6` como dependência npm (binário externo). Use o CLI `k6` diretamente.

---

*Alinhar com `docs/BACKLOG.md` — após cada item P0 de performance, rodar novo baseline e anexar `summary-*.json`.*
