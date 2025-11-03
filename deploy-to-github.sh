#!/bin/bash

# Скрипт для автоматической загрузки Reflex на GitHub
# Использование: ./deploy-to-github.sh <your-github-username>

set -e  # Остановка при ошибке

# Проверка аргументов
if [ -z "$1" ]; then
    echo "❌ Ошибка: Не указан GitHub username"
    echo "Использование: ./deploy-to-github.sh <your-github-username>"
    echo "Пример: ./deploy-to-github.sh john-doe"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="reflex-app"
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo "🚀 Начинаю деплой Reflex на GitHub..."
echo "📦 Репозиторий: $REPO_URL"
echo ""

# Проверка что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден"
    echo "Убедись, что ты находишься в директории reflex-app"
    exit 1
fi

# Инициализация Git (если еще не инициализирован)
if [ ! -d ".git" ]; then
    echo "📝 Инициализация Git..."
    git init
else
    echo "✅ Git уже инициализирован"
fi

# Добавление всех файлов
echo "📁 Добавление файлов..."
git add .

# Проверка что есть изменения для коммита
if git diff-index --quiet HEAD 2>/dev/null; then
    echo "ℹ️  Нет новых изменений для коммита"
else
    echo "💾 Создание коммита..."
    git commit -m "Initial commit: Reflex app"
fi

# Переименование ветки в main
echo "🌿 Переименование ветки в main..."
git branch -M main

# Проверка существующего remote
if git remote | grep -q origin; then
    echo "✅ Remote origin уже настроен"
    CURRENT_REMOTE=$(git remote get-url origin)
    if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
        echo "⚠️  Remote URL отличается. Обновляю..."
        git remote set-url origin "$REPO_URL"
    fi
else
    echo "🔗 Добавление remote origin..."
    git remote add origin "$REPO_URL"
fi

# Push на GitHub
echo "⬆️  Отправка на GitHub..."
echo ""
echo "⚠️  Сейчас Git попросит авторизацию:"
echo "   Username: твой GitHub username"
echo "   Password: используй Personal Access Token"
echo "   (создай токен здесь: https://github.com/settings/tokens)"
echo ""

if git push -u origin main; then
    echo ""
    echo "✅ Успешно! Код загружен на GitHub"
    echo "🔗 Репозиторий: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Зайди на https://vercel.com/"
    echo "2. Импортируй репозиторий reflex-app"
    echo "3. Добавь Environment Variables (см. DEPLOY_GUIDE.md)"
    echo "4. Нажми Deploy"
else
    echo ""
    echo "❌ Ошибка при push на GitHub"
    echo "Возможные причины:"
    echo "1. Неправильный username"
    echo "2. Репозиторий не создан на GitHub"
    echo "3. Проблемы с авторизацией"
    echo ""
    echo "Создай репозиторий здесь: https://github.com/new"
    echo "Используй Personal Access Token для авторизации"
fi
