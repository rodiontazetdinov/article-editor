import { MathMLToLaTeX } from 'mathml-to-latex';

// Типы для математических блоков
export interface IMathBlock {
  type: 'inline' | 'block' | 'equation';
  content: string;
  label?: string;
}

// Общий интерфейс для парсеров
export interface IMathParser {
  parseFormula(content: string): IMathBlock;
  validateLatex(latex: string): boolean;
}

// Базовый класс для обработки математических выражений
export class BaseMathParser implements IMathParser {
  protected preprocessLatex(latex: string): string {
    return latex
      // Исправляем пробелы в командах
      .replace(/\\left\s*{/g, '\\left\\{')
      .replace(/\\right\s*}/g, '\\right\\}')
      .replace(/\\left\s*\(/g, '\\left(')
      .replace(/\\right\s*\)/g, '\\right)')
      .replace(/\\left\s*\[/g, '\\left[')
      .replace(/\\right\s*\]/g, '\\right]')
      // Исправляем overset
      .replace(/\\overset\s*{/g, '\\overset{')
      .replace(/\\overset\s*{\\overline}/g, '\\overline')
      .replace(/\\overset\s*{\\cdot}/g, '\\dot')
      // Исправляем exp
      .replace(/exp\s*⁡/g, '\\exp')
      // Исправляем греческие буквы
      .replace(/\\alpha\s+\\overset/g, '\\alpha\\overset')
      .replace(/\\beta\s+\\right/g, '\\beta\\right')
      .replace(/\\sigma\s+\\alpha/g, '\\sigma\\alpha')
      // Исправляем множественные пробелы
      .replace(/\s+/g, ' ')
      .trim();
  }

  parseFormula(content: string): IMathBlock {
    const preprocessed = this.preprocessLatex(content);
    
    // Определяем тип формулы
    if (content.startsWith('\\begin{equation}')) {
      const label = content.match(/\\label{(.*?)}/)?.[1];
      return {
        type: 'equation',
        content: preprocessed,
        label
      };
    } else if (content.startsWith('$$') || content.match(/^\\\[.*\\\]$/)) {
      return {
        type: 'block',
        content: preprocessed
      };
    } else {
      return {
        type: 'inline',
        content: preprocessed
      };
    }
  }

  validateLatex(latex: string): boolean {
    try {
      if (!latex || latex.trim().length === 0) return false;

      // Проверка парных скобок и команд
      const bracketPairs: { [key: string]: string } = {
        '{': '}',
        '[': ']',
        '(': ')'
      };
      
      const stack: string[] = [];
      
      for (const char of latex) {
        if ('{[('.includes(char)) {
          stack.push(char);
        } else if ('}])'.includes(char)) {
          const last = stack.pop();
          if (!last || bracketPairs[last] !== char) {
            return false;
          }
        }
      }
      
      // Проверка базовых LaTeX команд
      const hasValidCommands = latex.includes('\\') && 
        !latex.match(/\\[^a-zA-Z{}\[\]()]/);
      
      return stack.length === 0 && hasValidCommands;
    } catch (error) {
      return false;
    }
  }
}

// Парсер для MathML
export class MathMLParser extends BaseMathParser {
  parseFormula(mathml: string): IMathBlock {
    try {
      const latex = MathMLToLaTeX.convert(mathml);
      return super.parseFormula(latex);
    } catch (error) {
      console.error('Error parsing MathML:', error);
      return {
        type: 'inline',
        content: mathml
      };
    }
  }
}

// Парсер для TeX
export class TeXParser extends BaseMathParser {
  parseFormula(tex: string): IMathBlock {
    // Удаляем комментарии
    const cleanTex = tex.replace(/%.*$/gm, '').trim();
    return super.parseFormula(cleanTex);
  }

  // Дополнительная валидация для TeX
  validateLatex(latex: string): boolean {
    if (!super.validateLatex(latex)) return false;

    // Проверка специфичных для TeX конструкций
    const texSpecific = [
      /\\begin{.*?}.*?\\end{.*?}/s,
      /\$\$.*?\$\$/s,
      /\$.*?\$/g,
      /\\[.*?\\]/s
    ];

    return texSpecific.some(pattern => latex.match(pattern));
  }
} 