import { ITextBlock } from '@/types/article';

interface TextBlockProps {
  block: ITextBlock;
  onUpdate: (updates: Partial<ITextBlock>) => void;
}

export const TextBlock = ({ block, onUpdate }: TextBlockProps) => {
  return (
    <div className="w-full">
      {block.type === 'H1' ? (
        <input
          type="text"
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full text-3xl font-bold p-2 border-none focus:outline-none bg-transparent"
          placeholder="Заголовок"
        />
      ) : (
        <textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full p-2 border-none focus:outline-none bg-transparent resize-none"
          placeholder="Текст параграфа"
          rows={3}
        />
      )}
    </div>
  );
}; 