const PDF_SERVICE_URL = 'https://service-pdf.teach-in.ru';

interface PDFServerResponse {
  extracted_text: string;
}

interface PDFResponse {
  blocks: Array<{
    type: 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
    content: string;
    isInline?: boolean;
    indent?: number;
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

// Определяет, является ли текст формулой
function isFormula(text: string): {isFormula: boolean, isInline: boolean} {
  // Характерные признаки формул
  const hasEquation = text.includes('=');
  const hasIntegral = text.includes('∫');
  const hasSum = text.includes('∑');
  const hasGreekLetters = /[λαβγδ]/.test(text);
  const hasSubscripts = /[₀₁₂₃₄ᵢⱼ]/.test(text);
  const hasMathOperators = /[±∞∏√]/.test(text);
  
  // Если это явно формула с равенством или интегралом/суммой
  if ((hasEquation && text.length > 10) || hasIntegral || hasSum) {
    return {isFormula: true, isInline: false};
  }
  
  // Если есть греческие буквы и индексы - вероятно inline формула
  if ((hasGreekLetters || hasSubscripts) && text.length < 30) {
    return {isFormula: true, isInline: true};
  }
  
  // Если есть математические операторы и текст короткий
  if (hasMathOperators && text.length < 20) {
    return {isFormula: true, isInline: true};
  }
  
  return {isFormula: false, isInline: false};
}

// Определяет, является ли строка частью оглавления
function isTableOfContents(line: string): boolean {
  return line.includes('...') || 
         /^\d+\.\s+[А-Я].*\.{3,}/.test(line) ||
         line.trim() === 'Оглавление';
}

// Обработка оглавления
function processTOC(lines: string[], startIndex: number): {blocks: PDFResponse['blocks'], endIndex: number} {
  const tocBlocks: PDFResponse['blocks'] = [];
  let currentSection = '';
  let i = startIndex;

  // Добавляем заголовок оглавления
  tocBlocks.push({
    type: 'H1',
    content: 'Оглавление'
  });

  // Пропускаем пустые строки после заголовка
  while (i < lines.length && !lines[i].trim()) {
    i++;
  }

  // Собираем секции оглавления
  while (i < lines.length && isTableOfContents(lines[i])) {
    const line = lines[i].trim();
    
    // Если это основной раздел (начинается с цифры и точки)
    if (/^\d+\.\s+[А-Я]/.test(line)) {
      if (currentSection) {
        tocBlocks.push({
          type: 'P',
          content: currentSection.trim(),
          indent: 1
        });
      }
      currentSection = line;
    }
    // Если это подраздел (начинается с №)
    else if (/^№\d+\./.test(line)) {
      currentSection += '\n' + line;
    }
    // Пропускаем строки с точками
    else if (line.includes('...')) {
      i++;
      continue;
    }
    
    i++;
  }

  // Добавляем последнюю секцию
  if (currentSection) {
    tocBlocks.push({
      type: 'P',
      content: currentSection.trim(),
      indent: 1
    });
  }

  return {
    blocks: tocBlocks,
    endIndex: i - 1
  };
}

// Определяет, является ли текст inline-формулой
function isInlineFormula(text: string): boolean {
  // Проверяем наличие математических символов
  const mathSymbols = /[±∞∑∏∫√λπ\[\]\{\}\(\)]/;
  const greekLetters = /[αβγδεζηθικλμνξοπρστυφχψω]/i;
  const subscripts = /[₀₁₂₃₄₅₆₇₈₉ᵢⱼₐₑₒₓₔₕₖₗₘₙₚₛₜ]/;
  const operators = /[+\-*/=<>≤≥≈≠]/;
  
  return (mathSymbols.test(text) || greekLetters.test(text) || subscripts.test(text)) && 
         operators.test(text) && 
         text.length < 50; // Inline формулы обычно короче
}

// Разбивает текст на части, выделяя формулы
function splitTextWithFormulas(text: string): Array<{type: 'text' | 'formula', content: string}> {
  const parts: Array<{type: 'text' | 'formula', content: string}> = [];
  const words = text.split(' ');
  let currentText = '';

  for (const word of words) {
    if (isInlineFormula(word)) {
      if (currentText) {
        parts.push({type: 'text', content: currentText.trim()});
        currentText = '';
      }
      parts.push({type: 'formula', content: word});
    } else {
      currentText += ' ' + word;
    }
  }

  if (currentText) {
    parts.push({type: 'text', content: currentText.trim()});
  }

  return parts;
}

// Определяет, является ли строка блочной формулой
function isBlockFormula(line: string): boolean {
  // Проверяем наличие математических символов
  const mathSymbols = /[±∞∑∏∫√λπ\[\]\{\}\(\)]/;
  const operators = /[+\-*/=<>≤≥≈≠]/;
  const complexFormula = line.includes('=') && 
                        (line.split('=').length > 2 || 
                         line.length > 30);
  
  return mathSymbols.test(line) && 
         operators.test(line) && 
         (complexFormula || line.trim().startsWith('\\[') || 
          line.includes('∫') || line.includes('∑'));
}

// Обработка текста в блоки
function processTextToBlocks(text: string): PDFResponse['blocks'] {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line && 
      !line.includes('КОНСПЕКТ ПОДГОТОВЛЕН СТУДЕНТАМИ') &&
      !line.includes('СЛЕДИТЕ ЗА ОБНОВЛЕНИЯМИ'));
  
  const blocks: PDFResponse['blocks'] = [];
  let currentText = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    
    // Проверяем заголовок
    const titleCheck = isTitle(line);
    if (titleCheck.isTitle) {
      if (currentText) {
        blocks.push({
          type: 'P',
          content: currentText.trim()
        });
        currentText = '';
      }
      blocks.push({
        type: titleCheck.level === 1 ? 'H1' : 'H2',
        content: line
      });
      continue;
    }
    
    // Проверяем формулу
    const formulaCheck = isFormula(line);
    if (formulaCheck.isFormula) {
      if (currentText) {
        blocks.push({
          type: 'P',
          content: currentText.trim()
        });
        currentText = '';
      }
      blocks.push({
        type: 'FORMULA',
        content: line,
        isInline: formulaCheck.isInline
      });
      continue;
    }
    
    // Если следующая строка - формула, а текущая короткая - 
    // вероятно это подпись к формуле
    const nextFormulaCheck = isFormula(nextLine);
    if (nextFormulaCheck.isFormula && line.length < 50) {
      if (currentText) {
        blocks.push({
          type: 'P',
          content: currentText.trim()
        });
        currentText = '';
      }
      blocks.push({
        type: 'CAPTION',
        content: line
      });
      continue;
    }
    
    // Если строка начинается с маркера списка
    if (/^[1-9][.)]/.test(line)) {
      if (currentText) {
        blocks.push({
          type: 'P',
          content: currentText.trim()
        });
        currentText = '';
      }
      currentText = line;
      continue;
    }
    
