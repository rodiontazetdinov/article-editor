import { TArticleBlock } from '@/types/article';

interface FormulaChange {
  position: number;
  before: string;
  after: string;
}

interface DeepSeekResponse {
  original: string;
  corrected: string;
  changes: FormulaChange[];
}

const DEEPSEEK_API_KEY = 'sk-073718bcad1e410582fe8ad08fa328c2';

// Функция для очистки MathML и конвертации в LaTeX
const cleanMathML = (content: string): string => {
  // Сначала обрабатываем MathML
  const cleanedMathML = content.replace(/<math[^>]*>(.*?)<\/math>/g, (match, inner) => {
    // Извлекаем основные компоненты формулы
    const formula = inner
      .replace(/<[^>]+>/g, '') // Удаляем все теги
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    
    return formula; // Возвращаем формулу без $ - пусть DeepSeek сам решит, нужно ли это формула
  });

  // Очищаем текст от HTML-сущностей и специальных символов
  return cleanedMathML
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ') // Убираем множественные пробелы
    .replace(/\.\s*\.\s*\./g, '...') // Исправляем многоточия
    .replace(/\s*,\s*/g, ', ') // Исправляем запятые
    .replace(/\s*\.\s*/g, '. ') // Исправляем точки
    .replace(/\s*:\s*/g, ': ') // Исправляем двоеточия
    .replace(/\s*;\s*/g, '; ') // Исправляем точки с запятой
    .trim();
};

// Функция для разбиения текста на части с формулами
const splitTextIntoChunks = (text: string): string[] => {
  // Разбиваем по предложениям, сохраняя целостность формул
  const sentences = text.split(/(?<=[.!?])\s+(?=[А-ЯA-Z])/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > 500) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

// Функция для предварительной очистки текста от артефактов PDF
const preprocessPDFText = (text: string): string => {
  return text
    // Исправляем точки и многоточия
    .replace(/\.\s*\.\s*\./g, '...') // ... вместо . . .
    .replace(/\s*\.\s+(?=[А-Я])/g, '. ') // Точка в конце предложения
    
    // Убираем переносы и дефисы
    .replace(/(\w+)-\s+(\w+)/g, '$1$2') // Убираем переносы слов
    .replace(/\s*-\s*/g, '-') // Нормализуем дефисы
    
    // Исправляем пробелы в формулах
    .replace(/(\w+)\s+(\d+)/g, '$1_$2') // x 1 -> x_1
    .replace(/(\w+)(\d+)/g, '$1_$2') // x1 -> x_1
    
    // Исправляем математические символы
    .replace(/↔/g, '\\leftrightarrow')
    .replace(/∈/g, '\\in')
    .replace(/⊂/g, '\\subset')
    .replace(/∩/g, '\\cap')
    .replace(/∪/g, '\\cup')
    
    // Исправляем запись степеней и индексов
    .replace(/\b([A-Za-z])n\b/g, '$1^n') // An -> A^n, Kn -> K^n
    .replace(/([A-Za-z])_?(\d+)/g, '$1_$2') // x1, x_1 -> x_1
    
    // Исправляем запись множеств
    .replace(/\{([^}]*)\}/g, '\\{$1\\}')
    
    // Убираем множественные пробелы
    .replace(/\s+/g, ' ')
    .trim();
};

// Улучшаем промпт для DeepSeek
const SYSTEM_PROMPT = `Ты LaTeX эксперт. Задача: найти математические формулы в тексте и преобразовать их в LaTeX. Ответ должен быть строго в формате JSON.

ВАЖНО: Отвечай максимально быстро. Не думай слишком долго.

Правила форматирования:
1. Математические символы и переменные оборачивать в $: K → $K$
2. Операторы писать как \\text{}: char → $\\text{char}$
3. Индексы через _: x1 → $x_1$
4. Степени через ^: An → $A^n$
5. Множества в \\{\\}: {x} → $\\{x\\}$
6. Стрелки и символы: ↔ → $\\leftrightarrow$, ∈ → $\\in$
7. Производные записывать БЕЗ фигурных скобок:
   - x' вместо x^{'}
   - x'' вместо x^{' '}
   - x''' вместо x^{' ' '}
8. Экспоненту писать как e^{...}, а не ⅇ:
   - e^{2t} вместо ⅇ^{2t}
   - e^t вместо ⅇ^t

Примеры:
"x' + y'" → "$x' + y'$"
"x'' - 2x'" → "$x'' - 2x'$"
"x''' + 3x''" → "$x''' + 3x''$"
"ee^{2t}" → "$e^{2t}$"

Формат ответа строго JSON:
{
  "original": "текст",
  "corrected": "текст с $формулами$",
  "changes": [{"position": число, "before": "было", "after": "стало"}]
}`;

export const checkFormulas = async (block: TArticleBlock): Promise<DeepSeekResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 секунд

    try {
      // Берем самый последний контент из блока
      const latestContent = block.content;
      
      // Предварительная обработка текста
      const cleanedContent = latestContent
        .replace(/ⅇ/g, 'e')
        .replace(/\{'\s*'\s*'\}/g, "'''")
        .replace(/\{'\s*'\}/g, "''")
        .replace(/\{'\}/g, "'");

      const requestBody = {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Найди формулы и преобразуй в LaTeX",
              content: cleanedContent
            })
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      };

      console.log('DeepSeek request:', JSON.stringify({
        url: '/api/deepseek/chat/completions',
        body: requestBody
      }, null, 4));

      const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify(requestBody)
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('DeepSeek API response:', data);
      
      if (!data.choices?.[0]?.message?.content) {
        console.error('Empty response from API:', data);
        throw new Error('Empty response from API');
      }

      const result = JSON.parse(data.choices[0].message.content) as DeepSeekResponse;
      console.log('Parsed DeepSeek result:', result);
      
      // Проверяем структуру ответа тихо, без выбрасывания ошибок
      if (!result.original || !result.corrected || !Array.isArray(result.changes)) {
        return {
          original: latestContent,
          corrected: latestContent,
          changes: []
        };
      }

      // Пост-обработка для блочных формул
      if (block.type === 'FORMULA' && !block.inline) {
        console.log('Post-processing block formula, removing $ wrapper');
        // Удаляем обрамляющие $ из corrected и changes
        result.corrected = result.corrected.replace(/^\$|\$$/g, '');
        result.changes = result.changes.map(change => ({
          ...change,
          after: change.after.replace(/^\$|\$$/g, '')
        }));
        console.log('Post-processed result:', result);
      }

      // Проверяем каждое изменение тихо
      result.changes = result.changes.filter(change => 
        typeof change.position === 'number' && 
        typeof change.before === 'string' && 
        typeof change.after === 'string'
      );

      // Дополнительная постобработка результата
      result.corrected = result.corrected
        .replace(/\{'\s*'\s*'\}/g, "'''")
        .replace(/\{'\s*'\}/g, "''")
        .replace(/\{'\}/g, "'")
        .replace(/ⅇ/g, 'e');

      return result;

    } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    // В случае ошибки возвращаем исходный текст без изменений
    return {
      original: block.content,
      corrected: block.content,
      changes: []
    };
  }
}; 