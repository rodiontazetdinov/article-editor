import { TBlockType, TTextAlign, TTextCase } from '@/types/article';
import { IconType } from 'react-icons';
import { 
  MdUndo, MdRedo, 
  MdFormatBold, MdFormatItalic, MdFormatUnderlined,
  MdSuperscript, MdFormatListBulleted, MdFormatListNumbered,
  MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight,
  MdFunctions
} from 'react-icons/md';
import { BsTypeH1, BsTypeH2, BsTypeH3, BsParagraph } from 'react-icons/bs';
import { TbAB, TbAB2, TbLetterCase } from 'react-icons/tb';
import { RiText } from 'react-icons/ri';

interface ToolbarProps {
  onBlockTypeChange: (type: TBlockType) => void;
  onTextAlignChange: (align: TTextAlign) => void;
  onTextCaseChange: (textCase: TTextCase) => void;
  onFormatClick: (format: 'bold' | 'italic' | 'underline' | 'superscript') => void;
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

interface ToolbarButton {
  icon: IconType;
  label: string;
  action: () => void;
  isActive?: boolean;
}

interface ToolbarGroup {
  label: string;
  buttons: ToolbarButton[];
}

export const Toolbar = ({
  onBlockTypeChange,
  onTextAlignChange,
  onTextCaseChange,
  onFormatClick,
  onListClick,
  onFormulaClick,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  activeFormats
}: ToolbarProps) => {
  const toolbarGroups: ToolbarGroup[] = [
    {
      label: 'История',
      buttons: [
        { icon: MdUndo, label: 'Отменить', action: onUndo, isActive: !canUndo },
        { icon: MdRedo, label: 'Повторить', action: onRedo, isActive: !canRedo }
      ]
    },
    {
      label: 'Блок',
      buttons: [
        { icon: BsTypeH1, label: 'Заголовок', action: () => onBlockTypeChange('H1') },
        { icon: BsTypeH2, label: 'Заголовок раздела', action: () => onBlockTypeChange('H2') },
        { icon: BsTypeH3, label: 'Заголовок блока', action: () => onBlockTypeChange('H3') },
        { icon: BsParagraph, label: 'Параграф', action: () => onBlockTypeChange('P') },
        { icon: RiText, label: 'Подпись', action: () => onBlockTypeChange('CAPTION') }
      ]
    },
    {
      label: 'Регистр',
      buttons: [
        { icon: TbAB, label: 'Все заглавные', action: () => onTextCaseChange('uppercase') },
        { icon: TbAB2, label: 'Все строчные', action: () => onTextCaseChange('lowercase') },
        { icon: TbLetterCase, label: 'Первая заглавная', action: () => onTextCaseChange('capitalize') }
      ]
    },
    {
      label: 'Форматирование',
      buttons: [
        { icon: MdFormatBold, label: 'Жирный', action: () => onFormatClick('bold'), isActive: activeFormats?.bold },
        { icon: MdFormatItalic, label: 'Курсив', action: () => onFormatClick('italic'), isActive: activeFormats?.italic },
        { icon: MdFormatUnderlined, label: 'Подчеркнутый', action: () => onFormatClick('underline'), isActive: activeFormats?.underline },
        { icon: MdSuperscript, label: 'Степень', action: () => onFormatClick('superscript'), isActive: activeFormats?.superscript }
      ]
    },
    {
      label: 'Выравнивание',
      buttons: [
        { icon: MdFormatAlignLeft, label: 'По левому краю', action: () => onTextAlignChange('left') },
        { icon: MdFormatAlignCenter, label: 'По центру', action: () => onTextAlignChange('center') },
        { icon: MdFormatAlignRight, label: 'По правому краю', action: () => onTextAlignChange('right') }
      ]
    },
    {
      label: 'Списки и формулы',
      buttons: [
        { icon: MdFormatListBulleted, label: 'Маркированный список', action: () => onListClick('bullet') },
        { icon: MdFormatListNumbered, label: 'Нумерованный список', action: () => onListClick('number') },
        { icon: MdFunctions, label: 'Формула', action: onFormulaClick }
      ]
    }
  ];

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {toolbarGroups.map((group, groupIndex) => (
            <div key={group.label} className="flex items-center">
              {groupIndex > 0 && <div className="w-px h-6 bg-gray-200 mx-2" />}
              <div className="flex gap-1">
                {group.buttons.map((button) => (
                  <button
                    key={button.label}
                    onClick={button.action}
                    disabled={button.isActive && !activeFormats}
                    className={`p-1.5 rounded transition-colors relative group/button
                      ${button.isActive && !activeFormats ? 'opacity-50 cursor-not-allowed' : ''}
                      ${button.isActive && activeFormats ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}
                    `}
                    title={button.label}
                  >
                    <button.icon className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover/button:opacity-100 transition-opacity whitespace-nowrap">
                      {button.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 