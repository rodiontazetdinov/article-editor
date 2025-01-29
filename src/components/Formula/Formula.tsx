import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import { InlineMath, BlockMath } from 'react-katex';
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import 'katex/dist/katex.min.css';

// Функция для предварительной обработки LaTeX формулы
const preprocessLatex = (latex: string): string => {
  return latex
    // Исправляем производные и степени
    .replace(/(\w+)\^{(\d+)}/g, '$1^{$2}') // x^{2} -> x^{2}
    .replace(/(\w+)\^{'}/g, '\\dot{$1}') // x^{'} -> \dot{x}
    .replace(/(\w+)\^{''}/g, '\\ddot{$1}') // x^{''} -> \ddot{x}
    .replace(/(\w+)\^{'(\d+)}/g, '\\dot{$1}^{$2}') // x^{'2} -> \dot{x}^{2}
    // Исправляем скобки и пробелы
    .replace(/\\left\s*{/g, '\\left\\{')
    .replace(/\\right\s*}/g, '\\right\\}')
    .replace(/\\left\s*\(/g, '\\left(')
    .replace(/\\right\s*\)/g, '\\right)')
    .replace(/\\left\s*\[/g, '\\left[')
    .replace(/\\right\s*\]/g, '\\right]')
    // Исправляем команды
    .replace(/\\overset{\\cdot}/g, '\\dot')
    .replace(/\\_/g, '_')
    .replace(/\\,/g, ' ')
    // Убираем лишние пробелы
    .replace(/\s+/g, ' ')
    .trim();
};

const FormulaEditor = ({ content, onSave, onCancel }: { 
  content: string; 
  onSave: (content: string) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState(content);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onSave(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    try {
      // Проверяем, что формула корректна
      const processedFormula = preprocessLatex(newValue);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка в формуле');
    }
  };

  return (
    <div className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[300px]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[60px] p-2 border rounded font-mono text-sm resize-y mb-2
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
        placeholder="Введите LaTeX формулу..."
      />
      <div className={`p-2 rounded mb-2 min-h-[30px] ${error ? 'bg-red-50' : 'bg-gray-50'}`}>
        {error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <InlineMath math={preprocessLatex(value)} />
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(value)}
          disabled={!!error}
          className={`px-3 py-1 rounded text-sm transition-colors
            ${error 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        >
          Сохранить
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 
            transition-colors text-sm"
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

const FormulaComponent = ({ node, updateAttributes }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formula = preprocessLatex((node.attrs.content || '').replace(/^\$|\$$/g, ''));
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    portalRef.current = document.createElement('div');
    document.body.appendChild(portalRef.current);

    return () => {
      if (portalRef.current) {
        document.body.removeChild(portalRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (!isEditing && containerRef.current && portalRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      portalRef.current.style.position = 'absolute';
      portalRef.current.style.left = `${rect.left}px`;
      portalRef.current.style.top = `${rect.bottom + 4}px`;
      setIsEditing(true);
    }
  };

  const handleSave = (newContent: string) => {
    try {
      const processedFormula = preprocessLatex(newContent);
      updateAttributes({ content: processedFormula });
      setError(null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка в формуле');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  return (
    <span
      ref={containerRef}
      onClick={handleClick}
      className={`inline-block align-middle px-1 mx-0.5 min-w-[20px] min-h-[24px] 
        rounded cursor-pointer transition-colors
        ${error 
          ? 'bg-red-50/80 hover:bg-red-100/80 border border-red-200/50' 
          : 'bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/50'}`}
    >
      <InlineMath 
        math={formula}
        errorColor="#EF4444"
        renderError={(err) => {
          console.error('KaTeX error:', err);
          setError(err.message);
          return <span className="text-red-500">{formula}</span>;
        }}
      />
      {isEditing && portalRef.current && ReactDOM.createPortal(
        <FormulaEditor
          content={node.attrs.content.replace(/^\$|\$$/g, '')}
          onSave={handleSave}
          onCancel={handleCancel}
        />,
        portalRef.current
      )}
    </span>
  );
};

export const Formula = Node.create({
  name: 'formula',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      content: {
        default: '',
      },
      inline: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="formula"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const element = node as HTMLElement;
          return {
            content: element.getAttribute('data-formula') || '',
            inline: element.getAttribute('data-inline') === 'true',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'formula' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FormulaComponent);
  },
}); 