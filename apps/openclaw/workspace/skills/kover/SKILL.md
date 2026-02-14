# Kover — Управление маршрутами

Скилл для управления маршрутами доставки ковров через PocketBase REST API.

## Конфигурация

- **PB_URL**: `http://pocketbase:8090` (внутри Docker) или `http://localhost:8090`
- **Auth**: Admin-токен PocketBase (получить через `POST /api/admins/auth-with-password`)

### Авторизация

```
POST {PB_URL}/api/admins/auth-with-password
Content-Type: application/json

{"identity": "{PB_ADMIN_EMAIL}", "password": "{PB_ADMIN_PASSWORD}"}
```

Ответ содержит `token`. Все запросы ниже требуют заголовок:
```
Authorization: Bearer {token}
```

---

## Модель данных

### day_routes
Маршрут на день недели.

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | PocketBase ID |
| day | number (0-6) | День недели: 0=ПН, 1=ВТ, 2=СР, 3=ЧТ, 4=ПТ, 5=СБ, 6=ВС |

### route_stops
Остановка в маршруте.

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | PocketBase ID |
| dayRoute | relation | → day_routes |
| client | relation | → clients |
| driver | relation | → drivers (опционально) |
| position | number | Порядок в маршруте (от 0) |
| isCompleted | bool | Выполнена ли остановка |
| skippedUntil | text | Дата пропуска (ISO, опционально) |

### clients
Клиент.

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | PocketBase ID |
| name | text | Название клиента |
| originalName | text | Оригинальное имя (из импорта) |
| address | text | Адрес |
| mats | json | Массив: `[{"size": "400", "quantity": 2}]` |
| frequency | number (1-7) | Частота обслуживания в неделю |
| days | json | Дни обслуживания: `[0, 2, 4]` |
| notes | text | Заметки |
| isActive | bool | Активен ли клиент |
| lat | number | Широта |
| lng | number | Долгота |

### drivers
Водитель.

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | PocketBase ID |
| name | text | Имя водителя |
| phone | text | Телефон |
| isActive | bool | Активен |
| workDays | json | Рабочие дни: `[0, 1, 2, 3, 4]` |

### mat_sizes
Размеры ковров.

| Поле | Тип | Описание |
|------|-----|----------|
| label | text | Название размера ("400", "250", "60x80") |
| area | number | Площадь в м² |

---

## API-операции

### 1. Просмотр маршрута на день

**Запрос:**
```
GET {PB_URL}/api/collections/day_routes/records?filter=(day={DAY_NUMBER})
```

Получив ID маршрута (`dayRouteId`):
```
GET {PB_URL}/api/collections/route_stops/records?filter=(dayRoute='{dayRouteId}')&expand=client,driver&sort=position&perPage=200
```

**Формат ответа для пользователя:**
```
{ДеньНедели}: {кол-во} остановок, ~{площадь} м²
Водитель: {имя} ({кол-во}), {имя2} ({кол-во2})
Выполнено: {done}/{total} ({процент}%)
```

Площадь вычисляется из `expand.client.mats` — суммировать `size.area * quantity` для каждого мата.

### 2. Добавление остановки

**Шаг 1** — Найти клиента:
```
GET {PB_URL}/api/collections/clients/records?filter=(name~'{имя}')&perPage=5
```

**Шаг 2** — Найти dayRoute:
```
GET {PB_URL}/api/collections/day_routes/records?filter=(day={DAY_NUMBER})
```

**Шаг 3** — Определить позицию. Если указана "после N", то `position = N`. Иначе — в конец (максимальная позиция + 1).

**Шаг 4** — Сдвинуть существующие остановки (position >= новой):
```
PATCH {PB_URL}/api/collections/route_stops/records/{id}
{"position": {old_position + 1}}
```

**Шаг 5** — Создать остановку:
```
POST {PB_URL}/api/collections/route_stops/records
Content-Type: application/json

{
  "dayRoute": "{dayRouteId}",
  "client": "{clientId}",
  "position": {позиция},
  "isCompleted": false
}
```

**Ответ:**
```
Добавлен "{имя клиента}" ({адрес}) — {день}, позиция {N}.
```

### 3. Назначение водителя на остановки

**Шаг 1** — Найти водителя:
```
GET {PB_URL}/api/collections/drivers/records?filter=(name~'{имя}')
```

**Шаг 2** — Найти остановки без водителя (или с указанным фильтром):
```
GET {PB_URL}/api/collections/route_stops/records?filter=(dayRoute='{dayRouteId}' && driver='')&perPage=200
```

**Шаг 3** — Назначить:
```
PATCH {PB_URL}/api/collections/route_stops/records/{stopId}
{"driver": "{driverId}"}
```

**Ответ:**
```
Назначено {N} остановок на {имя} (было {old}, стало {new}).
```

### 4. Статус выполнения

```
GET {PB_URL}/api/collections/route_stops/records?filter=(dayRoute='{dayRouteId}')&perPage=200
```

Подсчитать `isCompleted === true` vs total.

### 5. Список водителей

```
GET {PB_URL}/api/collections/drivers/records?filter=(isActive=true)&sort=name
```

### 6. Поиск клиента

```
GET {PB_URL}/api/collections/clients/records?filter=(name~'{запрос}' || address~'{запрос}')&perPage=10
```

### 7. Отметить остановку выполненной

```
PATCH {PB_URL}/api/collections/route_stops/records/{stopId}
{"isCompleted": true}
```

---

## Важные правила

1. День недели всегда числовой: 0=ПН, 1=ВТ, 2=СР, 3=ЧТ, 4=ПТ, 5=СБ, 6=ВС
2. При добавлении остановки — сдвинуть позиции существующих
3. Relation-поля содержат ID записи (строка), не объект
4. `expand` используется для получения связанных записей в одном запросе
5. `perPage=200` чтобы получить все записи (по умолчанию PocketBase отдаёт 30)
6. Ответы пользователю — всегда на русском, кратко, с emoji
