import { ArticleBlock } from '@/types/article';
import { useState } from 'react';

interface BlockWrapperProps {
  block: ArticleBlock;
  onDelete: () => void;
  children: React.ReactNode;
}

export const BlockWrapper = ({ block, onDelete, children }: BlockWrapperProps) => {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="relative group border border-transparent hover:border-gray-200 rounded-lg p-2">
      {showJson ? (
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(block, null, 2)}
        </pre>
      ) : (
        children
      )}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-2">
        <button
          onClick={() => setShowJson(!showJson)}
          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
        >
          {showJson ? 'Редактировать' : 'JSON'}
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white px-2 py-1 rounded text-sm"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}; 