import { MathMLToLaTeX } from 'mathml-to-latex';
import mammoth from 'mammoth-plus';
import { TArticleBlock, IImageBlock, ITextBlock, IFormulaBlock } from '@/types/article';
import { convertMathMLToLaTeX } from './mathMLParser';
import { generateId } from '@/utils/helpers';

const mammothOptions = {
  styleMap: [
    "p[style-name='Section Title'] => h1:fresh",
    "p[style-name='Subsection Title'] => h2:fresh"
  ]
};

// Конвертация MathML в LaTeX
function getLatex(mathml: string): string {
  try {
    return convertMathMLToLaTeX(mathml);
  } catch (err) {
    console.error('Error converting MathML to LaTeX:', err);
    return mathml;
  }
}

// Рекурсивный поиск изображений в элементе
function findImages(element: Element): HTMLImageElement[] {
  const images: HTMLImageElement[] = [];
  
  // Если это img элемент, добавляем его
  if (element.tagName.toLowerCase() === 'img') {
    images.push(element as HTMLImageElement);
    return images;
  }
  
  // Рекурсивно ищем во всех дочерних элементах
  for (const child of Array.from(element.children)) {
    images.push(...findImages(child));
  }
  
  return images;
}

// Парсинг HTML в блоки
async function htmlToBlocks(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: TArticleBlock[] = [];

  try {
    // Проходим по всем элементам верхнего уровня
    const elements = Array.from(doc.body.children);
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const tagName = element.tagName.toLowerCase();

      // Обработка заголовков
      if (['h1', 'h2', 'h3'].includes(tagName)) {
        blocks.push({
          type: tagName.toUpperCase() as 'H1' | 'H2' | 'H3',
          content: element.innerHTML,
          indent: 0,
          modified: new Date().toISOString(),
          id: `${tagName}-${i}`
        });
        continue;
      }

      // Обработка изображений на верхнем уровне
      if (tagName === 'img') {
        const imgElement = element as HTMLImageElement;
        if (imgElement.src) {
          blocks.push({
            type: 'IMAGE',
            variant: '1',
            images: [],
            src: imgElement.src,
            content: '',
            indent: 0,
            modified: new Date().toISOString(),
            id: `img-${i}`
          });
        }
        continue;
      }

      // Обработка параграфов и формул
      if (tagName === 'p') {
        // Сначала ищем все изображения внутри параграфа
        const images = findImages(element);
        
        // Если есть изображения, разбиваем параграф на части
        if (images.length > 0) {
          let content = element.innerHTML;
          
          for (let j = 0; j < images.length; j++) {
            const img = images[j];
            const imgHtml = img.outerHTML;
            const parts = content.split(imgHtml);
            
            // Добавляем текст до изображения, если он есть
            if (parts[0].trim()) {
              blocks.push({
                type: 'P',
                content: parts[0].trim(),
                indent: 0,
                modified: new Date().toISOString(),
                id: `p-${i}-${j}`
              });
            }
            
            // Добавляем изображение как отдельный блок
            if (img.src) {
              blocks.push({
                type: 'IMAGE',
                variant: '1',
                images: [],
                src: img.src,
                content: '',
                indent: 0,
                modified: new Date().toISOString(),
                id: `img-${i}-${j}`
              });
            }
            
            // Обновляем контент для следующей итерации
            content = parts[1] || '';
          }
          
          // Добавляем оставшийся текст, если он есть
          if (content.trim()) {
            blocks.push({
              type: 'P',
              content: content.trim(),
              indent: 0,
              modified: new Date().toISOString(),
              id: `p-${i}-final`
            });
          }
        } else {
          // Если нет изображений, обрабатываем формулы как раньше
          const content = element.innerHTML;
          const mathRegex = /<math[^>]*>[\s\S]*?<\/math>/g;
          const mathMatches = content.match(mathRegex);

          if (mathMatches) {
            let processedContent = content;
            let hasBlockFormula = false;

            for (const mathMatch of mathMatches) {
              const isDisplayMath = mathMatch.includes('display="block"') || 
                                  mathMatch.includes('mode="display"') ||
                                  mathMatch.includes('class="formula-block"') ||
                                  mathMatch.includes('style="display:block"');

              if (isDisplayMath) {
                // Если это блочная формула, разбиваем текст на части
                const parts = processedContent.split(mathMatch);
                
                // Добавляем текст до формулы, если он есть
                if (parts[0].trim()) {
                  blocks.push({
                    type: 'P',
                    content: parts[0].trim(),
                    indent: 0,
                    modified: new Date().toISOString(),
                    id: `p-${i}-${blocks.length}`
                  });
                }

                // Получаем LaTeX формулы
                let latex = getLatex(mathMatch);
                
                // Проверяем наличие нескольких формул, разделенных \\
                const formulas = latex.split('\\\\').map(f => f.trim());
                
                for (const formula of formulas) {
                  if (formula) {
                    blocks.push({
                      type: 'FORMULA',
                      content: formula,
                      inline: false,
                      indent: 0,
                      modified: new Date().toISOString(),
                      id: generateId()
                    });
                  }
                }

                processedContent = parts[1] || '';
                hasBlockFormula = true;
              } else {
                // Если это инлайновая формула, заменяем её на LaTeX в тексте
                processedContent = processedContent.replace(mathMatch, `$${getLatex(mathMatch)}$`);
              }
            }

            // Добавляем оставшийся текст, если он есть
            if (processedContent.trim() && !hasBlockFormula) {
              blocks.push({
                type: 'P',
                content: processedContent.trim(),
                indent: 0,
                modified: new Date().toISOString(),
                id: `p-${i}-${blocks.length}`
              });
            }
          } else {
            // Обычный параграф без формул
            blocks.push({
              type: 'P',
              content: content,
              indent: 0,
              modified: new Date().toISOString(),
              id: `p-${i}`
            });
          }
        }
      }
    }

    return blocks;
  } catch (err) {
    console.error('Error parsing HTML:', err);
    throw new Error('Failed to parse document content: ' + (err instanceof Error ? err.message : String(err)));
  }
}

