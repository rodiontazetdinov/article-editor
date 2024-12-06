import { useState } from 'react';
import mammoth from 'mammoth';
import { TArticleBlock } from '@/types/article';
import { nanoid } from 'nanoid';

interface ImportDocumentProps {
  onImport: (blocks: TArticleBlock[]) => void;
}

// Функция для определения MIME-типа по расширению или содержимому
const getMimeType = (buffer: Buffer): string => {
  // Проверяем сигнатуру файла
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return 'image/png';
  }
  return 'image/jpeg'; // По умолчанию считаем JPEG
};

export const ImportDocument = ({ onImport }: ImportDocumentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const convertToBlocks = async (html: string): Promise<TArticleBlock[]> => {
    console.log('Raw HTML from mammoth:', html);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: TArticleBlock[] = [];
    const now = new Date().toISOString();

    // Проходим по всем элементам и конвертируем их в блоки
    const elements = doc.body.children;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      console.log('Processing element:', {
        tagName: element.tagName,
        innerHTML: element.innerHTML.substring(0, 100),
        isImage: element.tagName.toLowerCase() === 'img',
      });

      const baseBlock = {
        id: nanoid(10),
        indent: 0,
        modified: now,
      };

      // Проверяем, есть ли изображение в элементе
      const img = element.tagName.toLowerCase() === 'img' ? element : element.querySelector('img');
      if (img) {
        const src = (img as HTMLImageElement).src;
        if (src && src.startsWith('data:')) {
          // Извлекаем base64 и конвертируем в правильный формат
          const match = src.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const [, mimeType, base64] = match;
            const buffer = Buffer.from(base64, 'base64');
            const correctMimeType = getMimeType(buffer);
            const correctSrc = `data:${correctMimeType};base64,${base64}`;
            
            blocks.push({
              ...baseBlock,
              type: 'IMAGE',
              variant: '1',
              images: [],
              src: correctSrc,
            });
            continue;
          }
        }
      }

      // Обработка текстовых блоков
      switch (element.tagName.toLowerCase()) {
        case 'h1':
          blocks.push({
            ...baseBlock,
            type: 'H1',
            content: element.innerHTML,
          });
          break;
        case 'h2':
          blocks.push({
            ...baseBlock,
            type: 'H2',
            content: element.innerHTML,
          });
          break;
        case 'h3':
          blocks.push({
            ...baseBlock,
            type: 'H3',
            content: element.innerHTML,
          });
          break;
        case 'p':
          if (!element.querySelector('img')) {
            blocks.push({
              ...baseBlock,
              type: 'P',
              content: element.innerHTML,
            });
          }
          break;
        default:
          console.log('Unhandled element type:', element.tagName);
      }
    }

    return blocks;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.convertToHtml({ 
        arrayBuffer,
        convertImage: ({ contentType, buffer }) => {
          console.log('Converting image:', { contentType, bufferLength: buffer.length });
          const correctMimeType = getMimeType(buffer);
          const base64 = Buffer.from(buffer).toString('base64');
          const src = `data:${correctMimeType};base64,${base64}`;
          console.log('Converted image to:', { mimeType: correctMimeType, previewSrc: src.substring(0, 100) + '...' });
          return Promise.resolve({ src });
        },
      });

      console.log('Mammoth conversion result:', {
        value: result.value.substring(0, 200) + '...',
        messages: result.messages
      });

      const blocks = await convertToBlocks(result.value);
      onImport(blocks);
    } catch (error) {
      console.error('Error importing document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".docx"
        onChange={handleFileUpload}
        className="hidden"
        id="docx-upload"
      />
      <label
        htmlFor="docx-upload"
        className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Импорт...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Импортировать Word документ</span>
          </>
        )}
      </label>
    </div>
  );
}; 