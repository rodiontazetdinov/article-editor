import { Node as ProsemirrorNode } from 'prosemirror-model';

// Простой конвертер OMML в LaTeX
export const ommlToLatex = (ommlContent: string): string[] => {
  try {
    // Удаляем namespace и атрибуты
    let latex = ommlContent
      .replace(/xmlns[^"]*"[^"]*"/g, '')
      .replace(/<m:oMathPara[^>]*>(.*?)<\/m:oMathPara>/gs, '$1')
      .replace(/<m:oMath[^>]*>(.*?)<\/m:oMath>/gs, '$1');

    // Конвертация базовых элементов
    latex = latex
      // Дроби
      .replace(/<m:f>(.*?)<\/m:f>/gs, (_, content) => {
        const num = content.match(/<m:num>(.*?)<\/m:num>/s)?.[1] || '';
        const den = content.match(/<m:den>(.*?)<\/m:den>/s)?.[1] || '';
        return `\\frac{${processLatexPart(num)}}{${processLatexPart(den)}}`;
      })
      // Верхние и нижние индексы
      .replace(/<m:sup>(.*?)<\/m:sup>/gs, '^{$1}')
      .replace(/<m:sub>(.*?)<\/m:sub>/gs, '_{$1}')
      // Текст и операторы
      .replace(/<m:r[^>]*><m:t>(.*?)<\/m:t><\/m:r>/gs, '$1')
      // Группировка
      .replace(/<m:d>(.*?)<\/m:d>/gs, '{$1}')
      // Корни
      .replace(/<m:rad>(.*?)<\/m:rad>/gs, '\\sqrt{$1}')
      // Интегралы
      .replace(/<m:nary>(.*?)<\/m:nary>/gs, (match) => {
        if (match.includes('∫')) return '\\int';
        if (match.includes('∑')) return '\\sum';
        if (match.includes('∏')) return '\\prod';
        return match;
      })
      // Скобки
      .replace(/\(\)/g, '\\left(\\right)')
      .replace(/\[\]/g, '\\left[\\right]');

    // Очистка от оставшихся XML тегов
    latex = latex.replace(/<[^>]+>/g, '');
    
    // Нормализация и разделение на отдельные формулы
    const normalizedLatex = normalizeLatex(latex);
    return splitFormulas(normalizedLatex);
  } catch (error) {
    console.error('Ошибка конвертации OMML в LaTeX:', error);
    return [];
  }
};

// Нормализация LaTeX
const normalizeLatex = (latex: string): string => {
  return latex
    .replace(/\s+/g, ' ')
    .trim()
    // Составные команды и операторы
    .replace(/\\theta\s*Q/g, '\\theta Q')
    .replace(/\\theta\s*P/g, '\\theta P')
    .replace(/\\phi\s*x/g, '\\phi x')
    .replace(/\\partial\s*x/g, '\\partial x')
    .replace(/\\sigma\s*_?{\s*\\mu\s*}/g, '\\sigma_\\mu')
    .replace(/exp\s*i/g, '\\exp(i')
    .replace(/Q\s*\\theta/g, 'Q\\theta')
    .replace(/\\partial\s*_?{\s*\\mu\s*}/g, '\\partial_\\mu')
    .replace(/\\partial\s*_?{\s*x\s*}/g, '\\partial_x')
    .replace(/\\partial\s*x\s*\\mu/g, '\\partial x_\\mu')
    .replace(/\\theta\s*\\sigma/g, '\\theta\\sigma')
    // Исправление специальных символов и команд
    .replace(/θ/g, '\\theta')
    .replace(/α/g, '\\alpha')
    .replace(/β/g, '\\beta')
    .replace(/γ/g, '\\gamma')
    .replace(/δ/g, '\\delta')
    .replace(/ε/g, '\\epsilon')
    .replace(/λ/g, '\\lambda')
    .replace(/μ/g, '\\mu')
    .replace(/π/g, '\\pi')
    .replace(/σ/g, '\\sigma')
    .replace(/τ/g, '\\tau')
    .replace(/φ/g, '\\phi')
    .replace(/ψ/g, '\\psi')
    .replace(/ω/g, '\\omega')
    .replace(/→/g, '\\rightarrow')
    .replace(/←/g, '\\leftarrow')
    .replace(/↔/g, '\\leftrightarrow')
    .replace(/≤/g, '\\leq')
    .replace(/≥/g, '\\geq')
    .replace(/≠/g, '\\neq')
    .replace(/±/g, '\\pm')
    .replace(/∂/g, '\\partial')
    // Форматирование скобок и пробелов
    .replace(/\{/g, '{')
    .replace(/\}/g, '}')
    .replace(/,\s*/g, ',')
    .replace(/\s*=\s*/g, '=')
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s*-\s*/g, '-')
    // Исправление индексов
    .replace(/_([a-zA-Z])(\s|$)/g, '_{$1}$2')
    .replace(/\^([a-zA-Z])(\s|$)/g, '^{$1}$2')
    // Добавление пробелов после запятых в списках параметров
    .replace(/,([^\s])/g, ', $1')
    // Исправление составных выражений с пробелами
    .replace(/\\theta\s*Q/g, '\\theta Q')
    .replace(/\\theta\s*P/g, '\\theta P')
    .replace(/\\partial\s*x/g, '\\partial x')
    // Финальная очистка множественных пробелов
    .replace(/\s+/g, ' ');
};

// Разделение на отдельные формулы
const splitFormulas = (latex: string): string[] => {
  // Разделяем по номерам уравнений или запятым между формулами
  return latex
    .split(/[,#]?\s*\([0-9.]+\)\s*,?/)
    .map(formula => formula.trim())
    .filter(formula => formula.length > 0);
};

// Обработка части LaTeX формулы
const processLatexPart = (part: string): string => {
  let result = part
    .replace(/<m:r[^>]*><m:t>(.*?)<\/m:t><\/m:r>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Обработка составных выражений
  result = result
    // Операторы
    .replace(/\\theta\s*Q/g, '\\theta Q')
    .replace(/\\theta\s*P/g, '\\theta P')
    .replace(/Q\s*\\theta/g, 'Q\\theta')
    .replace(/\\phi\s*x/g, '\\phi x')
    .replace(/\\partial\s*x/g, '\\partial x')
    // Индексы
    .replace(/([a-zA-Z])_([a-zA-Z])/g, '$1_{$2}')
    .replace(/([a-zA-Z])\^([a-zA-Z])/g, '$1^{$2}')
    // Функции
    .replace(/exp\s*i/g, '\\exp(i')
    .replace(/\\exp\s*i/g, '\\exp(i')
    // Скобки
    .replace(/\{/g, '{')
    .replace(/\}/g, '}')
    // Дополнительная обработка составных выражений
    .replace(/\\partial\s*_?{\s*\\mu\s*}/g, '\\partial_\\mu')
    .replace(/\\partial\s*_?{\s*x\s*}/g, '\\partial_x')
    .replace(/\\partial\s*x\s*\\mu/g, '\\partial x_\\mu')
    .replace(/\\theta\s*\\sigma/g, '\\theta\\sigma');

  return result;
};

// Проверка является ли элемент математической формулой
export const isMathElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'm:omath' || tagName === 'm:omathpara';
};

// Извлечение формул из HTML
export const extractFormulas = (html: string): { latex: string; inline: boolean }[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const formulas: { latex: string; inline: boolean }[] = [];

  // Поиск всех математических выражений
  const mathElements = doc.querySelectorAll('m\\:oMath, m\\:oMathPara');
  
  mathElements.forEach((element) => {
    const isInline = element.tagName.toLowerCase() === 'm:omath';
    const latexFormulas = ommlToLatex(element.outerHTML);
    
    latexFormulas.forEach(latex => {
      if (latex) {
        formulas.push({
          latex,
          inline: isInline
        });
      }
    });
  });

  return formulas;
};

// Проверка валидности LaTeX
export const isValidLatex = (latex: string): boolean => {
  try {
    if (!latex || latex.trim().length === 0) return false;

    // Базовая проверка на парные скобки и команды
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
    
    return stack.length === 0 && latex.includes('\\');
  } catch (error) {
    return false;
  }
}; 