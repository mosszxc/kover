---
name: kover
description: "Управление маршрутами Kover через Supabase REST API. Используй когда пользователь спрашивает про маршруты, остановки, клиентов, водителей, статистику доставки. Умеет: просмотр маршрута на день, добавление/удаление остановок, назначение водителей, отметка выполнения, статистика."
metadata: { "openclaw": { "emoji": "truck", "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] } } }
---

# Kover — управление маршрутами

Система управления маршрутами доставки ковров. Данные хранятся в Supabase (PostgreSQL + PostgREST).

Всегда отвечай на **русском языке**. Форматируй для Telegram (markdown).

## Auth

Все запросы требуют два заголовка:

```bash
-H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Базовый URL: `$SUPABASE_URL/rest/v1`

## Схема данных

### Таблицы

| Таблица | Описание |
|---------|----------|
| `clients` | Клиенты (имя, адрес, ковры, дни обслуживания) |
| `drivers` | Водители (имя, телефон, рабочие дни) |
| `day_routes` | Маршруты по дням (day: 0=Пн, 1=Вт, ..., 6=Вс) |
| `route_stops` | Остановки маршрута (клиент + водитель + позиция) |
| `mat_sizes` | Размеры ковров (label, area м²) |
| `service_log` | Журнал обслуживания |
| `settings` | Настройки (key-value) |

### Дни недели

```
0 = Понедельник
1 = Вторник
2 = Среда
3 = Четверг
4 = Пятница
5 = Суббота
6 = Воскресенье
```

### Клиент (clients)

```
id          uuid        PK
name        text        Название
address     text        Адрес
mats        jsonb       Ковры: [{"sizeId": "uuid", "quantity": 2}]
frequency   integer     Частота (1 = каждую неделю, 2 = раз в 2 недели)
days        integer[]   Дни обслуживания [0, 2, 4]
notes       text        Заметки
is_active   boolean     Активен
lat, lng    float8      Координаты
```

### Водитель (drivers)

```
id          uuid        PK
name        text        Имя
phone       text        Телефон
is_active   boolean     Активен
work_days   integer[]   Рабочие дни [0,1,2,3,4]
```

### Маршрут дня (day_routes)

```
id          uuid        PK
day         integer     День недели (0-6), UNIQUE
```

### Остановка (route_stops)

```
id              uuid        PK
day_route_id    uuid        FK → day_routes
client_id       uuid        FK → clients
driver_id       uuid        FK → drivers (nullable)
position        integer     Порядок в маршруте
is_completed    boolean     Выполнено
skipped_until   timestamptz Пропущено до даты
```

## API — Частые операции

### Получить маршрут на день

Получить все остановки дня с данными клиента и водителя:

```bash
DAY=0  # Понедельник

# Сначала получить day_route_id
DAY_ROUTE=$(curl -s "$SUPABASE_URL/rest/v1/day_routes?day=eq.$DAY&select=id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.[0].id')

# Затем остановки с клиентами и водителями
curl -s "$SUPABASE_URL/rest/v1/route_stops?day_route_id=eq.$DAY_ROUTE&select=*,client:clients(*),driver:drivers(*)&order=position.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq .
```

### Статистика маршрута

```bash
# Количество остановок, выполненных, по водителям
curl -s "$SUPABASE_URL/rest/v1/route_stops?day_route_id=eq.$DAY_ROUTE&select=id,is_completed,driver:drivers(name)" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '{
    total: length,
    completed: [.[] | select(.is_completed)] | length,
    by_driver: (group_by(.driver.name) | map({driver: .[0].driver.name, count: length}))
  }'
```

### Площадь ковров на маршруте

```bash
# Получить размеры ковров
MAT_SIZES=$(curl -s "$SUPABASE_URL/rest/v1/mat_sizes?select=id,label,area" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

# Остановки с данными клиентов (mats содержит sizeId и quantity)
STOPS=$(curl -s "$SUPABASE_URL/rest/v1/route_stops?day_route_id=eq.$DAY_ROUTE&select=client:clients(name,mats)" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

# Подсчёт площади — сопоставить mats[].sizeId с mat_sizes[].id
echo "$STOPS" | jq --argjson sizes "$MAT_SIZES" '
  [.[].client.mats[] |
    . as $mat |
    ($sizes[] | select(.id == $mat.sizeId)) as $size |
    ($size.area * $mat.quantity)
  ] | add // 0 | . * 100 | round / 100
'
```

### Добавить остановку

```bash
# Получить следующую позицию
MAX_POS=$(curl -s "$SUPABASE_URL/rest/v1/route_stops?day_route_id=eq.$DAY_ROUTE&select=position&order=position.desc&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.[0].position // 0')

NEXT_POS=$((MAX_POS + 1))

curl -s -X POST "$SUPABASE_URL/rest/v1/route_stops" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"day_route_id\": \"$DAY_ROUTE\",
    \"client_id\": \"$CLIENT_ID\",
    \"driver_id\": \"$DRIVER_ID\",
    \"position\": $NEXT_POS
  }" | jq .
```

### Вставить остановку после позиции N

```bash
TARGET_POS=15  # Вставить после позиции 15

# Сдвинуть остановки с position > TARGET_POS
curl -s -X PATCH "$SUPABASE_URL/rest/v1/route_stops?day_route_id=eq.$DAY_ROUTE&position=gt.$TARGET_POS" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"position": "position + 1"}' > /dev/null

# ПРИМЕЧАНИЕ: PostgREST не поддерживает арифметику в PATCH.
# Используй RPC или обнови каждую остановку отдельно:
STOPS_TO_SHIFT=$(curl -s "$SUPABASE_URL/rest/v1/route_stops?day_route_id=eq.$DAY_ROUTE&position=gt.$TARGET_POS&select=id,position&order=position.desc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

echo "$STOPS_TO_SHIFT" | jq -c '.[]' | while read -r stop; do
  STOP_ID=$(echo "$stop" | jq -r '.id')
  NEW_POS=$(echo "$stop" | jq '.position + 1')
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/route_stops?id=eq.$STOP_ID" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"position\": $NEW_POS}" > /dev/null
done

# Вставить новую остановку
NEW_POS=$((TARGET_POS + 1))
curl -s -X POST "$SUPABASE_URL/rest/v1/route_stops" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"day_route_id\": \"$DAY_ROUTE\",
    \"client_id\": \"$CLIENT_ID\",
    \"position\": $NEW_POS
  }" | jq .
```

### Назначить водителя на остановки

```bash
# Назначить водителя на все остановки без водителя
curl -s -X PATCH "$SUPABASE_URL/rest/v1/route_stops?day_route_id=eq.$DAY_ROUTE&driver_id=is.null" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"driver_id\": \"$DRIVER_ID\"}" | jq 'length'
```

### Отметить остановку выполненной

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/route_stops?id=eq.$STOP_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"is_completed": true}' | jq .
```

### Найти клиента по имени

```bash
curl -s "$SUPABASE_URL/rest/v1/clients?name=ilike.*поиск*&select=id,name,address&is_active=eq.true" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq .
```

### Найти водителя по имени

```bash
curl -s "$SUPABASE_URL/rest/v1/drivers?name=ilike.*поиск*&select=id,name,phone&is_active=eq.true" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq .
```

### Список всех водителей

```bash
curl -s "$SUPABASE_URL/rest/v1/drivers?is_active=eq.true&select=id,name,phone,work_days&order=name.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq .
```

### Удалить остановку

```bash
curl -s -X DELETE "$SUPABASE_URL/rest/v1/route_stops?id=eq.$STOP_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq .
```

## Форматирование ответов

При ответе пользователю:
- Используй **русский язык**
- Форматируй Telegram-markdown (жирный `**`, моноширинный `` ` ``)
- Дни недели: Понедельник, Вторник, ..., Воскресенье
- Площадь в м² (метры квадратные)
- Для списков — нумерация с эмодзи: 1️⃣ 2️⃣ 3️⃣ или точки •

### Примеры ответов

**Статус маршрута:**
```
📋 **Понедельник** — 58 остановок, ~141 м²
🚗 Илья: 45 остановок
🚗 Без водителя: 13 остановок
✅ Выполнено: 12/58 (21%)
```

**Добавление остановки:**
```
✅ Добавлен «Новый Клиент» (Ленина 10) — среда, позиция 16.
```

**Назначение водителя:**
```
✅ Назначено 13 остановок на Сергея (было 29, стало 42).
```

## Важные правила

1. **Всегда проверяй существование** клиента/водителя перед операцией
2. **day_route_id** — получай по дню, не хардкодь UUID
3. **position** — при вставке сдвигай последующие остановки
4. **Подтверждай** деструктивные операции (удаление) перед выполнением
5. **driver_id может быть null** — остановка без назначенного водителя
6. **skipped_until** — если не null и дата в будущем, остановка пропущена
7. **mats** — JSON массив `[{"sizeId": "uuid", "quantity": N}]`, для площади нужен join с mat_sizes
