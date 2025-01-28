import { TBlockType, TTextAlign, TTextCase } from '@/types/article';
import { Toolbar } from './Toolbar';
import { useEffect, useState } from 'react';
import { MdFunctions, MdAutoFixHigh } from 'react-icons/md';

interface ActiveBlockToolbarProps {
  blockId: string | null;
  onBlockTypeChange: (type: TBlockType) => void;
  onTextAlignChange: (align: TTextAlign) => void;
  onTextCaseChange: (textCase: TTextCase) => void;
  onFormatClick: (format: 'bold' | 'italic' | 'underline' | 'superscript') => void;
  onClearFormat: () => void;
  onListClick: (type: 'bullet' | 'number') => void;
  onFormulaClick: () => void;
  onDeepSeekConvert: () => void;
  onIndentChange: (direction: 'left' | 'right') => void;
  canIndentLeft: boolean;
  canIndentRight: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  activeFormats?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    superscript: boolean;
  };
}

export const ActiveBlockToolbar: React.FC<ActiveBlockToolbarProps> = ({
  blockId,
  ...toolbarProps
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (blockId) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [blockId]);

  return (
    <div 
      className={`
        sticky top-0 z-50 transition-all duration-200 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4">
          <Toolbar {...toolbarProps} />
          <button
            onClick={toolbarProps.onFormulaClick}
            className="toolbar-button p-1.5 rounded hover:bg-gray-100 text-gray-700"
            title="Вставить формулу"
          >
            <MdFunctions size={20} />
          </button>
          <button
            onClick={toolbarProps.onDeepSeekConvert}
            className="toolbar-button p-1.5 rounded hover:bg-gray-100 text-gray-700"
            title="Конвертировать через DeepSeek"
          >
            <MdAutoFixHigh size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}; 