const PDF_SERVICE_URL = 'https://service-pdf.teach-in.ru';

interface PDFServerResponse {
  extracted_text: string;
}

interface PDFResponse {
  blocks: Array<{
    type: 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
    content: string;
    isInline?: boolean;
  }>;
}

// Функция для декодирования Unicode последовательностей
function decodeUnicode(str: string): string {
  return JSON.parse(`"${str}"`);
}

// Определяет, является ли строка заголовком
function isTitle(line: string): {isTitle: boolean, level: number} {
  // Проверяем числовые заголовки (например "1. Функция и матрица Коши")
  if (/^\d+\.\s+[А-Я]/.test(line)) {
    return {isTitle: true, level: 1};
  }
  
  // Проверяем заголовки задач (например "№67.")
  if (/^№\d+\./.test(line)) {
    return {isTitle: true, level: 2};
  }

  // Проверяем заглавные заголовки
  if (/^[А-Я\s]{10,}$/.test(line)) {
    return {isTitle: true, level: 1};
  }

  return {isTitle: false, level: 0};
}

// Определяет, является ли строка формулой
function isFormula(line: string): boolean {
  // Проверяем наличие математических символов
  const mathSymbols = /[±∞∑∏∫√λπ\[\]\{\}\(\)]/;
  const operators = /[+\-*/=<>≤≥≈≠]/;
  
  return mathSymbols.test(line) && operators.test(line);
}

// Обработка текста в блоки
function processTextToBlocks(text: string): PDFResponse['blocks'] {
  const lines = text.split('\n').filter(line => line.trim());
  const blocks: PDFResponse['blocks'] = [];
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Пропускаем повторяющиеся заголовки и предупреждения
    if (line.includes('КОНСПЕКТ ПОДГОТОВЛЕН СТУДЕНТАМИ') || 
        line.includes('СЛЕДИТЕ ЗА ОБНОВЛЕНИЯМИ')) {
      continue;
    }

    const titleCheck = isTitle(line);
    
    if (titleCheck.isTitle) {
      // Если был накоплен параграф, сохраняем его
      if (currentParagraph) {
        blocks.push({
          type: 'P',
          content: currentParagraph.trim()
        });
        currentParagraph = '';
      }
      
      blocks.push({
        type: titleCheck.level === 1 ? 'H1' : 'H2',
        content: line
      });
      continue;
    }

    if (isFormula(line)) {
      // Если был накоплен параграф, сохраняем его
      if (currentParagraph) {
        blocks.push({
          type: 'P',
          content: currentParagraph.trim()
        });
        currentParagraph = '';
      }

      blocks.push({
        type: 'FORMULA',
        content: line,
        isInline: false
      });
      continue;
    }

    // Накапливаем текст параграфа
    currentParagraph += ' ' + line;
  }

  // Добавляем последний параграф
  if (currentParagraph) {
    blocks.push({
      type: 'P',
      content: currentParagraph.trim()
    });
  }

  return blocks;
}

export const pdfAPI = {
  async extractText(file: File): Promise<PDFResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(PDF_SERVICE_URL, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Origin': 'http://localhost:5173'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервиса PDF: ${response.status}`);
      }

      const data: PDFServerResponse = await response.json();
      console.log('Ответ от сервера:', data);
      
      try {
        const decodedText = decodeUnicode(data.extracted_text);
        console.log('Расшифрованный текст:', decodedText);
        
        const blocks = processTextToBlocks(decodedText);
        console.log('Преобразованные блоки:', blocks);

        return { blocks };
      } catch (decodeError) {
        console.error('Ошибка при декодировании текста:', decodeError);
        const blocks = processTextToBlocks(data.extracted_text);
        return { blocks };
      }
    } catch (error) {
      console.error('Ошибка при обработке PDF:', error);
      throw error;
    }
  }
}; 