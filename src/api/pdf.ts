interface DocumentResponse {
  status: 'success';
  filename: string;
  blocks: Array<{
    type: 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
    content: string;
    isInline?: boolean;
    indent?: number;
  }>;
}

const PARSER_URL = 'https://service-pdf.teach-in.ru';

export const documentAPI = {
  async parseFile(file: File): Promise<DocumentResponse> {
    console.log('Отправка файла на парсинг:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${PARSER_URL}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сервиса (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Проверяем структуру ответа
      if (!result.extracted_text) {
        throw new Error('Некорректный формат ответа от сервиса');
      }

      // Преобразуем ответ в наш формат
      const blocks = parseExtractedText(result.extracted_text);
      
      console.log('Результат парсинга:', {
        filename: file.name,
        totalBlocks: blocks.length,
        blockTypes: blocks.map(b => b.type)
      });

      return {
        status: 'success',
        filename: file.name,
        blocks
      };
      
    } catch (error) {
      console.error('Ошибка при парсинге файла:', error);
      throw error;
    }
  }
};

// Функция для преобразования извлеченного текста в блоки
function parseExtractedText(text: string) {
  const lines = text.split('\n');
  const blocks: DocumentResponse['blocks'] = [];
  
  let currentBlock: typeof blocks[0] | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Определяем тип блока по содержимому
    if (trimmedLine.startsWith('# ')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'H1', content: trimmedLine.slice(2), indent: 0 };
    } else if (trimmedLine.startsWith('## ')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'H2', content: trimmedLine.slice(3), indent: 0 };
    } else if (trimmedLine.startsWith('### ')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'H3', content: trimmedLine.slice(4), indent: 0 };
    } else if (trimmedLine.match(/^\$\$[\s\S]*\$\$/)) {
      // Блок с формулой
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { 
        type: 'FORMULA', 
        content: trimmedLine.slice(2, -2).trim(),
        isInline: false
      };
    } else {
      // Обычный параграф
      if (!currentBlock) {
        currentBlock = { type: 'P', content: trimmedLine, indent: 0 };
      } else if (currentBlock.type === 'P') {
        currentBlock.content += ' ' + trimmedLine;
      } else {
        blocks.push(currentBlock);
        currentBlock = { type: 'P', content: trimmedLine, indent: 0 };
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
} 