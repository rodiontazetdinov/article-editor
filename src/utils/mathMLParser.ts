// Типы для промежуточного представления формулы
interface MathNode {
  type: 'operator' | 'number' | 'variable' | 'group' | 'subscript' | 'superscript' | 'decoration' | 'function';
  value: string;
  children: MathNode[];
  attributes?: {
    position?: 'super' | 'sub';
    decoration?: 'overline' | 'dot';
    fence?: 'left' | 'right';
    fenceType?: '(' | '[' | '{' | '|';
  };
}

// Парсинг MathML в промежуточное представление
function parseMathMLElement(element: Element): MathNode {
  const tagName = element.tagName.toLowerCase();
  
  switch (tagName) {
    case 'mi': // Идентификатор (переменная)
      return {
        type: 'variable',
        value: element.textContent || '',
        children: []
      };
      
    case 'mn': // Число
      return {
        type: 'number',
        value: element.textContent || '',
        children: []
      };
      
    case 'mo': // Оператор
      return {
        type: 'operator',
        value: element.textContent || '',
        children: []
      };
      
    case 'mfenced': // Скобки
      const open = element.getAttribute('open') || '(';
      const close = element.getAttribute('close') || ')';
      const children = Array.from(element.children).map(parseMathMLElement);
      
      return {
        type: 'group',
        value: 'fenced',
        children: [
          { type: 'operator', value: open, children: [], attributes: { fence: 'left', fenceType: open as any } },
          ...children,
          { type: 'operator', value: close, children: [], attributes: { fence: 'right', fenceType: close as any } }
        ]
      };
      
    case 'msub': // Нижний индекс
      const [baseElement, subElement] = element.children;
      return {
        type: 'subscript',
        value: '',
        children: [
          parseMathMLElement(baseElement),
          { ...parseMathMLElement(subElement), attributes: { position: 'sub' } }
        ]
      };
      
    case 'msup': // Верхний индекс
      const [baseSup, supElement] = element.children;
      return {
        type: 'superscript',
        value: '',
        children: [
          parseMathMLElement(baseSup),
          { ...parseMathMLElement(supElement), attributes: { position: 'super' } }
        ]
      };
      
    case 'mover': // Надчеркивание/точка
      const [baseOver, overElement] = element.children;
      const overText = overElement.textContent || '';
      const decoration = overText === '‾' ? 'overline' : overText === '˙' ? 'dot' : undefined;
      
      return {
        type: 'decoration',
        value: decoration || '',
        children: [parseMathMLElement(baseOver)]
      };
      
    case 'mrow': // Группа элементов
      return {
        type: 'group',
        value: 'row',
        children: Array.from(element.children).map(parseMathMLElement)
      };
      
    default:
      console.warn(`Неизвестный тег MathML: ${tagName}`);
      return {
        type: 'group',
        value: 'unknown',
        children: Array.from(element.children).map(parseMathMLElement)
      };
  }
}

// Генерация LaTeX из промежуточного представления
function generateLaTeX(node: MathNode): string {
  switch (node.type) {
    case 'variable':
      // Преобразуем греческие буквы
      const greekLetters: { [key: string]: string } = {
        'α': '\\alpha',
        'β': '\\beta',
        'θ': '\\theta',
        'μ': '\\mu',
        'σ': '\\sigma'
      };
      return greekLetters[node.value] || node.value;
      
    case 'number':
      return node.value;
      
    case 'operator':
      if (node.attributes?.fence) {
        return node.attributes.fence === 'left' ? '\\left' + node.value : '\\right' + node.value;
      }
      return node.value;
      
    case 'group':
      return node.children.map(generateLaTeX).join(' ');
      
    case 'subscript':
      return `${generateLaTeX(node.children[0])}_{${generateLaTeX(node.children[1])}}`;
      
    case 'superscript':
      return `${generateLaTeX(node.children[0])}^{${generateLaTeX(node.children[1])}}`;
      
    case 'decoration':
      const base = generateLaTeX(node.children[0]);
      switch (node.value) {
        case 'overline':
          return `\\overset{\\overline}{${base}}`;
        case 'dot':
          return `\\overset{\\cdot}{${base}}`;
        default:
          return base;
      }
      
    default:
      return node.children.map(generateLaTeX).join(' ');
  }
}

// Основная функция конвертации
export function convertMathMLToLaTeX(mathml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(mathml, 'text/xml');
  const mathElement = doc.querySelector('math');
  
  if (!mathElement) {
    console.error('Не найден элемент math');
    return mathml;
  }
  
  // Проверяем наличие mtable
  const hasMtable = mathElement.querySelector('mtable') !== null;
  
  if (hasMtable) {
    const rows = Array.from(mathElement.querySelectorAll('mtr'));
    const formulas = rows.map(row => {
      const mtd = row.querySelector('mtd');
      if (!mtd) return '';
      
      const mathNode = parseMathMLElement(mtd);
      return generateLaTeX(mathNode);
    });
    
    return formulas.filter(f => f).join(' \\\\ ');
  }
  
  const mathNode = parseMathMLElement(mathElement);
  return generateLaTeX(mathNode);
} 