    // Объединяем текст в параграфы
    if (line.length > 0) {
      // Если это продолжение списка - добавляем с новой строки
      if (currentText && /^[1-9][.)]/.test(currentText)) {
        currentText += '\n' + line;
      } else {
        currentText += ' ' + line;
      }
    }
  }
  
  // Добавляем последний блок текста
  if (currentText) {
    blocks.push({
      type: 'P',
      content: currentText.trim()
    });
  }
  
  return blocks;
}

export const pdfAPI = {
  async extractText(file: File): Promise<PDFResponse> {
    // Логируем информацию о файле
    console.log('PDF файл:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });

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
      console.log('Ответ сервера:', data);
      
      try {
        const decodedText = decodeUnicode(data.extracted_text);
        
        // Анализируем структуру текста
        const lines = decodedText.split('\n');
        console.log('Анализ структуры документа:', {
          totalLines: lines.length,
          linesByType: lines.map((line, index) => ({
            index,
            line,
            length: line.length,
            isTitle: isTitle(line),
            isFormula: isFormula(line),
            isTableOfContents: isTableOfContents(line),
            hasSpecialChars: {
              math: /[±∞∑∏∫√λπ\[\]\{\}\(\)]/.test(line),
              greek: /[αβγδεζηθικλμνξοπρστυφχψω]/i.test(line),
              subscripts: /[₀₁₂₃₄₅₆₇₈₉ᵢⱼₐₑₒₓₔₕₖₗₘₙₚₛₜ]/.test(line)
            },
            indent: line.match(/^\s*/)[0].length
          }))
        });
        
        const blocks = processTextToBlocks(decodedText);
        console.log('Итоговые блоки:', blocks);

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