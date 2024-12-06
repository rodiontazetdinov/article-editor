import { TArticleBlock } from '@/types/article';
import { useState } from 'react';
import { AddBlockButton } from './AddBlockButton';

interface BlockWrapperProps {
  block: TArticleBlock;
  onUpdate: (updates: Partial<TArticleBlock>) => void;
  onDelete: () => void;
  onAdd: (type: TArticleBlock['type']) => void;
  children: React.ReactNode;
}

export const BlockWrapper = ({ block, onDelete, onAdd, children }: BlockWrapperProps) => {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="group/block mb-8 relative">
      <div className="relative bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg p-4 border-l-4 border-l-blue-500">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-500 opacity-0 group-hover/block:opacity-100 rounded-r transition-opacity" />
        
        {showJson ? (
          <pre className="bg-gray-50 p-3 rounded-md font-mono text-sm overflow-x-auto">
            {JSON.stringify(block, null, 2)}
          </pre>
        ) : (
          <div className="min-h-[40px]">
            {children}
          </div>
        )}
        
        <div className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 flex gap-2 transition-opacity">
          <button
            onClick={() => setShowJson(!showJson)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            {showJson ? 'Редактировать' : 'JSON'}
          </button>
          <button
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
      <div className="absolute -bottom-5 left-0 right-0 opacity-0 group-hover/block:opacity-100 transition-opacity">
        <AddBlockButton onAdd={onAdd} />
      </div>
    </div>
  );
}; 