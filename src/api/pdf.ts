import { docxToBlocks } from '@/utils/documentParser';
import { parseLatexToJson } from '@/utils/documentParser';
import { TArticleBlock } from '@/types/article';

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

// Функция для преобразования TArticleBlock в DocumentResponse['blocks']
function convertBlocks(blocks: TArticleBlock[]): DocumentResponse['blocks'] {
  return blocks.map(block => {
    if (block.type === 'IMAGE') {
      return {
        type: block.type,
        content: block.src || '',
        indent: block.indent
      };
    }
    return {
      type: block.type,
      content: block.content || '',
      isInline: 'inline' in block ? block.inline : undefined,
      indent: block.indent
    };
  });
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
  const blocks = parseLatexToJson(text);
  
  return {
    status: 'success',
    filename: file.name,
    blocks: convertBlocks(blocks)
  };
}

// Парсинг JSON файла
async function parseJSONFile(file: File): Promise<DocumentResponse> {
  const text = await file.text();
  const json = JSON.parse(text);
  
  // Проверяем структуру JSON
  if (!Array.isArray(json.blocks)) {
    throw new Error('Некорректный формат JSON: ожидается поле blocks');
  }
  
  // Валидируем каждый блок
  const blocks = json.blocks.map((block: any) => {
    if (!block.type || !block.content) {
      throw new Error('Некорректный формат блока: отсутствуют обязательные поля');
    }
    return block as DocumentResponse['blocks'][0];
  });
  
  return {
    status: 'success',
    filename: file.name,
    blocks
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