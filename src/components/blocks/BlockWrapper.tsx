import { TArticleBlock } from '@/types/article';
import { useState } from 'react';
import { MdDelete, MdCode, MdAdd } from 'react-icons/md';

interface BlockWrapperProps {
  block: TArticleBlock;
  onUpdate: (updates: Partial<TArticleBlock>) => void;
  onDelete: () => void;
  onAdd: (type: TArticleBlock['type']) => void;
  blockControls?: React.ReactNode;
  children: React.ReactNode;
}

export const BlockWrapper = ({ block, onDelete, onAdd, blockControls, children }: BlockWrapperProps) => {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="relative mb-8">
      <div className="bg-white rounded-xl">
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-500 uppercase">
              {block.type}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowJson(!showJson)}
                className={`p-1.5 rounded transition-colors ${
                  showJson 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
                title={showJson ? "Скрыть JSON" : "Показать JSON"}
              >
                <MdCode className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete()}
                className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Удалить блок"
              >
                <MdDelete className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAdd('P')}
                className="p-1.5 rounded text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                title="Добавить блок"
              >
                <MdAdd className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {blockControls}
          </div>
        </div>

        {/* JSON представление */}
        {showJson && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 font-mono text-xs text-gray-600 overflow-x-auto">
            <pre>{JSON.stringify(block, null, 2)}</pre>
          </div>
        )}

        {/* Основной контент */}
        <div className="px-4 py-3">
          {children}
        </div>
      </div>
    </div>
  );
}; 