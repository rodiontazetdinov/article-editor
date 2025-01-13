import * as pdfjsLib from 'pdfjs-dist';

// Инициализация PDF.js
let isInitialized = false;

async function initPDFJS() {
  if (isInitialized) return;
  
  if (typeof window !== 'undefined') {
    try {
      // Пробуем использовать встроенный worker
      const worker = new pdfjsLib.PDFWorker();
      pdfjsLib.GlobalWorkerOptions.workerPort = worker.port;
    } catch (e) {
      console.warn('Не удалось создать worker, используем fallback режим');
      // Если не получилось, используем fake worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
    isInitialized = true;
  }
}

interface PDFResponse {
  blocks: Array<{
    type: 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
    content: string;
    isInline?: boolean;
    indent?: number;
  }>;
}

// Интерфейсы для работы с PDF.js
interface PDFTextItem {
  str: string;      
  transform: number[]; 
  fontName: string; 
  fontSize: number; 
  width: number;    
}

interface PDFPageData {
  items: PDFTextItem[];
  pageNumber: number;
}

// Эвристики для определения типов блоков
const isTitle = (item: PDFTextItem, isFirstPage: boolean, yPosition: number): boolean => {
  return isFirstPage && 
         yPosition < 200 && 
         item.fontSize > 14 && 
         item.str.length > 3;
};

const isHeader = (item: PDFTextItem, prevItem?: PDFTextItem): boolean => {
  return item.fontSize > 12 && 
         (!prevItem || item.fontSize > prevItem.fontSize);
};

const isFormula = (item: PDFTextItem): boolean => {
  const formulaSymbols = /[∫∑∏√∂∆∇⊂⊃∈∉±×÷=≠≈≤≥∞∝∟∠∡∢∣∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿≀≁≂≃≄≅≆≇≈≉≊≋≌≍≎≏≐≑≒≓≔≕≖≗≘≙≚≛≜≝≞≟≠≡≢≣≤≥≦≧≨≩]/;
  const greekLetters = /[αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]/;
  
  return formulaSymbols.test(item.str) || 
         greekLetters.test(item.str) ||
         item.str.includes('\\') || // LaTeX команды
         /[_^]/.test(item.str);    // Индексы и степени
};

// Функция для группировки элементов в строки
function groupIntoLines(items: PDFTextItem[]): PDFTextItem[][] {
  const lines: PDFTextItem[][] = [];
  let currentLine: PDFTextItem[] = [];
  let lastY: number | null = null;
  const Y_THRESHOLD = 5; // Допустимая разница в Y-координатах для одной строки

  // Сортируем элементы по Y (сверху вниз), затем по X (слева направо)
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = -a.transform[5] + b.transform[5];
    return yDiff !== 0 ? yDiff : a.transform[4] - b.transform[4];
  });

  for (const item of sortedItems) {
    const currentY = -item.transform[5];
    
    if (lastY === null || Math.abs(currentY - lastY) <= Y_THRESHOLD) {
      currentLine.push(item);
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [item];
    }
    
    lastY = currentY;
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

// Функция для определения типа блока
function determineBlockType(line: PDFTextItem[], pageNumber: number, yPosition: number): PDFResponse['blocks'][0] {
  const text = line.map(item => item.str).join(' ');
  const isFirstPage = pageNumber === 1;
  const firstItem = line[0];
  
  // Определяем тип блока на основе эвристик
  if (isTitle(firstItem, isFirstPage, yPosition)) {
    return { type: 'H1', content: text };
  }
  
  if (isHeader(firstItem)) {
    return { type: 'H2', content: text };
  }
  
  if (line.some(item => isFormula(item))) {
    const isInline = line.length > 1 && !text.includes('\\begin{equation}');
    return { type: 'FORMULA', content: text, isInline };
  }
  
  // Определяем отступ для параграфа
  const indent = Math.round(firstItem.transform[4] / 10) * 10;
  return { type: 'P', content: text, indent };
}

// Основная функция парсинга PDF
async function parsePDFContent(file: File): Promise<PDFPageData[]> {
  // Инициализируем PDF.js перед использованием
  await initPDFJS();
  
  const data = await file.arrayBuffer();
  
  const pdf = await pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true
  }).promise;

  const pages: PDFPageData[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Преобразуем элементы к нужному типу
    const items = (textContent.items as any[])
      .filter(item => item.str && item.transform)
      .map(item => ({
        str: String(item.str),
        transform: Array.isArray(item.transform) ? item.transform : [],
        fontName: String(item.fontName || 'unknown'),
        fontSize: Number(item.fontSize) || 12,
        width: Number(item.width) || 0
      }));
    
    const pageData: PDFPageData = {
      items,
      pageNumber: i
    };
    
    pages.push(pageData);
    
    // Логируем информацию о странице для отладки
    console.log(`Страница ${i}:`, {
      itemsCount: pageData.items.length,
      fonts: [...new Set(pageData.items.map(item => item.fontName))],
      fontSizes: [...new Set(pageData.items.map(item => item.fontSize))],
      sampleItems: pageData.items.slice(0, 5).map(item => ({
        text: item.str,
        coords: { x: item.transform[4], y: -item.transform[5] },
        fontSize: item.fontSize,
        font: item.fontName
      }))
    });
  }

  return pages;
}

export const pdfAPI = {
  async extractText(file: File): Promise<PDFResponse> {
    console.log('PDF файл:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });

    try {
      const pages = await parsePDFContent(file);
      const blocks: PDFResponse['blocks'] = [];
      
      for (const page of pages) {
        const lines = groupIntoLines(page.items);
        
        for (const line of lines) {
          const yPosition = -line[0].transform[5];
          const block = determineBlockType(line, page.pageNumber, yPosition);
          blocks.push(block);
        }
      }
      
      console.log('Структура PDF:', {
        totalPages: pages.length,
        totalBlocks: blocks.length,
        blockTypes: blocks.map(b => b.type)
      });

      return { blocks };
      
    } catch (error) {
      console.error('Ошибка при обработке PDF:', error);
      throw error;
    }
  }
}; 