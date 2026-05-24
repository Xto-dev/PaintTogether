# AI Documentation Bot

Автоматическая генерация и обновление документации с использованием AI и MCP серверов.

## Описание проекта

AI Documentation Bot - это система автоматической документации кода, которая интегрируется в процесс разработки через GitHub Actions и MCP серверы. Каждый раз когда вы делаете push в репозиторий, AI анализирует изменения и автоматически обновляет документацию.

## Цель проекта

Продемонстрировать практическое применение современных AI технологий в процессе разработки:
- Интеграция AI в CI/CD pipeline
- Использование MCP (Model Context Protocol) серверов
- Автоматизация рутинных задач разработки
- Работа с GitHub API через MCP

## Архитектура

```
Developer writes code
        ↓
    git push
        ↓
GitHub Action triggers
        ↓
MCP Server (GitHub) ← reads diff
        ↓
Claude API / Omniroute ← analyzes code
        ↓
Generate documentation
        ↓
MCP Server (GitHub) ← commits back
        ↓
Updated documentation in repo
```

## Технологический стек

### Core Technologies
- **Python 3.10+** - основной язык разработки
- **GitHub Actions** - CI/CD автоматизация
- **MCP Servers** - интеграция с GitHub и файловой системой

### AI & APIs
- **Claude API** (или Omniroute) - анализ кода и генерация документации
- **GitHub MCP Server** - работа с репозиторием
- **Filesystem MCP Server** - работа с файлами

### Documentation Outputs
- **README.md** - главная документация проекта
- **CHANGELOG.md** - автоматическая история изменений
- **Inline comments** - JSDoc/docstrings для функций (опционально)

## Функциональность

### Автоматическая генерация документации

1. **README.md обновление**
   - Описание новых функций и классов
   - Примеры использования API
   - Обновление списка зависимостей
   - Инструкции по установке и запуску

2. **CHANGELOG.md генерация**
   - Анализ git diff
   - Категоризация изменений (Added, Changed, Fixed, Removed)
   - Семантическое описание изменений
   - Автоматическая версионность

3. **Inline комментарии** (опционально)
   - Генерация docstrings для новых функций
   - JSDoc комментарии для JavaScript/TypeScript
   - Type hints для Python

### Интеллектуальный анализ

- **Контекстное понимание** - AI анализирует не только diff, но и окружающий код
- **Выявление breaking changes** - автоматическое обнаружение несовместимых изменений
- **Предложения по улучшению** - опциональные рекомендации по коду
- **Связь с issues** - автоматическое связывание изменений с GitHub issues

## Workflow

### Для разработчика

1. Пишешь код как обычно
2. Делаешь `git commit` и `git push`
3. Ждешь 1-2 минуты
4. Документация автоматически обновлена

### Под капотом

1. **Trigger**: GitHub Action запускается на push в main/develop
2. **Fetch**: MCP сервер получает diff последнего коммита
3. **Analyze**: Claude API анализирует изменения в коде
4. **Generate**: AI генерирует обновленную документацию
5. **Commit**: MCP сервер коммитит изменения обратно в репо
6. **Notify**: Опционально - уведомление в Slack/Discord

## Структура проекта

```
ai-documentation-bot/
├── .github/
│   └── workflows/
│       └── auto-docs.yml          # GitHub Action для автодокументации
├── src/
│   ├── main.py                    # Основной скрипт
│   ├── mcp_client.py              # Клиент для работы с MCP серверами
│   ├── ai_analyzer.py             # Интеграция с Claude API
│   ├── doc_generator.py           # Генерация документации
│   └── git_utils.py               # Утилиты для работы с git
├── config/
│   ├── mcp_config.json            # Конфигурация MCP серверов
│   └── prompts.json               # Промпты для AI
├── tests/
│   └── test_*.py                  # Тесты
├── docs/
│   └── architecture.md            # Архитектурная документация
├── README.md                      # Главная документация (автогенерируется)
├── CHANGELOG.md                   # История изменений (автогенерируется)
├── requirements.txt               # Python зависимости
└── .env.example                   # Пример переменных окружения
```

## Установка и настройка

### Предварительные требования

- Python 3.10+
- GitHub аккаунт
- Claude API ключ (или Omniroute доступ)
- Git

### Шаги установки

1. **Клонировать репозиторий**
```bash
git clone https://github.com/yourusername/ai-documentation-bot.git
cd ai-documentation-bot
```

2. **Установить зависимости**
```bash
pip install -r requirements.txt
```

3. **Настроить переменные окружения**
```bash
cp .env.example .env
# Отредактировать .env и добавить API ключи
```

4. **Настроить GitHub Secrets**
   - `CLAUDE_API_KEY` - ключ Claude API
   - `GITHUB_TOKEN` - токен для коммитов (автоматически доступен в Actions)

5. **Настроить MCP серверы**
```bash
# Установить GitHub MCP server
npm install -g @modelcontextprotocol/server-github

# Настроить конфигурацию
cp config/mcp_config.example.json config/mcp_config.json
```

## Использование

### Автоматический режим

После настройки GitHub Action, документация будет обновляться автоматически при каждом push в main/develop ветку.

### Ручной запуск

