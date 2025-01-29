# Article Editor Pro

Профессиональный редактор статей с расширенной поддержкой научного контента и формул

## 🌟 Основные возможности

### 📝 Многоформатное редактирование
- Поддержка блоков: заголовки (H1-H3), параграфы, формулы, изображения, подписи
- Drag-and-drop перестановка блоков
- Иерархическая структура с отступами
- История изменений (Undo/Redo)

### 🔬 Работа с формулами
- Редактор LaTeX с предпросмотром в реальном времени
- Интеграция с DeepSeek API для:
  - Автокоррекции формул
  - Преобразования текста в формулы
  - Валидации математических выражений
- Поддержка как inline, так и block формул
- Система версионирования изменений

### 📑 Импорт/Экспорт
- Поддерживаемые форматы:
  - PDF (с сохранением структуры)
  - DOCX
  - TeX/LaTeX
  - JSON (полная совместимость)
- Интеллектуальная очистка контента:
  - Исправление артефактов PDF
  - Нормализация формул
  - Оптимизация изображений

### 🛠 Технологический стек
- **Frontend**: 
  - Next.js 14 + React 18
  - TypeScript 5
  - Tailwind CSS + Shadcn UI
  - Tiptap Editor (расширенная версия)
- **Интеграции**:
  - DeepSeek API (математический AI)
  - MathJax/Katex для рендеринга формул
  - PDF.js для парсинга PDF

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- API ключ DeepSeek (добавить в .env.local)

```bash
# Установка зависимостей
npm install

# Запуск в dev-режиме
npm run dev

# Сборка для production
npm run build
```

## 🧩 Архитектура проекта

### Основные компоненты
```
src/
├── components/        # UI-компоненты редактора
├── api/               # Интеграции с внешними API
├── types/             # Типы данных и интерфейсы
├── utils/             # Вспомогательные функции
├── hooks/             # Кастомные хуки
└── lib/               # Конфигурации и клиенты
```

### Ключевые модули
1. **ArticleEditor** - центральный компонент редактора
2. **DeepSeek API** - обработка математических выражений
3. **Formula Parser** - система преобразования LaTeX
4. **Document Cleaner** - очистка импортированного контента
5. **History Manager** - система управления историей изменений

## 🔑 Особенности реализации

### Обработка формул
```typescript
// Пример обработки формул через DeepSeek
export const checkFormulas = async (block: TArticleBlock): Promise<DeepSeekResponse> => {
  try {
    const processedContent = preprocessFormula(block.content);
    const response = await deepSeekAPI.analyze(processedContent);
    return applyChanges(block.content, response.changes);
  } catch (error) {
    handleFormulaError(error);
    return fallbackResponse(block);
  }
};
```

### Безопасность данных
- Валидация всех входящих данных
- Санитайзинг HTML-контента
- Защита от XSS-атак
- Шифрование чувствительных данных

## 📚 Документация разработчика

### Работа с блоками
```typescript
interface TArticleBlock {
  id: string;
  type: 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
  content: string;
  indent: number;
  modified: string;
  // ...дополнительные поля
}
```

### Важные скрипты
```json
{
  "scripts": {
    "dev": "next dev -p 5173",
    "build": "next build",
    "start": "next start -p 5173",
    "lint": "next lint",
    "deploy": "cross-env DEPLOY_TARGET=gh-pages next build && gh-pages -d out"
  }
}
```

## 📄 Лицензия

MIT License © 2024 Article Editor Pro Team

---

[![Article Editor Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://article-editor-pro.demo)
[![DeepSeek Powered](https://img.shields.io/badge/Powered%20by-DeepSeekAI-blue)](https://deepseek.com)
