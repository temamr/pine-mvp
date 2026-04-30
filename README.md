# Pine Marketplace

Pine is a mobile-first marketplace for electronics. Users discover listings, chat with sellers, make offers, complete a safe deal, leave reviews and track the full deal lifecycle inside the product.

## Что уже реализовано

- Next.js App Router + TypeScript strict mode.
- Tailwind CSS UI system with responsive desktop/mobile shell.
- Supabase-backed auth, listings, favorites, chat, offers, moderation, deals, notifications and analytics.
- Storage uploads for avatars and listing images.
- Russian UI, ruble formatting, legal pages and footer.
- Map block in listing creation with Yandex Maps attempt and OpenStreetMap fallback.

## Локальный запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Переменные окружения

Заполни `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=
NEXT_PUBLIC_DATA_SOURCE=supabase
```

Где:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL из Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — публичный anon key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only ключ, никогда не публикуй его на клиенте.
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` — опционально, если хочешь пробовать Яндекс.Карты.
- `NEXT_PUBLIC_DATA_SOURCE=supabase` — включает реальные репозитории вместо mock.

## Supabase setup

Применить миграции:

```bash
supabase db push
```

Загрузить сиды:

```bash
supabase db execute --file supabase/seed.sql
```

## Deploy на Vercel

### 1. Подготовка репозитория

Убедись, что проект закоммичен и запушен в GitHub, GitLab или Bitbucket.

### 2. Импорт проекта в Vercel

1. Открой Vercel Dashboard.
2. Нажми `Add New...` -> `Project`.
3. Выбери репозиторий с Pine.
4. Framework должен определиться как `Next.js` автоматически.
5. Команды оставь стандартные:
   - Build Command: `next build`
   - Install Command: `npm install`
   - Output Directory: пусто

### 3. Добавь Environment Variables в Vercel

В `Project Settings -> Environment Variables` добавь:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_YANDEX_MAPS_API_KEY
NEXT_PUBLIC_DATA_SOURCE=supabase
```

Рекомендую добавить их как минимум для:
- `Production`
- `Preview`
- `Development` при желании работать через Vercel Dev

### 4. Настрой Supabase Auth под домен Vercel

В Supabase Dashboard открой:

`Authentication -> URL Configuration`

Нужно заполнить:

- `Site URL`:
  - `https://your-project.vercel.app`
- `Redirect URLs`:
  - `https://your-project.vercel.app/auth/callback`
  - `https://your-project-git-branch-username.vercel.app/auth/callback`
  - при наличии кастомного домена:
    `https://your-domain.com/auth/callback`

Если используешь preview deployments, добавь также их callback URL или wildcard, если политика проекта это допускает.

### 5. Проверь Storage buckets и schema

Перед production deploy должно существовать:
- bucket `avatars`
- bucket `listing-images`

И должны быть применены все миграции.

### 6. Запусти deploy

После сохранения env Vercel сам соберет проект. Если проект уже импортирован, достаточно нового deploy.

## Что проверить после деплоя

1. Открывается главная страница.
2. Работает регистрация и вход.
3. Создается объявление с загрузкой фото.
4. Открывается карточка объявления.
5. Работает чат и отправка offer.
6. После accepted offer создается safe deal.
7. Открываются `/notifications`, `/deals`, `/favorites`, `/profile`.
8. Для admin/moderator открываются `/moderation` и `/analytics`.

## Частые проблемы

### Не работает вход по email

Обычно причина в Supabase Auth URL Configuration:
- неверный `Site URL`
- не добавлен `/auth/callback`
- не добавлен preview URL Vercel

### Не грузятся картинки объявлений

Проверь:
- корректный `NEXT_PUBLIC_SUPABASE_URL`
- что bucket `listing-images` существует
- что файлы реально загружаются в public path

### Не работает серверная логика

Проверь, что в Vercel задан `SUPABASE_SERVICE_ROLE_KEY`. Он нужен только серверу.

### Карта не отображается

Если Яндекс не поднялся:
- проверь ключ
- проверь ограничения домена / referer
- используй OpenStreetMap fallback в интерфейсе

## Полезные маршруты для smoke test

- `/`
- `/sell`
- `/favorites`
- `/chat`
- `/deals`
- `/notifications`
- `/profile`
- `/moderation`
- `/analytics`

## Что еще intentionally simplified

- Rich media upload в chat пока упрощен.
- Реальный payment provider / escrow не подключен.
- Управление staff roles пока делается напрямую через Supabase.
