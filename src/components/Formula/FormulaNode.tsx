import { useEffect, useState } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export const FormulaNode = ({ node }: { node: HTMLElement }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formula, setFormula] = useState(node.textContent || 'формула');

  useEffect(() => {
    node.style.display = 'inline-block';
    node.style.padding = '2px 4px';
    node.style.margin = '0 2px';
    node.style.backgroundColor = '#f3f4f6';
    node.style.borderRadius = '4px';
    node.style.cursor = 'pointer';
    node.style.border = '1px solid #e5e7eb';

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    };

    node.addEventListener('click', handleClick);
    return () => node.removeEventListener('click', handleClick);
  }, [node]);

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Редактировать формулу</h3>
          <textarea
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            rows={3}
          />
          <div className="bg-gray-50 p-4 rounded mb-4">
            <InlineMath math={formula} />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Отмена
            </button>
            <button
              onClick={() => {
                node.textContent = formula;
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 