import { IFormulaBlock } from '@/types/article';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

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
      <div className="p-4 flex justify-center">
        <InlineMath math={block.content || ' '} />
      </div>
    </div>
  );
}; 