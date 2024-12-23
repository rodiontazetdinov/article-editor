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

  // Предварительная обработка LaTeX формулы
  const preprocessLatex = (latex: string) => {
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
  };

  // Разделяем формулу и номер
  const getFormulaAndNumber = (content: string) => {
    if (content.includes('#')) {
      const [formula, numberPart] = content.split('#').map(part => part.trim());
      const number = numberPart.replace(/[()]/g, '').trim();
      return { formula: preprocessLatex(formula), number };
    }
    return { formula: preprocessLatex(content), number: null };
  };

  const { formula, number } = getFormulaAndNumber(block.content);

  return (
    <div className="w-full space-y-2">
      <textarea
        value={block.content}
        onChange={handleContentChange}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Введите LaTeX формулу"
        rows={2}
      />
      <div className={`
        ${block.inline ? 'p-2' : 'p-4'} 
        bg-gray-50 rounded
        ${!block.inline ? 'formula-container' : ''}
      `}>
        <style jsx global>{`
          .formula-container {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 2rem;
            align-items: center;
            width: 100%;
            overflow: hidden;
          }
          .formula-container .formula {
            overflow-x: auto;
            overflow-y: hidden;
            margin: 0;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .formula-container .formula::-webkit-scrollbar {
            display: none;
          }
          .formula-container .formula .katex-display {
            margin: 0;
            padding: 0;
          }
          .formula-container .formula .katex-display > .katex {
            white-space: nowrap;
          }
          .formula-container .number {
            font-size: 1.2em;
            color: #333;
            white-space: nowrap;
          }
        `}</style>
        {block.inline ? (
          <InlineMath math={formula || ' '} />
        ) : (
          <>
            <div className="formula">
              <BlockMath math={formula || ' '} />
            </div>
            {number && (
              <div className="number">
                ({number})
              </div>
            )}
          </>
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