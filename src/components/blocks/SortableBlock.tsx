import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TArticleBlock } from '@/types/article';
import { BlockWrapper } from './BlockWrapper';
import { TextBlock } from '../TextBlock/TextBlock';
import { FormulaBlock } from './FormulaBlock';
import { ImageBlock } from './ImageBlock';
import { MdDragIndicator } from 'react-icons/md';

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
        return (
          <TextBlock 
            block={block} 
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
        return <FormulaBlock block={block} onUpdate={onUpdate} />;
      case 'IMAGE':
        return <ImageBlock block={block} onUpdate={onUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-x-[calc(100%+8px)] -translate-y-1/2 p-2 cursor-move hover:bg-blue-100 rounded transition-colors"
        title="Перетащить блок"
      >
        <MdDragIndicator className="w-5 h-5 text-blue-500" />
      </div>
      <BlockWrapper
        block={block}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAdd={onAdd}
      >
        {renderBlock()}
      </BlockWrapper>
    </div>
  );
}; 