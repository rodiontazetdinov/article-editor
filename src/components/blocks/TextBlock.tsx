import { ITextBlock, TTextCase } from '@/types/article';
import { useEffect, useRef } from 'react';

interface TextBlockProps {
  block: ITextBlock;
  onUpdate: (updates: Partial<ITextBlock>) => void;
}

const applyTextCase = (text: string, textCase?: TTextCase): string => {
  if (!textCase || textCase === 'normal') return text;
  if (textCase === 'uppercase') return text.toUpperCase();
  if (textCase === 'lowercase') return text.toLowerCase();
  if (textCase === 'capitalize') return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  return text;
};

export const TextBlock = ({ block, onUpdate }: TextBlockProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && block.content !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = block.content || '';
    }
  }, [block.content]);

  const handleInput = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML;
      // Добавляем <!----> в конец, чтобы сохранить пустые строки
      onUpdate({ content: content + (content.endsWith('<!---->') ? '' : '<!---->') });
    }
  };

  const getFontSize = () => {
    switch (block.type) {
      case 'H1': return 'text-4xl font-bold';
      case 'H2': return 'text-3xl font-bold';
      case 'H3': return 'text-2xl font-bold';
      case 'CAPTION': return 'text-sm text-gray-600';
      default: return 'text-base';
    }
  };

  const getAlignment = () => {
    switch (block.align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div
      ref={contentRef}
      contentEditable
      onInput={handleInput}
      className={`w-full outline-none min-h-[1.5em] ${getFontSize()} ${getAlignment()} empty:before:content-[attr(data-placeholder)] before:text-gray-400 before:pointer-events-none`}
      data-placeholder={block.type === 'CAPTION' ? 'Подпись' : block.type === 'P' ? 'Текст параграфа' : 'Заголовок'}
      suppressContentEditableWarning
    />
  );
}; 