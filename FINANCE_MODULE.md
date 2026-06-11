# Модуль «Финансы / Бухгалтерия»

Управленческий финансовый модуль для POS. Не заменяет 1С — показывает владельцу: сколько пришло, ушло, осталось, где лежат деньги.

## Архитектура

```
┌──────────────┐     JWT      ┌──────────────┐   proxy    ┌─────────────────┐
│ web-frontend │ ──────────► │ web-backend  │ ────────► │ finance-service │
│  /finance/*  │             │  :8080       │  internal │  :8082          │
└──────────────┘             └──────┬───────┘           └────────┬────────┘
                                    │                            │
                                    ▼                            ▼
                              ┌──────────┐              ┌──────────────┐
                              │  pos_db  │              │  finance_db  │
                              │  :5433   │              │  :5434       │
                              └──────────┘              └──────────────┘
```

- **finance-service** — отдельный Spring Boot микросервис, своя PostgreSQL (`finance_db`)
- **web-backend** — основной POS + **интеграционный слой** к finance-service
- Основная POS-база **не затрагивается** финансовыми миграциями (кроме таблицы outbox — см. ниже)

## Как это связано с микросервисами

Это **не один монолит**, а связка **монолит POS + микросервис финансов**:

| Компонент | Роль | База | Порт |
|-----------|------|------|------|
| `web-backend` | Касса, склад, продажи, **шлюз** к finance | `pos_db` | 8080 |
| `finance-service` | Бухгалтерия: счета, приходы, расходы, отчёты | `finance_db` | 8082 |

Микросервис **не читает** `pos_db` и **не знает** про `sales` / `stock_receipts`.  
Связь только через **HTTP internal API** (ключ `X-Internal-Api-Key`).

### Два канала общения

**1. UI → finance (синхронный proxy)**  
Фронт вызывает `/api/v1/finance/*` → `web-backend` (`FinanceGatewayController`) → `finance-service`.  
JWT и `company_id` пробрасываются в заголовках.

**2. POS-события → finance (асинхронная интеграция)**  
Продажа / закуп / возврат происходят в `web-backend`. После commit в `pos_db`:

```
SaleCheckoutServiceImpl
        │
        ▼
FinanceIntegrationPublisher  ──►  finance_sync_outbox (pos_db)
        │                              │
        │ afterCommit                  │ retry каждые 30 сек
        ▼                              ▼
FinanceHttpClient  ──HTTP──►  finance-service
                              POST /internal/finance/incomes/from-sale
                              POST /internal/finance/expenses/from-purchase
                              POST /internal/finance/expenses/from-refund
                                        │
                                        ▼
                                   incomes / expenses (finance_db)
```

### Почему outbox в `web-backend`, а не в микросервисе

- События **рождаются** в POS (продажа, приход, возврат) — в той же транзакции, что и `sales`.
- Паттерн **Transactional Outbox**: сначала сохраняем событие в `pos_db`, потом шлём в микросервис. Если finance упал — retry, данные не теряются.
- `finance-service` остаётся **изолированным**: только принимает готовый payload и пишет в свою БД.

### Что где лежит в коде

| Слой | Путь |
|------|------|
| Микросервис | `finance-service/` — entity, API, internal controllers |
| Шлюз UI | `web-backend/.../FinanceGatewayController.java` |
| Интеграция POS → finance | `web-backend/.../service/finance/` |
| Outbox | `web-backend/.../entity/FinanceSyncOutbox.java` |
| Retry | `web-backend/.../FinanceSyncRetryScheduler.java` |

### Docker

```yaml
# docker-compose.yml / docker-compose.prod.yml
finance-db        → finance_db
finance-service   → микросервис
backend           → FINANCE_SERVICE_URL=http://finance-service:8082/api/v1
```

## Что уже было в проекте (до модуля)

| Есть | Нет |
|------|-----|
| Продажи, оплата (нал/карта/смешанная) | Полноценный бухучёт |
| Смены кассира, Z-отчёты | Счета доходов/расходов (GL) |
| Журнал чеков, возвраты | Банковские счета как сущность |
| Себестоимость товара, маржа в отчётах | Зарплата, долги клиентов/поставщиков |
| Складской приход (stock_receipts) | Cash Flow, переводы между счетами |

## MVP — этап 1 (реализовано)

- [x] Финансовые счета (`FinancialAccount`) — создаются автоматически при первой операции (касса/терминал); банк добавляется вручную. Пустые счета по умолчанию **не** создаются
- [x] Приходы / расходы
- [x] Категории доходов и расходов (системные + пользовательские)
- [x] Финансовый дашборд
- [x] Отчёт прибыль/убыток
- [x] Интеграция продаж → автоматический приход (cash + card split), в т.ч. offline sync с кассы
- [x] Интеграция закупов (приход на склад) → автоматический расход «Закуп товара»
- [x] Интеграция возвратов (частичный / полный) → расход «Возврат клиенту»
- [x] Outbox + retry: события не теряются при недоступности finance-service
- [x] Backfill: `POST /api/v1/admin/finance-sync/backfill?from=&to=&types=sales,purchases`
- [x] Расширенный дашборд: продажи с кассы, закупы, график 7 дней, последние операции
- [x] Отдельная БД + docker-compose
- [x] Frontend: раздел «Финансы» в меню

## Этап 2 (реализовано — MVP)

