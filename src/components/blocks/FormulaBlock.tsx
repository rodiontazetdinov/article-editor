import { IFormulaBlock } from '@/types/article';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useState } from 'react';

interface FormulaBlockProps {
  block: IFormulaBlock;
  onUpdate: (updates: Partial<IFormulaBlock>) => void;
}

export const FormulaBlock = ({ block, onUpdate }: FormulaBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const previousChanges = block.changes || [];
    
    // Если есть предыдущий контент, добавляем изменение
    if (block.content && block.content !== newContent) {
      const newChange = {
        position: 0, // Позиция всегда 0 для формул, так как они обрабатываются целиком
        before: block.content,
        after: newContent
      };
      
      onUpdate({ 
        content: newContent,
        changes: [...previousChanges, newChange]
      });
    } else {
      onUpdate({ content: newContent });
    }
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
    <div className="w-full">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={block.content}
            onChange={handleContentChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите LaTeX формулу"
            rows={2}
            autoFocus
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                setIsEditing(false);
              }
            }}
          />
          <div className="text-xs text-gray-500">
            Нажмите Shift + Enter или кликните вне поля для сохранения
          </div>
        </div>
      ) : (
        <div 
          className={`formula-container cursor-pointer hover:bg-gray-50/50 transition-colors rounded p-4`}
          onClick={() => setIsEditing(true)}
        >
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
          <div className="formula">
            <BlockMath math={formula || ' '} />
          </div>
          {number && (
            <div className="number">
              ({number})
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 