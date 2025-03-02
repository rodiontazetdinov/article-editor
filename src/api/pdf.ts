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

const VALID_BLOCK_TYPES = ['H1', 'H2', 'H3', 'P', 'FORMULA', 'IMAGE', 'CAPTION'];

// Функция для преобразования TArticleBlock в DocumentResponse['blocks']
function convertBlocks(blocks: TArticleBlock[]): DocumentResponse['blocks'] {
  return blocks.map(block => {
    switch (block.type) {
      case 'IMAGE':
        const imageBlock = block as IImageBlock;
        return {
          type: block.type,
          content: imageBlock.src || (imageBlock.images?.[0] ?? ''),
          images: imageBlock.images ?? [],
          indent: block.indent,
          variant: imageBlock.variant || '1'
        };
      case 'FORMULA':
        const formulaBlock = block as IFormulaBlock;
        return {
          type: formulaBlock.type,
          content: formulaBlock.content || '',
          isInline: formulaBlock.inline ?? false,
          indent: formulaBlock.indent
        };
      default:
        const textBlock = block as ITextBlock;
        return {
          type: textBlock.type,
          content: textBlock.originalHTML || textBlock.content || '',
          indent: textBlock.indent,
          listType: textBlock.listType
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
    // Специальная обработка списков
    if (block.type === 'P' && block.listType) {
      return {
        type: 'P',
        content: block.content || '',
        indent: typeof block.indent === 'number' ? block.indent : 0,
        listType: block.listType,
        originalHTML: block.content // Сохраняем оригинальный HTML
      };
    }

    if (!block.type || !VALID_BLOCK_TYPES.includes(block.type)) {
      throw new Error(`Некорректный тип блока: ${block.type}`);
    }
    
    // Преобразуем блок в нужный формат для DocumentResponse
    if (block.type === 'IMAGE') {
      return {
        type: block.type,
        content: block.src || block.images?.[0] || '',
        images: block.images || [],
        indent: typeof block.indent === 'number' ? block.indent : 0
      };
    }

    if (block.type === 'FORMULA') {
      return {
        type: block.type,
        content: block.content || block.source || '',
        isInline: block.inline ?? false,
        indent: typeof block.indent === 'number' ? block.indent : 0
      };
    }

    return {
      type: block.type,
      content: block.type === 'H1' || block.type === 'H2' || block.type === 'H3' || block.type === 'P' || block.type === 'CAPTION' 
        ? ('originalHTML' in block ? block.originalHTML : block.content)
        : block.content,
      isInline: block.type === 'FORMULA' ? ('inline' in block ? block.inline : false) : undefined,
      listType: block.type === 'P' ? block.listType : undefined,
      indent: block.indent || 0
    };
  });

  // Очищаем контент от HTML-мусора
  const cleanedBlocks = cleanArticleBlocks(validatedBlocks).map(block => {
    if (block.type === 'IMAGE' && 'src' in block) {
      return {
        type: block.type,
        content: block.src || '',
        images: block.images || [],
        indent: block.indent || 0
      };
    }
    if ('content' in block) {
      return {
        type: block.type,
        content: block.type === 'H1' || block.type === 'H2' || block.type === 'H3' || block.type === 'P' || block.type === 'CAPTION'
          ? (block as ITextBlock).originalHTML || block.content
          : block.content,
        isInline: block.type === 'FORMULA' ? ('inline' in block ? block.inline : false) : undefined,
        listType: block.type === 'P' ? block.listType : undefined,
        indent: block.indent || 0
      };
    }
    throw new Error(`Некорректный формат блока после очистки: ${(block as any).type ?? 'unknown'}`);
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