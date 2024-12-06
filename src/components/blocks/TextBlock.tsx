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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [block.content]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
    onUpdate({ content: target.value });
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
    <textarea
      ref={textareaRef}
      value={block.content || ''}
      onChange={handleInput}
      className={`w-full outline-none resize-none overflow-hidden ${getFontSize()} ${getAlignment()} bg-transparent`}
      placeholder={block.type === 'CAPTION' ? 'Подпись' : block.type === 'P' ? 'Текст параграфа' : 'Заголовок'}
      rows={1}
    />
  );
}; 