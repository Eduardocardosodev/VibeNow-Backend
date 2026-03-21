/**
 * Teste de carga baseline — VibeNow API
 *
 * Pré-requisito: k6 instalado (https://k6.io/docs/get-started/installation/)
 *
 * Uso:
 *   k6 run load-tests/baseline.js
 *   BASE_URL=http://localhost:3004 k6 run load-tests/baseline.js
 *   K6_ACCESS_TOKEN=eyJ... k6 run load-tests/baseline.js
 *
 * Com relatório JSON (para comparar runs):
 *   k6 run --summary-export=load-tests/results/summary-$(date +%Y%m%d-%H%M).json load-tests/baseline.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const failRate = new Rate('failed_checks');

export const options = {
  scenarios: {
    /** Carga estável — ajuste VUS e duration conforme sua máquina/ambiente */
    steady: {
      executor: 'constant-vus',
      vus: Number(__ENV.K6_VUS || 30),
      duration: __ENV.K6_DURATION || '2m',
    },
  },
  /** Celular BR em E.164: +55 + DDD(11) + 9 + 8 dígitos (não usar 9 dígitos após o 9). */
  setupTimeout: '60s',
  thresholds: {
    /** Falhas de check customizadas */
    failed_checks: ['rate<0.1'],
    /** k6 built-in: duração HTTP p95 (ajuste após baseline real) */
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.15'],
  },
};

/** +5511 9xxxxxxxx (8 aleatórios após o 9) — válido para @IsPhoneNumber('BR'). */
function randomBrMobileE164() {
  const n = Math.floor(Math.random() * 1e8);
  const eight = String(n).padStart(8, '0');
  return `+55119${eight}`;
}

export function setup() {
  const base = __ENV.BASE_URL || 'http://127.0.0.1:3004';
  let token = __ENV.K6_ACCESS_TOKEN || '';

  if (!token && __ENV.K6_SKIP_AUTH !== '1') {
    const phone =
      __ENV.K6_PHONE && __ENV.K6_PHONE.trim()
        ? __ENV.K6_PHONE.trim()
        : randomBrMobileE164();
    const email = `k6_${Date.now()}@example.com`;
    const password = __ENV.K6_PASSWORD || 'Loadtest1!';

    const reg = http.post(
      `${base}/users`,
      JSON.stringify({
        name: 'K6 Load',
        phone,
        password,
        email,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (reg.status !== 201 && reg.status !== 200) {
      console.error(
        `POST /users falhou: ${reg.status} — body: ${String(reg.body).slice(0, 500)}`,
      );
      console.error(
        'Dica: use K6_ACCESS_TOKEN, ou K6_PHONE+K6_PASSWORD de um usuário existente, ou K6_SKIP_AUTH=1',
      );
    } else {
      const login = http.post(
        `${base}/auth/login`,
        JSON.stringify({ phone, password }),
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (login.status === 200) {
        try {
          token = JSON.parse(login.body).accessToken;
        } catch {
          console.error('Resposta de login inválida');
        }
      } else {
        console.error(
          `POST /auth/login falhou: ${login.status} — ${String(login.body).slice(0, 300)}`,
        );
      }
    }
  }

  return { base, token };
}

export default function (data) {
  const { base, token } = data;
  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  // --- Sem autenticação (sempre) ---
  let res = http.get(`${base}/health`);
  const okHealth = check(res, {
    'health status 200': (r) => r.status === 200,
  });
  if (!okHealth) failRate.add(1);

  res = http.get(`${base}/metrics`);
  check(res, {
    'metrics status 200': (r) => r.status === 200,
    'metrics tem prometheus': (r) =>
      r.body && r.body.includes('http_request_duration_seconds'),
  }) || failRate.add(1);

  // --- Rotas autenticadas (precisam de token do setup) ---
  if (token) {
    const h = { headers: { ...authHeaders } };

    res = http.get(`${base}/events-schedule/upcoming?limit=50`, h);
    check(res, {
      'upcoming 200': (r) => r.status === 200,
    }) || failRate.add(1);

    res = http.get(`${base}/establishments`, h);
    check(res, {
      'establishments 2xx': (r) => r.status >= 200 && r.status < 300,
    }) || failRate.add(1);

    res = http.get(`${base}/establishments/near?lat=-29.92&lng=-51.18&radiusKm=15`, h);
    check(res, {
      'near 2xx': (r) => r.status >= 200 && r.status < 300,
    }) || failRate.add(1);

    const boundsUrl =
      `${base}/establishments/map-bounds?swLat=-29.95&swLng=-51.22&neLat=-29.88&neLng=-51.15&centerLat=-29.9178&centerLng=-51.1836&limit=120`;
    res = http.get(boundsUrl, h);
    check(res, {
      'map-bounds 200': (r) => r.status === 200,
    }) || failRate.add(1);

    res = http.get(`${base}/events-schedule/establishment/1/upcoming`, h);
    check(res, {
      'estab upcoming 2xx': (r) => r.status >= 200 && r.status < 300,
    }) || failRate.add(1);
  }

  sleep(0.3 + Math.random() * 0.4);
}

export function teardown(data) {
  if (data && data.base) {
    console.log(`Finalizado — BASE_URL=${data.base}`);
  }
}
