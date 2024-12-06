import { useState } from 'react';
import { TBlockType } from '@/types/article';

interface AddBlockButtonProps {
  onAdd: (type: TBlockType) => void;
}

export const AddBlockButton = ({ onAdd }: AddBlockButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const blockTypes: { type: TBlockType; icon: string; label: string }[] = [
    { type: 'H1', icon: 'H1', label: 'Заголовок' },
    { type: 'P', icon: '¶', label: 'Параграф' },
    { type: 'FORMULA', icon: '∑', label: 'Формула' },
    { type: 'IMAGE', icon: '🖼', label: 'Изображение' },
  ];

  return (
    <div 
      className="h-6 group/add relative -my-1"
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="absolute left-1/2 w-px h-full bg-blue-200 -translate-x-1/2 group-hover/add:bg-blue-400 transition-colors" />
      <div className="absolute inset-x-0 h-6 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all hover:scale-110 text-lg relative z-10"
          >
            +
          </button>
        ) : (
          <div 
            className="flex gap-1 bg-white rounded-full shadow-lg p-1.5 transition-all"
          >
            {blockTypes.map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => {
                  onAdd(type);
                  setIsExpanded(false);
                }}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-blue-500 text-gray-700 hover:text-white flex items-center justify-center transition-colors group/button relative"
                title={label}
              >
                <span className="text-base">{icon}</span>
                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 scale-0 group-hover/button:scale-100 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-transform">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 