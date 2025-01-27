import { TArticleBlock } from '@/types/article';

// Регулярные выражения для очистки
const INLINE_FORMULA_REGEX = /\$([^$]+)\$/g;
const BLOCK_FORMULA_REGEX = /\$\$([^$]+)\$\$/g;
const CLASS_REGEX = /\s+class="[^"]*"/g;
const STYLE_REGEX = /\s+style="[^"]*"/g;
const DATA_ATTRS_REGEX = /\s+data-[^=]+=("[^"]*"|'[^']*')/g;
const EMPTY_TAGS_REGEX = /<([^>]+)>\s*<\/\1>/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;
const MULTIPLE_NEWLINES_REGEX = /\n\s*\n/g;
const EMPTY_LIST_ITEM_REGEX = /<li[^>]*>(?:\s*<p[^>]*>\s*<\/p>\s*|\s*)<\/li>/g;
const EMPTY_LIST_REGEX = /<(ul|ol)[^>]*>(?:\s*<li[^>]*>(?:\s*<p[^>]*>\s*<\/p>\s*|\s*)<\/li>\s*)*<\/\1>/g;

// Список разрешенных HTML-тегов
const ALLOWED_TAGS = new Set(['strong', 'em', 'u', 'a', 'br', 'sup', 'sub', 'ul', 'ol', 'li']);

/**
 * Очищает HTML-контент, сохраняя только необходимое форматирование
 */
export function cleanHtmlContent(content: string, preserveHTML: boolean = false): string {
  // Если нужно сохранить оригинальный HTML (для списков)
  if (preserveHTML) {
    // Даже если сохраняем HTML, всё равно очищаем пустые элементы
    return content
      .replace(EMPTY_LIST_ITEM_REGEX, '')
      .replace(EMPTY_LIST_REGEX, '');
  }

  // Сохраняем формулы
  const formulas: string[] = [];
  content = content
    .replace(EMPTY_LIST_ITEM_REGEX, '') // Сначала удаляем пустые элементы списка
    .replace(EMPTY_LIST_REGEX, '') // Затем удаляем пустые списки
    .replace(INLINE_FORMULA_REGEX, (match) => {
    formulas.push(match);
    return `__FORMULA${formulas.length - 1}__`;
  });

  // Очищаем HTML
  let cleanContent = content
    // Удаляем классы
    .replace(CLASS_REGEX, '')
    // Удаляем стили
    .replace(STYLE_REGEX, '')
    // Удаляем data-атрибуты
    .replace(DATA_ATTRS_REGEX, '')
    // Удаляем пустые теги
    .replace(EMPTY_TAGS_REGEX, '')
    // Нормализуем пробелы
    .replace(MULTIPLE_SPACES_REGEX, ' ')
    // Нормализуем переносы строк
    .replace(MULTIPLE_NEWLINES_REGEX, '\n');

  // Удаляем неразрешенные теги, сохраняя их содержимое
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleanContent;

  function cleanNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        // Если тег не разрешен, заменяем его на содержимое
        const fragment = document.createDocumentFragment();
        while (element.firstChild) {
          const child = element.firstChild;
          fragment.appendChild(child);
        }
        element.parentNode?.replaceChild(fragment, element);
      }
    }
  }

  const treeWalker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  const nodes: Element[] = [];
  let currentNode = treeWalker.nextNode();
  while (currentNode) {
    nodes.push(currentNode as Element);
    currentNode = treeWalker.nextNode();
  }

  // Очищаем узлы в обратном порядке, чтобы не нарушить структуру дерева
  nodes.reverse().forEach(cleanNode);

  // Восстанавливаем формулы
  cleanContent = tempDiv.innerHTML.replace(/__FORMULA(\d+)__/g, (_, index) => {
    return formulas[parseInt(index)];
  });

  return cleanContent.trim();
}

/**
 * Очищает блок статьи от лишних HTML-атрибутов
 */
export function cleanArticleBlock(block: TArticleBlock): TArticleBlock {
  if ('content' in block && block.content) {
    // Сохраняем оригинальный HTML для списков
    const preserveHTML = !!(block.type === 'P' && 'listType' in block && block.listType);
    
    // Очищаем контент
    let cleanedContent = block.content;
    
    // Всегда очищаем пустые элементы списка, даже если preserveHTML = true
    cleanedContent = cleanedContent
      .replace(EMPTY_LIST_ITEM_REGEX, '')
      .replace(EMPTY_LIST_REGEX, '');
    
    // Если после очистки пустых элементов контент стал пустым, возвращаем пустой параграф
    if (!cleanedContent.trim()) {
      const { listType, ...rest } = block as any;
      return {
        ...rest,
        content: '<p></p>'
      };
    }
    
    return {
      ...block,
      content: cleanHtmlContent(cleanedContent, preserveHTML)
    };
  }
  return block;
}

/**
 * Очищает массив блоков статьи
 */
export function cleanArticleBlocks(blocks: TArticleBlock[]): TArticleBlock[] {
  return blocks.map(cleanArticleBlock);
} 