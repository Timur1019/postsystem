# Web Backend — Coding Standards

**Для команды.** Обязательные правила при написании и ревью Java-кода.  
Подробная архитектура и roadmap: [ARCHITECTURE.md](./ARCHITECTURE.md).

Стек: Java 17 · Spring Boot 3.2 · PostgreSQL · JPA · MapStruct · Liquibase (цель).

---

## 1. Золотые правила (10)

1. **Один класс — одна ответственность.** Use-case = отдельный Handler; домен = отдельная папка.
2. **Controller не содержит бизнес-логики** — только `@Valid`, вызов сервиса, возврат DTO.
3. **Entity не уходит в API** — только DTO + MapStruct.
4. **Ошибки через `PosException`** — предпочитать `PosExceptions.*`, не сырые `RuntimeException`.
5. **Логи через `LogUtil`** — не `private static final Logger` в сервисах.
6. **Tenant через `TenantAccessSupport`** — не дублировать проверки company/store.
7. **Composition, не наследование** — `@Component` Support, не `extends AbstractXxxService`.
8. **Interface + Impl** для каждого сервиса, публичного наружу.
9. **Файл ≤ 200 строк** (Handler) / **≤ 300 строк** (Service). Больше — split.
10. **Схема БД только через Liquibase** — `db/changelog/`, не `ddl-auto: update`. Новый SQL → changeset в `v2-incremental.xml`.

---

## 2. Структура пакетов

```
com.pos/
├── controller/          # REST, Swagger
├── service/
│   ├── impl/            # Facades (ProductServiceImpl, SaleServiceImpl)
│   └── {domain}/        # product, sale, stock, user, …
│       ├── XxxService.java
│       ├── impl/
│       │   ├── XxxServiceImpl.java
│       │   └── XxxCreateHandler.java   # один сценарий
│       └── support/
│           └── XxxBarcodeValidator.java  # переиспользуемая логика
├── repository/
│   ├── spec/            # JPA Specifications
│   └── {domain}/impl/   # тяжёлый SQL
├── entity/
├── dto/{domain}/
├── mapper/
├── exception/
├── config/
├── security/
├── domain/              # enum (SaleType, ProductType)
└── util/
```

### Куда класть новый код

| Задача | Куда |
|--------|------|
| Новый endpoint | `controller/` + DTO + Service |
| Чтение списка/детали | `{domain}/XxxQueryService` |
| Создание/изменение | `{domain}/impl/XxxCreateHandler` или `XxxUpdateHandler` |
| Общая валидация домена | `{domain}/support/` |
| Проверка tenant | `service/support/TenantAccessSupport` |
| Сложный отчёт SQL | `repository/report/impl/` + `resources/sql/` |
| Миграция БД | `resources/db/changelog/v2-incremental.xml` + SQL в `db/` |

---

## 3. Именование

| Тип | Паттерн | Пример |
|-----|---------|--------|
| Controller | `{Entity}Controller` | `ProductController` |
| Facade | `{Entity}Service` + `{Entity}ServiceImpl` | `ProductService` |
| Query | `{Entity}QueryService` | `ProductQueryService` |
| Command | `{Entity}CommandService` | `ProductCommandService` |
| Handler | `{Entity}{Action}Handler` | `ProductCreateHandler` |
| Support | `{Entity}{Concern}Validator/Loader/Applier` | `ProductBarcodeValidator` |
| Repository | `{Entity}Repository` | `ProductRepository` |
| Spec | `{Entity}Specifications` | `ProductSpecifications` |
| DTO request | `Create{Entity}Request` | `CreateProductRequest` |
| DTO response | `{Entity}Response` | `ProductResponse` |
| Mapper | `{Entity}Mapper` | `ProductMapper` |
| Exception | `{Reason}Exception` extends `PosException` | `BadRequestException` |

---

## 4. Правила по слоям

### 4.1 Controller

```java
// ✅ Правильно
@PostMapping
@Operation(summary = "Создать товар")
@StandardApiResponses
public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest req) {
    return ResponseEntity.ok(productService.createProduct(req));
}

// ❌ Запрещено
public Product create(...) { ... }                    // entity в response
public void create(...) { productRepository.save(...); } // repository в controller
```

