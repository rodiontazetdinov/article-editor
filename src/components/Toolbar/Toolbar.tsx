import { useState } from 'react';
import { TBlockType, TTextAlign, TTextCase } from '@/types/article';
import { IconType } from 'react-icons';
import { 
  MdUndo, MdRedo, 
  MdFormatBold, MdFormatItalic, MdFormatUnderlined,
  MdSuperscript, MdFormatListBulleted, MdFormatListNumbered,
  MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight,
  MdFunctions, MdFormatClear, MdKeyboardArrowDown
} from 'react-icons/md';
import { BsTypeH1, BsTypeH2, BsTypeH3, BsParagraph } from 'react-icons/bs';
import { RiText } from 'react-icons/ri';

interface ToolbarProps {
  onBlockTypeChange: (type: TBlockType) => void;
  onTextAlignChange: (align: TTextAlign) => void;
  onTextCaseChange: (textCase: TTextCase) => void;
  onFormatClick: (format: 'bold' | 'italic' | 'underline' | 'superscript') => void;
  onClearFormat: () => void;
  onListClick: (type: 'bullet' | 'number') => void;
  onFormulaClick: () => void;
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

export const Toolbar = ({
  onBlockTypeChange,
  onTextAlignChange,
  onTextCaseChange,
  onFormatClick,
  onClearFormat,
  onListClick,
  onFormulaClick,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  activeFormats
}: ToolbarProps) => {
  const [showBlockTypes, setShowBlockTypes] = useState(false);

  const blockTypes = [
    { icon: BsTypeH1, label: 'Заголовок', type: 'H1' as TBlockType },
    { icon: BsTypeH2, label: 'Подзаголовок', type: 'H2' as TBlockType },
    { icon: BsTypeH3, label: 'Малый заголовок', type: 'H3' as TBlockType },
    { icon: BsParagraph, label: 'Параграф', type: 'P' as TBlockType },
    { icon: RiText, label: 'Подпись', type: 'CAPTION' as TBlockType },
  ];

  const CurrentBlockIcon = BsParagraph;

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm">
      <div className="relative">
        <button
          onClick={() => setShowBlockTypes(!showBlockTypes)}
          className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 text-gray-700"
        >
          <CurrentBlockIcon className="w-4 h-4" />
          <MdKeyboardArrowDown className="w-4 h-4" />
        </button>
        {showBlockTypes && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
            {blockTypes.map((type) => (
              <button
                key={type.type}
                onClick={() => {
                  onBlockTypeChange(type.type);
                  setShowBlockTypes(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700 text-sm"
              >
                <type.icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => onFormatClick('bold')}
          className={`p-1.5 rounded hover:bg-gray-100 ${activeFormats?.bold ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
          title="Жирный (Ctrl+B)"
        >
          <MdFormatBold className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormatClick('italic')}
          className={`p-1.5 rounded hover:bg-gray-100 ${activeFormats?.italic ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
          title="Курсив (Ctrl+I)"
        >
          <MdFormatItalic className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormatClick('underline')}
          className={`p-1.5 rounded hover:bg-gray-100 ${activeFormats?.underline ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
          title="Подчеркнутый (Ctrl+U)"
        >
          <MdFormatUnderlined className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFormatClick('superscript')}
          className={`p-1.5 rounded hover:bg-gray-100 ${activeFormats?.superscript ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
          title="Верхний индекс"
        >
          <MdSuperscript className="w-4 h-4" />
        </button>
        <button
          onClick={onClearFormat}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="Очистить форматирование (Ctrl+\)"
        >
          <MdFormatClear className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => onTextAlignChange('left')}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="По левому краю"
        >
          <MdFormatAlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onTextAlignChange('center')}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="По центру"
        >
          <MdFormatAlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => onTextAlignChange('right')}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="По правому краю"
        >
          <MdFormatAlignRight className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => onListClick('bullet')}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="Маркированный список"
        >
          <MdFormatListBulleted className="w-4 h-4" />
        </button>
        <button
          onClick={() => onListClick('number')}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="Нумерованный список"
        >
          <MdFormatListNumbered className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1">
        <button
          onClick={onFormulaClick}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="Вставить формулу"
        >
          <MdFunctions className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-40"
          title="Отменить (Ctrl+Z)"
        >
          <MdUndo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-40"
          title="Повторить (Ctrl+Shift+Z)"
        >
          <MdRedo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}; 