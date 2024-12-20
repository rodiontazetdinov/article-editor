import { MathMLToLaTeX } from 'mathml-to-latex';
import mammoth from 'mammoth-plus';
import { TArticleBlock } from '@/types/article';

const mammothOptions = {
  styleMap: [
    "p[style-name='Section Title'] => h1:fresh",
    "p[style-name='Subsection Title'] => h2:fresh"
  ]
};

// Конвертация MathML в LaTeX
function getLatex(math: string): string {
  try {
    const toLatex = MathMLToLaTeX.convert;
    return toLatex(math).replaceAll("^{''}", "^{''}");
  } catch (err) {
    console.error('Error converting MathML to LaTeX:', err);
    return math;
  }
}

// Парсинг DOCX документов
export async function docxToBlocks(arrayBuffer: ArrayBuffer) {
  try {
    const result = await mammoth.convertToHtml({ 
      arrayBuffer,
      ...mammothOptions
    });
    
    console.log('Mammoth conversion result:', {
      value: result.value.substring(0, 200),
      messages: result.messages
    });

    // Проверяем наличие контента
    if (!result.value) {
      throw new Error('Empty document content');
    }

    const blocks = await htmlToBlocks(result.value);
    
    // Проверяем результат
    if (!blocks || blocks.length === 0) {
      console.warn('No blocks were extracted from the document');
    }

    return blocks;
  } catch (err) {
    console.error('Error converting DOCX:', err);
    throw new Error('Failed to process document: ' + (err instanceof Error ? err.message : String(err)));
  }
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

      // Обработка изображений
      if (tagName === 'img') {
        const imgElement = element as HTMLImageElement;
        if (imgElement.src) {
          blocks.push({
            type: 'IMAGE',
            variant: '1',
            images: [],
            src: imgElement.src,
            indent: 0,
            modified: new Date().toISOString(),
            id: `img-${i}`
          });
        }
        continue;
      }

      // Обработка параграфов и формул
      if (tagName === 'p') {
        const mathElements = Array.from(element.getElementsByTagName('*'))
          .filter(el => 
            el.tagName.startsWith('m:') || 
            (el.namespaceURI && el.namespaceURI.includes('math'))
          );

        // Если есть формулы
        if (mathElements.length > 0) {
          for (const mathElement of mathElements) {
            // Проверяем, что это корневой элемент формулы
            if (!mathElements.some(other => other !== mathElement && other.contains(mathElement))) {
              try {
                const latex = getLatex(mathElement.outerHTML);
                blocks.push({
                  type: 'FORMULA',
                  source: 'latex',
                  content: latex,
                  indent: 0,
                  modified: new Date().toISOString(),
                  id: `formula-${i}-${blocks.length}`
                });
              } catch (err) {
                console.error('Error processing formula:', err);
              }
            }
          }
        } else {
          // Обычный параграф
          blocks.push({
            type: 'P',
            content: element.innerHTML,
            indent: 0,
            modified: new Date().toISOString(),
            id: `p-${i}`
          });
        }
      }
    }

    return blocks;
  } catch (err) {
    console.error('Error parsing HTML:', err);
    throw new Error('Failed to parse document content: ' + (err instanceof Error ? err.message : String(err)));
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