- Swagger: `@Tag`, `@Operation`, `@StandardApiResponses` на каждом endpoint.
- `@PreAuthorize` / method security — на уровне controller или service.

### 4.2 Service / Handler

```java
// ✅ Facade — только делегирование (эталон: ProductServiceImpl, SaleServiceImpl)
@Override
@Transactional
public ProductResponse createProduct(CreateProductRequest req) {
    return commandService.createProduct(req);
}

// ✅ Handler — один сценарий
@Service
@RequiredArgsConstructor
public class ProductCreateHandler {
    @Transactional
    public ProductResponse create(CreateProductRequest req) { ... }
}

// ❌ Запрещено
public class XxxServiceImpl extends AbstractXxxSupport { ... }  // fat inheritance
public class GodService { /* create + update + report + email */ }
```

- Constructor injection only (`@RequiredArgsConstructor`).
- `@Transactional(readOnly = true)` на Query; `@Transactional` на write.
- `open-in-view: false` — инициализировать lazy в Support/Loader внутри транзакции.

### 4.3 Support (@Component)

```java
// ✅ Эталоны в проекте
TenantAccessSupport      // tenant, company, store
ProductLookupSupport     // поиск по spec
UserLookupSupport

// ✅ Новый support — одна зона ответственности
@Component
@RequiredArgsConstructor
public class ProductBarcodeValidator {
    public void assertUnique(Integer companyId, String barcode, UUID ignoreId) { ... }
}
```

### 4.4 Repository

- Только интерфейс `extends JpaRepository` — **без бизнес-логики**.
- Фильтры → `Specifications` в `repository/spec/`.
- Тяжёлые отчёты → custom impl + SQL из `resources/sql/`.

### 4.5 DTO

- Java `record` или immutable class.
- Validation: `@NotNull`, `@NotBlank`, `@Valid` на controller.
- Request/Response **раздельно** — не переиспользовать entity fields напрямую.

### 4.6 Mapper

```java
@Mapper(config = PosMapperConfig.class)
public interface ProductMapper { ... }
```

- Всегда `PosMapperConfig` (`unmappedTargetPolicy = ERROR`).
- **Не** создавать `BaseMapper<E,D>`.
- Ручной `@Component` mapper — только если MapStruct не подходит (редко).

### 4.7 Exception

```java
// ✅ Предпочитать
throw PosExceptions.notFound("Product", id);
throw PosExceptions.badRequest("SKU already exists: " + sku);

// ✅ Допустимо
throw new BadRequestException("message", Map.of("field", value));

// ❌ Запрещено
throw new RuntimeException("...");
throw new IllegalArgumentException("...");  // в service layer
```

### 4.8 Logging

```java
// ✅
LogUtil.info(ProductCreateHandler.class, "Product created: id={}", id);
LogUtil.warn(UserServiceImpl.class, "User create failed: {}", message);
LogUtil.error(SomeService.class, "Cache refresh failed", ex);

// ❌
private static final Logger log = ...;
log.info("...");
```

### 4.9 Database

- `ddl-auto: validate` — всегда.
- Новые таблицы/колонки → Liquibase XML в `resources/db/changelog/`.
- Имена changelog: `v{N}-{short-description}.xml`.

---

## 5. Что использовать / что запрещено

