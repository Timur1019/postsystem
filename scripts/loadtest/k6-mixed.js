/**
 * Базовый нагрузочный сценарий Aurent POS API.
 *
 * Запуск:
 *   k6 run scripts/loadtest/k6-mixed.js \
 *     -e BASE_URL=http://localhost:8080/api/v1 \
 *     -e USERNAME=cashier1 \
 *     -e PASSWORD=secret \
 *     -e COMPANY_CODE=demo
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080/api/v1';
const username = __ENV.USERNAME || 'admin';
const password = __ENV.PASSWORD || 'admin';
const companyCode = __ENV.COMPANY_CODE || '';

export function setup() {
  const loginRes = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({
      username,
      password,
      companyLoginCode: companyCode || undefined,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, { 'login ok': (r) => r.status === 200 });
  const token = loginRes.json('token');
  return { token };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  const health = http.get(`${baseUrl}/actuator/health`);
  check(health, { 'health up': (r) => r.status === 200 });

  const categories = http.get(`${baseUrl}/categories`, { headers });
  check(categories, { 'categories ok': (r) => r.status === 200 });

  const stores = http.get(`${baseUrl}/stores`, { headers });
  check(stores, { 'stores ok': (r) => r.status === 200 });

  const sales = http.get(`${baseUrl}/sales?page=0&size=20`, { headers });
  check(sales, { 'sales list ok': (r) => r.status === 200 });

  sleep(0.3);
}
