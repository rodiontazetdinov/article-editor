import { IFormulaBlock } from '@/types/article';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface FormulaBlockProps {
  block: IFormulaBlock;
  onUpdate: (updates: Partial<IFormulaBlock>) => void;
}

export const FormulaBlock = ({ block, onUpdate }: FormulaBlockProps) => {
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
  };

  const handleInlineToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ inline: e.target.checked });
  };

  return (
    <div className="w-full space-y-2">
      <textarea
        value={block.content}
        onChange={handleContentChange}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Введите LaTeX формулу"
        rows={2}
      />
      <div className={`${block.inline ? 'p-2' : 'p-4'} flex justify-center bg-gray-50 rounded`}>
        {block.inline ? (
          <InlineMath math={block.content || ' '} />
        ) : (
          <BlockMath math={block.content || ' '} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={block.inline}
            onChange={handleInlineToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Строчная формула
        </label>
      </div>
    </div>
  );
}; 