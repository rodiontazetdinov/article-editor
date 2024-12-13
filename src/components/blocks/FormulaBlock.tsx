import { IFormulaBlock } from '@/types/article';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface FormulaBlockProps {
  block: IFormulaBlock;
  onUpdate: (updates: Partial<IFormulaBlock>) => void;
}

export const FormulaBlock = ({ block, onUpdate }: FormulaBlockProps) => {
  return (
    <div className="w-full space-y-2">
      <textarea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Введите LaTeX формулу"
        rows={2}
      />
      <div className={`${block.inline ? 'p-2' : 'p-4'} flex justify-center`}>
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
            onChange={(e) => onUpdate({ inline: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Строчная формула
        </label>
      </div>
    </div>
  );
}; 