// Экспортируем функции
export async function docxToBlocks(arrayBuffer: ArrayBuffer) {
  try {
    const result = await mammoth.convertToHtml({ 
      arrayBuffer,
      ...mammothOptions
    });
    
    if (!result.value) {
      throw new Error('Empty document content');
    }

    return await htmlToBlocks(result.value);
  } catch (err) {
    console.error('Error converting DOCX:', err);
    throw new Error('Failed to process document: ' + (err instanceof Error ? err.message : String(err)));
  }
}

// Парсинг LaTeX в JSON
export function parseLatexToJson(latexContent: string) {
  const jsonArray: any[] = [];
  let currentContent = "";
  let insideLatexBlock = false;
  let insideEquationBlock = false;
  let equationLabel = "";

  const lines = latexContent.split("\n");
  
  for (let line of lines) {
    // Парсинг блочных формул ($$...$$)
    if (line.trim().startsWith("$$") && !insideLatexBlock) {
      if (currentContent.trim()) {
        jsonArray.push({ type: "P", content: currentContent.trim() });
      }
      insideLatexBlock = true;
      currentContent = "";
      continue;
    }

    if (line.trim().endsWith("$$") && insideLatexBlock) {
      insideLatexBlock = false;
      let latexContent = currentContent.trim();
      jsonArray.push({
        type: "FORMULA",
        source: "latex",
        content: latexContent,
        latex: latexContent,
      });
      currentContent = "";
      continue;
    }

    // Парсинг equation окружений
    if (line.trim().startsWith("\\begin{equation}")) {
      insideEquationBlock = true;
      const labelMatch = line.match(/\\label\{(.*?)\}/);
      equationLabel = labelMatch ? labelMatch[1] : "";
      continue;
    }

    if (line.trim().endsWith("\\end{equation}")) {
      insideEquationBlock = false;
      jsonArray.push({
        type: "FORMULA",
        source: "latex",
        content: currentContent.trim(),
        latex: currentContent.trim(),
        ref: equationLabel
      });
      currentContent = "";
      continue;
    }

    if (insideLatexBlock || insideEquationBlock) {
      currentContent += line.trim() + " ";
      continue;
    }

    // Парсинг inline формул ($...$)
    if (!insideLatexBlock && !insideEquationBlock) {
      let processedLine = line;
      const inlineMathRegex = /\$(.*?)\$/g;
      let match;
      
      while ((match = inlineMathRegex.exec(line)) !== null) {
        const latex = match[1];
        processedLine = processedLine.replace(
          match[0],
          `<span class="inline-formula" data-latex="${latex}">$${latex}$</span>`
        );
      }
      
      line = processedLine;
    }

    currentContent += line + "\n";
  }

  if (currentContent.trim()) {
    jsonArray.push({ type: "P", content: currentContent.trim() });
  }

  return jsonArray;
}

export interface FormulaBlock {
  type: "FORMULA";
  source: "latex" | "math";
  content: string;
  latex?: string;
  ref?: string;
}

export interface ParagraphBlock {
  type: "P";
  content: string;
} 