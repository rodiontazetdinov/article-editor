import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TArticleBlock, ITextBlock, IFormulaBlock, IImageBlock } from '@/types/article';
import { BlockWrapper } from './BlockWrapper';
import { TextBlock } from '../TextBlock/TextBlock';
import { FormulaBlock } from './FormulaBlock';
import { ImageBlock } from './ImageBlock';
import { MdDragIndicator } from 'react-icons/md';
import { useState } from 'react';

interface SortableBlockProps {
  block: TArticleBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TArticleBlock>) => void;
  onDelete: () => void;
  onAdd: (type: TArticleBlock['type']) => void;
  activeFormats?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    superscript: boolean;
  };
  onActiveFormatsChange?: (formats: any) => void;
  onEnterPress?: () => void;
}

export const SortableBlock = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onAdd,
  activeFormats,
  onActiveFormatsChange,
  onEnterPress
}: SortableBlockProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'H1':
      case 'H2':
      case 'H3':
      case 'P':
      case 'CAPTION':
        const textBlock = block as ITextBlock;
        return (
          <TextBlock 
            block={textBlock}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAdd={onAdd}
            activeFormats={isSelected ? activeFormats : undefined}
            onActiveFormatsChange={onActiveFormatsChange}
            onEnterPress={onEnterPress}
            shouldFocus={block.$new}
          />
        );
      case 'FORMULA':
        const formulaBlock = block as IFormulaBlock;
        return <FormulaBlock block={formulaBlock} onUpdate={onUpdate} />;
      case 'IMAGE':
        const imageBlock = block as IImageBlock;
        return <ImageBlock block={imageBlock} onUpdate={onUpdate} />;
      default:
        return null;
    }
  };

  const getBlockSpacing = () => {
    switch (block.type) {
      case 'H1':
        return 'mb-6';
      case 'H2':
        return 'mb-4 mt-6';
      case 'H3':
        return 'mb-3 mt-4';
      case 'P':
        return 'mb-3';
      case 'CAPTION':
        return 'mb-4';
      case 'IMAGE':
      case 'FORMULA':
        return 'my-6';
      default:
        return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${getBlockSpacing()} transition-all duration-200`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 
          ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}
          ${isSelected ? 'bg-blue-50/30 ring-1 ring-blue-200' : 'bg-gray-50/30'}`}
      />
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-0 top-1/2 -translate-x-[calc(100%+4px)] -translate-y-1/2 
          transition-opacity duration-200 ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="p-1.5 cursor-move hover:bg-blue-100 rounded-md transition-colors">
          <MdDragIndicator className="w-4 h-4 text-blue-400" />
        </div>
      </div>
      <div className={`relative ${isSelected ? 'z-10' : ''}`}>
        <BlockWrapper
          block={block}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAdd={onAdd}
        >
          {renderBlock()}
        </BlockWrapper>
      </div>
    </div>
  );
}; 