| Нужно | ✅ Используй | ❌ Не используй |
|-------|-------------|----------------|
| Публичный API домена | Facade + interface | God service |
| Один сценарий write | Handler | Метод на 200 строк в Impl |
| Общая логика 2+ сервисов | `@Component` Support | `abstract class` Support |
| Алгоритм refresh кэша | `AbstractPosCacheRefreshService` | Свой цикл в сервисе |
| Ошибка клиенту | `PosExceptions` / `PosException` | `RuntimeException` |
| Маппинг | MapStruct + `PosMapperConfig` | Entity в response |
| Tenant | `TenantAccessSupport` | Копипаст `companyId` checks |
| trim / search | `TextUtil` | private `trimOrNull` в каждом сервисе |
| Даты отчётов | `TashkentPeriod.dayRange` | копия `atStartOfDay(ZONE)` |
| save + DB errors | `DbExceptionTranslator.persist` | try/catch вокруг `saveAndFlush` |
| Складские документы | `StockDocumentSupport` | копия requireLines/requireActiveProduct |
| Ошибки в handlers | `PosExceptions.*` | `new BadRequestException(...)` |
| Поиск user/product | `*LookupSupport` | Дублирование Specification |
| SQL отчёты | `resources/sql/` + repository impl | `@Query` на 50 строк в service |
| Тест бизнес-правила | Unit test на Handler/Support | Только manual QA |

---

## 6. Паттерны по ситуации

| Ситуация | Паттерн |
|----------|---------|
| Контроллер вызывает 3+ подсервиса | **Facade** |
| Чтение vs запись разная логика | **CQRS-lite** (Query + Command) |
| Один POST/PUT сценарий | **Handler** |
| Варианты оплаты, импорта | **Strategy** (interface + impl) |
| Прогрев кэша по расписанию | **Template Method** (`AbstractPosCacheRefreshService`) |
| Multi-tenant доступ | **Support** (`TenantAccessSupport`) |

---

## 7. PR Checklist (обязательный)

Скопируй в описание PR:

```
## Backend checklist
- [ ] Controller → DTO in/out, без repository и entity
- [ ] Новый сервис: interface + impl (или Handler)
- [ ] Ошибки: PosExceptions / PosException
- [ ] Write-операции: LogUtil
- [ ] Tenant: TenantAccessSupport (если tenant data)
- [ ] Mapper: MapStruct + PosMapperConfig
- [ ] Файл ≤ 300 строк (или обоснован split)
- [ ] Liquibase changelog (если менялась схема)
- [ ] Тест (если нетривиальное бизнес-правило)
- [ ] Swagger: @Operation на новых endpoints
```

---

## 8. Примеры из проекта

### ✅ Хорошо (копируй стиль)

| Файл | Почему |
|------|--------|
| `ProductServiceImpl` | Facade, только delegate |
| `ProductCreateHandler` / `ProductUpdateHandler` | Один use-case на класс |
| `UserServiceImpl` (~90 строк) | Facade → Create/Update handlers |
| `UserAccessPolicy` / `UserPinService` | Support + выделенный поддомен |
| `ReportServiceImpl` + `report/support/*` | Facade + DbLoader + cache |
| `StockDocumentSupport` | Общие проверки складских документов |
| `SaleServiceImpl` | Facade + payment strategies |
| `TenantAccessSupport` | Support component |
| `PosMapperConfig` | Strict MapStruct |
| `GlobalExceptionHandler` | Единый формат ошибок |
| `PosExceptions` | Фабрика исключений |

### ⚠️ Устаревает (не копируй)

| Файл | Проблема | Куда идём |
|------|----------|-----------|
| `extends AbstractXxxService` (кроме cache) | Наследование вместо composition | `{domain}/support/*` + Handler |
| `new ResourceNotFoundException("...")` | Нет фабрики | `PosExceptions.notFound(...)` |
| `migration_manual_*.sql` | Нет версионирования | Liquibase changelog |

---

## 9. Порядок создания новой фичи

Строго в этом порядке:

1. **DTO** (request + response)
2. **Liquibase** (если нужна схема)
3. **Entity** (если новая таблица)
4. **Repository** (+ Specification при необходимости)
5. **Mapper** (MapStruct)
6. **Support / Handler** (бизнес-логика)
7. **Service interface + impl** (или Facade method)
8. **Controller** + Swagger
9. **Test** (Handler или Support)

---

## 10. Связанные документы

| Документ | Назначение |
|----------|------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитектура, bounded contexts, roadmap PR |
| [application.yml](./src/main/resources/application.yml) | Конфиг prod/dev |
| `deploy/migrations-prod.txt` | Порядок SQL-миграций (до Liquibase) |

---

*Версия: 1.0 · Проект: Aurent POS / postsystem*