- [x] Долги клиентов: продажа `CREDIT` с клиентом → receivable ledger; погашение → приход
- [x] Касса: выбор/создание покупателя при `CREDIT` (`GET/POST /customers`, `customerId` в чеке)
- [x] Долги поставщикам: приход `paymentType=CREDIT` → payable ledger; погашение → расход
- [x] Зарплата: расход с категорией «Зарплата» + привязка сотрудника (`SALARY`)
- [x] Авансы покупателя (`ADVANCE`) — предоплата на баланс клиента, приход + ledger; касса: клиент → оплата

## Этап 3 (реализовано — MVP)

- [x] Переводы между счетами (`POST /finance/transfers`)
- [x] Cash Flow (`GET /finance/reports/cash-flow`)
- [x] Журнал финансов (`GET /finance/audit/logs`)
- [x] Экспорт Excel (P&L, Cash Flow, audit)

## API

Через основной backend (рекомендуется для фронта):

| Метод | Путь |
|-------|------|
| GET | `/api/v1/finance/dashboard` |
| GET/POST | `/api/v1/finance/incomes` |
| GET/POST/PUT/DELETE | `/api/v1/finance/expenses` |
| GET/POST/PUT | `/api/v1/finance/accounts` |
| GET | `/api/v1/finance/reports/profit-loss` |
| GET | `/api/v1/finance/reports/cash-flow` |
| GET | `/api/v1/finance/reports/*/export` (Excel) |
| GET/POST | `/api/v1/finance/transfers` |
| GET | `/api/v1/finance/audit/logs` |
| GET/POST/PATCH | `/api/v1/finance/categories/*` |

Internal (только backend → finance-service):

| POST | `/api/v1/internal/finance/incomes/from-sale` |
| POST | `/api/v1/internal/finance/expenses/from-purchase` |
| POST | `/api/v1/internal/finance/expenses/from-refund` |
| POST | `/api/v1/internal/finance/receivables/from-credit-sale` |
| POST | `/api/v1/internal/finance/payables/from-credit-purchase` |
| POST | `/api/v1/internal/finance/advances/from-advance-sale` |

Публичные API долгов (через gateway):

| GET/POST | `/api/v1/finance/debts/customers`, `/pay` |
| GET/POST | `/api/v1/finance/debts/suppliers`, `/pay` |
| GET/POST | `/api/v1/finance/advances/customers`, `/apply` |

Backfill и outbox (только ADMIN, web-backend):

| POST | `/api/v1/admin/finance-sync/backfill?from=YYYY-MM-DD&to=YYYY-MM-DD&types=sales,purchases` |
| GET | `/api/v1/admin/finance-sync/outbox?status=PENDING&page=0&size=20` |
| POST | `/api/v1/admin/finance-sync/outbox/{id}/retry` |
| POST | `/api/v1/admin/finance-sync/retry-pending` |

UI: `/finance/sync` (только ADMIN).

Дашборд поддерживает фильтр периода: `GET /api/v1/finance/dashboard?from=&to=` (до 93 дней).

## 502 Bad Gateway на `/api/v1/finance/*`

1. Убедитесь, что **finance-service запущен**: `docker compose ps` → `finance-service` healthy, порт **8082**
2. Не запускайте backend локально через Maven, если finance только в Docker — в `application.yml` по умолчанию `http://localhost:8082/api/v1`
3. После изменений: `docker compose up backend finance-service frontend --build -d`
4. Если 502 остаётся — откройте ответ в Network (теперь проксируется реальный статус finance, не всегда 502)

## Запуск локально

**Рекомендуемый способ — только Docker.** Finance-service слушает порт **8082** (8081 зарезервирован под основной POS-сервер в installer/desktop-cashier). Не запускайте `mvn spring-boot:run` и Docker одновременно на одном порту.

```bash
# из корня проекта
docker compose up finance-db finance-service -d

# статус и логи
docker compose ps finance-service
docker compose logs -f finance-service

# после изменений в коде finance-service
docker compose up finance-service --build -d

# остановить
docker compose stop finance-service
```

Проверка: Swagger — http://localhost:8082/api/v1/swagger-ui.html

`mvn spring-boot:run` в `finance-service/` — **только если** Docker-контейнер остановлен (`docker compose stop finance-service`).

Сборка JAR без запуска:

```bash
cd finance-service && mvn -q -DskipTests package
cd web-backend && mvn -q -DskipTests package
```

Переменные:

| Переменная | По умолчанию |
|------------|--------------|
| `FINANCE_DB_URL` | `jdbc:postgresql://localhost:5434/finance_db` |
| `FINANCE_SERVER_PORT` | `8082` |
| `FINANCE_SERVICE_URL` | `http://localhost:8082/api/v1` |
| `FINANCE_INTERNAL_API_KEY` | `finance-internal-dev-key-change-in-prod` |
| `JWT_SECRET` | общий с web-backend |

## Счета по умолчанию

При первом обращении компании к финансам создаются:

- **Касса (наличные)** — CASH
- **Терминал (карта)** — CARD

Банковский счёт **не создаётся автоматически** — клиент добавляет через «Кассы и счета → Добавить счёт» (тип BANK, CLICK, PAYME, UZUM и т.д.).

## Права

Модули в `AdminModule` / `moduleHandbook.js`:

- `financeDashboard`, `financeIncomes`, `financeExpenses`, `financeAccounts`, `financeReports` — ADMIN, MANAGER
- `financeCategories` — только ADMIN

Удаление расходов — только роль ADMIN (FINANCE_ADMIN в ТЗ).

## Структура кода

```
finance-service/          # микросервис
web-backend/
  controller/FinanceGatewayController.java
  service/finance/        # интеграция с продажами
web-frontend/src/features/finance/
```
