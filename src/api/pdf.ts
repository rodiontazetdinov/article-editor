import { docxToBlocks } from '@/utils/documentParser';
import { parseLatexToJson } from '@/utils/documentParser';
import { TexDocumentParser } from '@/utils/texParser';
import { TArticleBlock, IImageBlock, ITextBlock, IFormulaBlock } from '@/types/article';
import { cleanArticleBlocks } from '@/utils/contentCleaner';

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

// Функция для преобразования TArticleBlock в DocumentResponse['blocks']
function convertBlocks(blocks: TArticleBlock[]): DocumentResponse['blocks'] {
  return blocks.map(block => {
    switch (block.type) {
      case 'IMAGE':
        return {
          type: block.type,
          content: (block as IImageBlock).src || '',
          indent: block.indent
        };
      case 'FORMULA':
        const formulaBlock = block as IFormulaBlock;
        return {
          type: formulaBlock.type,
          content: formulaBlock.content || '',
          isInline: formulaBlock.inline,
          indent: formulaBlock.indent
        };
      default:
        const textBlock = block as ITextBlock;
        return {
          type: textBlock.type,
          content: textBlock.content || '',
          indent: textBlock.indent
        };
    }
  });
}

export const documentAPI = {
  async parseFile(file: File): Promise<DocumentResponse> {
    console.log('Отправка файла на парсинг:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });

    try {
      // Определяем тип файла по расширению
      const extension = file.name.split('.').pop()?.toLowerCase();

      switch (extension) {
        case 'pdf':
          return await parsePDFFile(file);
        case 'docx':
          return await parseDOCXFile(file);
        case 'tex':
          return await parseTeXFile(file);
        case 'json':
          return await parseJSONFile(file);
        default:
          throw new Error('Неподдерживаемый формат файла');
      }
    } catch (error) {
      console.error('Ошибка при парсинге файла:', error);
      throw error;
    }
  }
};

// Парсинг PDF через внешний сервис
async function parsePDFFile(file: File): Promise<DocumentResponse> {
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
  
  if (!result.extracted_text) {
    throw new Error('Некорректный формат ответа от сервиса');
  }

  const blocks = parseExtractedText(result.extracted_text);
  
  return {
    status: 'success',
    filename: file.name,
    blocks
  };
}

// Парсинг DOCX файла
async function parseDOCXFile(file: File): Promise<DocumentResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const blocks = await docxToBlocks(arrayBuffer);
  
  return {
    status: 'success',
    filename: file.name,
    blocks: convertBlocks(blocks)
  };
}

// Парсинг TeX файла
async function parseTeXFile(file: File): Promise<DocumentResponse> {
  const text = await file.text();
  const parser = new TexDocumentParser();
  const blocks = parser.parseTeX(text);
  
  return {
    status: 'success',
    filename: file.name,
    blocks: convertBlocks(blocks)
  };
}

// Парсинг JSON файла
async function parseJSONFile(file: File): Promise<DocumentResponse> {
  const text = await file.text();
  let json;
  
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error('Некорректный формат JSON');
  }
  
  // Если передан массив напрямую
  const blocks = Array.isArray(json) ? json : (json.blocks || []);
  
  // Валидируем каждый блок
  const validatedBlocks = blocks.map((block: any) => {
    if (!block.type || typeof block.type !== 'string') {
      throw new Error('Некорректный формат блока: отсутствует или неверный тип');
    }
    
    if (!block.content && block.type !== 'IMAGE') {
      throw new Error('Некорректный формат блока: отсутствует содержимое');
    }
    
    // Проверяем тип блока
    if (!['H1', 'H2', 'H3', 'P', 'FORMULA', 'IMAGE', 'CAPTION'].includes(block.type)) {
      throw new Error(`Неподдерживаемый тип блока: ${block.type}`);
    }
    
    // Преобразуем блок в нужный формат для DocumentResponse
    if (block.type === 'IMAGE') {
      return {
        type: block.type,
        content: block.src || '',
        indent: block.indent || 0
      };
    }

    if (block.type === 'FORMULA') {
      return {
        type: block.type,
        content: block.content || '',
        isInline: block.isInline || false,
        indent: block.indent || 0
      };
    }

    return {
      type: block.type,
      content: block.content || '',
      indent: block.indent || 0
    };
  });

  // Очищаем контент от HTML-мусора
  const cleanedBlocks = cleanArticleBlocks(validatedBlocks).map(block => {
    if (block.type === 'IMAGE' && 'src' in block) {
      return {
        type: block.type,
        content: block.src,
        indent: block.indent || 0
      };
    }
    if ('content' in block) {
      return {
        type: block.type,
        content: block.content,
        isInline: block.type === 'FORMULA' ? ('inline' in block ? block.inline : false) : undefined,
        indent: block.indent || 0
      };
    }
    throw new Error(`Некорректный формат блока после очистки: ${block.type}`);
  });
  
  return {
    status: 'success',
    filename: file.name,
    blocks: cleanedBlocks
  };
}

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