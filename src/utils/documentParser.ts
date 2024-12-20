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
function getLatex(mathml: string): string {
  try {
    // Создаем временный div для парсинга HTML
    const div = document.createElement('div');
    div.innerHTML = mathml;
    
    // Находим элемент math
    const mathElement = div.querySelector('math');
    if (!mathElement) {
      console.error('No math element found in:', mathml);
      return mathml;
    }

    // Преобразуем в LaTeX
    const latex = MathMLToLaTeX.convert(mathElement.outerHTML);
    return latex
      .replace(/\\text{⇒}/g, '\\Rightarrow')
      .replace(/\\text{λ}/g, '\\lambda')
      .replace(/\\text{ς}/g, '\\varsigma')
      .replace(/\\text{σ}/g, '\\sigma')
      .replace(/\\text{β}/g, '\\beta')
      .replace(/\\text{α}/g, '\\alpha')
      .replace(/\\text{μ}/g, '\\mu')
      .replace(/\\nbsp/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (err) {
    console.error('Error converting MathML to LaTeX:', err);
    return mathml;
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

            const latex = getLatex(mathMatch);

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

              // Добавляем формулу как отдельный блок
              blocks.push({
                type: 'FORMULA',
                source: 'latex',
                content: latex,
                inline: false,
                indent: 0,
                modified: new Date().toISOString(),
                id: `formula-${i}-${blocks.length}`
              });

              processedContent = parts[1] || '';
              hasBlockFormula = true;
            } else {
              // Если это инлайновая формула, заменяем её на LaTeX в тексте
              processedContent = processedContent.replace(mathMatch, `$${latex}$`);
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