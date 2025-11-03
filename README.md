# Reflex - Приложение для фиксации мыслей

Приложение для быстрой записи голосовых мыслей с транскрипцией через Whisper AI и хранением в Supabase.

## Технологии

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (база данных)
- **OpenAI Whisper API** (транскрипция)
- **PWA** (Progressive Web App)

## Установка локально

1. Клонируй репозиторий:
```bash
git clone <your-repo-url>
cd reflex-app
```

2. Установи зависимости:
```bash
npm install
```

3. Создай файл `.env.local` и добавь свои ключи:
```env
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=https://luxjocqgnfgyorykfzhg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Запусти в режиме разработки:
```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

## Деплой на Vercel

### Шаг 1: Создай репозиторий на GitHub

1. Зайди на https://github.com/new
2. Название репозитория: `reflex-app`
3. Сделай его приватным (чтобы API ключи были в безопасности)
4. Нажми "Create repository"

### Шаг 2: Загрузи код в GitHub

Выполни команды в директории проекта:

```bash
git init
git add .
git commit -m "Initial commit: Reflex app"
git branch -M main
git remote add origin https://github.com/<your-username>/reflex-app.git
git push -u origin main
```

### Шаг 3: Деплой на Vercel

1. Зайди на https://vercel.com/
2. Нажми "Add New" → "Project"
3. Импортируй свой GitHub репозиторий `reflex-app`
4. В настройках проекта добавь Environment Variables:
   - `OPENAI_API_KEY` = твой OpenAI ключ
   - `NEXT_PUBLIC_SUPABASE_URL` = https://luxjocqgnfgyorykfzhg.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = твой Supabase anon key
5. Нажми "Deploy"

Через 1-2 минуты приложение будет доступно на URL вида `reflex-app.vercel.app`

### Шаг 4: Настройка PWA на телефоне

#### Android (Chrome):
1. Открой ссылку на свое приложение в Chrome
2. Нажми меню (три точки) → "Добавить на главный экран"
3. Готово! Теперь можешь открывать как приложение

#### iOS (Safari):
1. Открой ссылку в Safari
2. Нажми кнопку "Поделиться" (квадрат со стрелкой)
3. Выбери "На экран «Домой»"
4. Готово!

## Структура проекта

```
reflex-app/
├── app/
│   ├── api/
│   │   └── transcribe/
│   │       └── route.ts       # API endpoint для транскрипции
│   ├── globals.css            # Глобальные стили
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Главная страница
├── public/
│   └── manifest.json          # PWA манифест
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Функции (Этап 1 - MVP)

✅ Запись аудио через микрофон  
✅ Транскрипция через Whisper API  
✅ Сохранение в Supabase  
✅ Просмотр последних мыслей  
✅ Выбор настроения  
✅ Удаление мыслей  
✅ PWA (установка на главный экран)  
✅ Темная тема с оранжевым акцентом  

## Дальнейшие этапы

⏳ Этап 2: Вкладка "Рефлексия" с диалогом с Claude AI  
⏳ Этап 3: Анализ паттернов  
⏳ Этап 4: Визуализация данных  

## Troubleshooting

### Микрофон не работает
- Проверь разрешения в браузере
- Убедись, что используешь HTTPS (Vercel автоматически использует HTTPS)
- Проверь, что микрофон не используется другим приложением

### Ошибка транскрипции
- Проверь, что OPENAI_API_KEY правильно настроен в Vercel
- Убедись, что на балансе OpenAI есть средства
- Проверь логи в Vercel Dashboard

### Ошибка Supabase
- Проверь, что таблица `thoughts` создана (выполни SQL из `supabase_schema.sql`)
- Убедись, что SUPABASE_URL и SUPABASE_ANON_KEY правильные
- Проверь Row Level Security policies в Supabase

## Безопасность

⚠️ **Важно:** 
- Никогда не коммить `.env.local` в Git
- Используй Environment Variables в Vercel
- Supabase RLS включен для защиты данных
- API ключи передаются только через серверные API routes

## Лицензия

MIT