```bash
# Анализ последнего коммита
python src/main.py --commit HEAD

# Анализ конкретного коммита
python src/main.py --commit abc123

# Анализ диапазона коммитов
python src/main.py --range HEAD~5..HEAD

# Генерация только README
python src/main.py --only-readme

# Генерация только CHANGELOG
python src/main.py --only-changelog
```

## Конфигурация

### Настройка промптов

Файл `config/prompts.json` содержит промпты для различных типов документации:

```json
{
  "readme": {
    "system": "You are a technical documentation expert...",
    "user_template": "Analyze the following code changes and update README..."
  },
  "changelog": {
    "system": "You are a changelog generator...",
    "user_template": "Generate changelog entry for..."
  }
}
```

### Настройка MCP серверов

Файл `config/mcp_config.json`:

```json
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

## Примеры сгенерированной документации

### До (ручная документация)
```markdown
# My Project
Some description here.
```

### После (AI-генерация)
```markdown
# My Project

A Python library for data processing with built-in caching and async support.

## Features
- Fast data processing with pandas integration
- Built-in Redis caching layer
- Async/await support for I/O operations
- Type-safe API with full type hints

## Installation
```bash
pip install my-project
```

## Quick Start
```python
from my_project import DataProcessor

processor = DataProcessor(cache_enabled=True)
result = await processor.process(data)
```
```

## Roadmap

### MVP (День 1) ✅
- [x] Базовая интеграция с GitHub Actions
- [x] Анализ git diff через MCP
- [x] Генерация README.md
- [x] Генерация CHANGELOG.md
- [x] Автоматический коммит обратно в репо

### Фаза 2 (Будущее)
- [ ] Генерация inline комментариев
- [ ] Поддержка multiple языков программирования
- [ ] Интеграция с Slack/Discord для уведомлений
- [ ] Web dashboard для просмотра истории генераций
- [ ] A/B тестирование разных промптов
- [ ] Поддержка custom шаблонов документации

### Фаза 3 (Продвинутые фичи)
- [ ] Генерация API документации (OpenAPI/Swagger)
- [ ] Автоматическое создание tutorials и guides
- [ ] Интеграция с documentation сайтами (GitBook, Docusaurus)
- [ ] Multilingual документация
- [ ] Code review suggestions в PR комментариях

## Технические детали

### Как работает анализ кода

1. **Получение diff**: MCP сервер извлекает изменения из последнего коммита
2. **Контекстный анализ**: AI получает не только diff, но и окружающий код для понимания контекста
3. **Семантический анализ**: Claude определяет тип изменений (feature, bugfix, refactor)
4. **Генерация**: AI создает человекочитаемое описание изменений
5. **Форматирование**: Результат форматируется в Markdown

### Оптимизация производительности

- **Prompt caching**: Использование Claude prompt caching для снижения latency
- **Incremental updates**: Обновление только измененных секций документации
- **Parallel processing**: Параллельная генерация README и CHANGELOG
- **Rate limiting**: Умное управление API rate limits

### Безопасность

- API ключи хранятся в GitHub Secrets
- Коммиты от бота подписываются отдельным GitHub App токеном
- Валидация входных данных перед отправкой в AI
- Sandbox для выполнения кода (если требуется)

## Метрики успеха

- ⏱️ **Время генерации**: < 2 минуты на коммит
- 📊 **Качество документации**: Человекочитаемая, точная, полезная
- 🔄 **Частота обновлений**: Документация всегда актуальна
- 💰 **Стоимость**: < $0.10 на коммит (с prompt caching)

## Демонстрация проекта

### Для собеседования

1. **Показать GitHub репозиторий** с историей автоматических коммитов
2. **Live demo**: Сделать изменение в коде, push, показать автогенерацию
3. **Объяснить архитектуру**: MCP серверы, GitHub Actions, AI интеграция
4. **Показать качество**: Сравнить ручную vs AI документацию
5. **Обсудить challenges**: Rate limits, prompt engineering, edge cases

### Ключевые моменты для обсуждения

- Почему выбрали MCP вместо прямого GitHub API
- Как оптимизировали промпты для лучшего качества
- Как обрабатываете edge cases (большие diff, merge conflicts)
- Планы по масштабированию (multiple repos, organizations)

## FAQ

**Q: Сколько стоит запуск на каждый коммит?**  
A: С prompt caching ~$0.05-0.10 на коммит. Без кеширования ~$0.20-0.30.

**Q: Можно ли использовать с приватными репозиториями?**  
A: Да, GitHub Actions работает с приватными репо. Нужен только GitHub token с правами на запись.

**Q: Какие языки программирования поддерживаются?**  
A: MVP фокусируется на Python, но архитектура позволяет легко добавить любой язык.

**Q: Что если AI сгенерирует неправильную документацию?**  
A: Можно откатить коммит или отредактировать вручную. В будущем добавим review step перед коммитом.

**Q: Можно ли кастомизировать стиль документации?**  
A: Да, через промпты в `config/prompts.json` и custom шаблоны.

## Лицензия

MIT License - свободно используйте для личных и коммерческих проектов.

## Контакты

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## Благодарности

- Anthropic за Claude API
- Model Context Protocol за стандарт интеграции
- GitHub за Actions и отличный API

---

**Статус проекта**: 🚧 В разработке (MVP планируется за 1 день)

**Последнее обновление**: 2026-05-24
