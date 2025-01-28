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
  // Заменяем MathML на простой LaTeX
  return content.replace(/<math[^>]*>(.*?)<\/math>/g, (match, inner) => {
    // Извлекаем основные компоненты формулы
    const formula = inner
      .replace(/<[^>]+>/g, '') // Удаляем все теги
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    
    return formula;
  });
};

export const checkFormulas = async (block: TArticleBlock): Promise<DeepSeekResponse> => {
  try {
    // Очищаем контент от MathML
    const cleanContent = cleanMathML(block.content);
    
    console.log('Отправляем запрос с контентом:', cleanContent);

    const response = await fetch('/api/deepseek/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Ты эксперт по LaTeX. Проверяй и исправляй ошибки в формулах. 
            Формулы заключены в символы $. Не изменяй текст вне формул.
            Ответ должен быть строго в JSON формате:
            {
              "original": "Исходный текст с формулой $E=mc^2$",
              "corrected": "Исходный текст с формулой $E=mc^2$",
              "changes": []
            }
            
            Если найдены ошибки:
            {
              "original": "Формула $E=mc^3$",
              "corrected": "Формула $E=mc^2$",
              "changes": [{
                "position": 8,
                "before": "3",
                "after": "2"
              }]
            }`
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Проверь формулы в тексте и исправь ошибки, сохраняя оригинальное форматирование",
              content: cleanContent
            })
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка API:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Ошибка API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Ответ API:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Пустой ответ от API');
    }

    const result = JSON.parse(data.choices[0].message.content);
    console.log('Обработанный результат:', result);
    
    return result as DeepSeekResponse;
    
  } catch (error) {
    console.error('Ошибка при проверке формул:', error);
    throw error;
  }
}; 