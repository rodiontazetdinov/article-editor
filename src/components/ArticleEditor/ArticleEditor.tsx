'use client';

import { useState, useCallback } from 'react';
import type { IArticle, TArticleBlock, ITextBlock, IFormulaBlock, IImageBlock, IRenderBlock, TBlockType, TTextAlign, TTextCase } from '@/types/article';
import { nanoid } from 'nanoid';
import { TextBlock } from './../TextBlock/TextBlock';
import { FormulaBlock } from '../blocks/FormulaBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { BlockWrapper } from '../blocks/BlockWrapper';
import { AddBlockButton } from '../blocks/AddBlockButton';
import { Toolbar } from '../Toolbar/Toolbar';
import { JsonPreview } from '../JsonPreview/JsonPreview';
import { ArticlePreview } from '../ArticlePreview/ArticlePreview';
import { MdPreview, MdClose, MdArticle } from 'react-icons/md';
import { ImportDocument } from '../ImportDocument/ImportDocument';
import { Formula } from '../Formula/Formula';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableBlock } from '../blocks/SortableBlock';
import { ActiveBlockToolbar } from '../Toolbar/ActiveBlockToolbar';

interface ArticleEditorProps {
  initialData?: IArticle;
  onChange?: (article: IArticle) => void;
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  superscript: boolean;
}

export const ArticleEditor = ({ initialData, onChange }: ArticleEditorProps) => {
  const [blocks, setBlocks] = useState<TArticleBlock[]>(initialData?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<{
    past: TArticleBlock[][];
    present: TArticleBlock[];
    future: TArticleBlock[][];
  }>({
    past: [],
    present: [],
    future: []
  });
  const [activeFormats, setActiveFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    superscript: false
  });
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateHistory = useCallback((newBlocks: TArticleBlock[]) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newBlocks,
      future: []
    }));
    setBlocks(newBlocks);
    onChange?.({ blocks: newBlocks });
  }, [blocks, onChange]);

  const handleUndo = () => {
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future]
    });
    
    setBlocks(previous);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture
    });
    
    setBlocks(next);
  };

  const createBlock = (type: TBlockType): TArticleBlock => {
    const baseBlock = {
      id: nanoid(10),
      indent: 0,
      type,
      modified: new Date().toISOString(),
      $new: true,
    };

    if (type === 'H1' || type === 'H2' || type === 'H3' || type === 'P' || type === 'CAPTION') {
      return { ...baseBlock, type, content: '' } as ITextBlock;
    } else if (type === 'FORMULA') {
      return { ...baseBlock, type, source: 'latex', content: '' } as IFormulaBlock;
    } else if (type === 'IMAGE') {
      return { ...baseBlock, type, variant: '1', images: [], src: '' } as IImageBlock;
    } else {
      return { ...baseBlock, type } as IRenderBlock;
    }
  };

  const addBlock = (type: TBlockType, afterId?: string) => {
    const newBlock = createBlock(type);
    let newBlocks: TArticleBlock[];
    
    if (afterId) {
      const index = blocks.findIndex(b => b.id === afterId);
      newBlocks = [
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1)
      ];
    } else {
      newBlocks = [...blocks, newBlock];
    }

    updateHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
    setFocusBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<TArticleBlock>) => {
    const newBlocks = blocks.map(block => {
      if (block.id !== id) return block;
      return { ...block, ...updates, modified: new Date().toISOString() };
    });
    updateHistory(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id);
    updateHistory(newBlocks);
  };

  const handleBlockTypeChange = (type: TBlockType) => {
    if (!selectedBlockId) return;
    updateBlock(selectedBlockId, { type });
  };

  const handleTextAlignChange = (align: TTextAlign) => {
    if (!selectedBlockId) return;
    updateBlock(selectedBlockId, { align });
  };

  const handleTextCaseChange = (textCase: TTextCase) => {
    if (!selectedBlockId) return;
    const block = blocks.find(b => b.id === selectedBlockId);
    if (block && 'content' in block) {
      updateBlock(selectedBlockId, { textCase });
    }
  };

  const handleActiveFormatsChange = (formats: FormatState) => {
    setActiveFormats(formats);
  };

  const handleImport = (importedBlocks: TArticleBlock[]) => {
    const processedBlocks = importedBlocks.map(block => ({
      ...block,
      id: nanoid(10),
      modified: new Date().toISOString(),
    }));
    
    updateHistory([...blocks, ...processedBlocks]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newBlocks = arrayMove(items, oldIndex, newIndex);
        onChange?.({ blocks: newBlocks });
        return newBlocks;
      });
    }
  };

  const renderBlock = (block: TArticleBlock) => {
    switch (block.type) {
      case 'H1':
      case 'H2':
      case 'H3':
      case 'P':
      case 'CAPTION':
        if ('content' in block) {
          return (
            <TextBlock 
              block={block as ITextBlock} 
              onUpdate={(updates) => updateBlock(block.id, updates)}
              onDelete={() => deleteBlock(block.id)}
              onAdd={(type) => addBlock(type, block.id)}
              activeFormats={selectedBlockId === block.id ? activeFormats : undefined}
              onActiveFormatsChange={handleActiveFormatsChange}
              onEnterPress={() => addBlock('P', block.id)}
            />
          );
        }
        return null;
      case 'FORMULA':
        if ('source' in block && 'content' in block) {
          return (
            <div className="my-4">
              <Formula
                source={block.source}
                content={block.content}
                reference={block.ref}
              />
            </div>
          );
        }
        return <FormulaBlock block={block as IFormulaBlock} onUpdate={(updates) => updateBlock(block.id, updates)} />;
      case 'IMAGE':
        if ('variant' in block && 'images' in block && 'src' in block) {
          return <ImageBlock block={block as IImageBlock} onUpdate={(updates) => updateBlock(block.id, updates)} />;
        }
        return null;
      default:
        return null;
    }
  };

  const handleFormatClick = (format: 'bold' | 'italic' | 'underline' | 'superscript') => {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || !('content' in block)) return;

    setActiveFormats(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const handleClearFormat = () => {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || !('content' in block)) return;

    setActiveFormats({
      bold: false,
      italic: false,
      underline: false,
      superscript: false
    });

    updateBlock(block.id, {
      align: 'left',
      textCase: 'normal'
    });
  };

  const handleListClick = (type: 'bullet' | 'number') => {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || !('content' in block)) return;

    if (block.type === 'H1' || block.type === 'H2' || block.type === 'H3' || block.type === 'P' || block.type === 'CAPTION') {
      if (block.listType === type) {
        updateBlock(block.id, {
          listType: undefined
        });
      } else {
        updateBlock(block.id, {
          listType: type
        });
      }
    }
  };

  const handleFormulaClick = () => {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || !('content' in block)) return;

    if (block.type === 'H1' || block.type === 'H2' || block.type === 'H3' || block.type === 'P' || block.type === 'CAPTION') {
      const editorElement = document.querySelector(`[data-block-id="${selectedBlockId}"] .ProseMirror`);
      const editor = (editorElement as any)?.__editor;
      
      if (editor) {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        
        if (selectedText) {
          // Если есть выделенный текст, конвертируем его в формулу
          editor.chain().focus().setFormula(selectedText).run();
        } else {
          // Если нет выделенного текста, создаем пустую формулу
          editor.chain().focus().setFormula('').run();
        }
        return;
      }
    }

    // Если это не текстовый блок или нет выделения, создаем новый блок формулы
    const newBlock: TArticleBlock = {
      id: nanoid(10),
      type: 'FORMULA',
      source: 'latex',
      content: '',
      indent: 0,
      modified: new Date().toISOString(),
      $new: true
    };

    const blockIndex = blocks.findIndex(b => b.id === selectedBlockId);
    const newBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      newBlock,
      ...blocks.slice(blockIndex + 1)
    ];

    updateHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const handleIndentChange = (direction: 'left' | 'right') => {
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block) return;

    const currentIndent = block.indent || 0;
    let newIndent = currentIndent;

    if (direction === 'right' && currentIndent < 4) {
      newIndent = currentIndent + 1;
    } else if (direction === 'left' && currentIndent > 0) {
      newIndent = currentIndent - 1;
    }

    if (newIndent !== currentIndent) {
      updateBlock(block.id, { indent: newIndent });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ActiveBlockToolbar
        blockId={selectedBlockId}
        onBlockTypeChange={handleBlockTypeChange}
        onTextAlignChange={handleTextAlignChange}
        onTextCaseChange={handleTextCaseChange}
        onFormatClick={handleFormatClick}
        onClearFormat={handleClearFormat}
        onListClick={handleListClick}
        onFormulaClick={handleFormulaClick}
        onIndentChange={handleIndentChange}
        canIndentLeft={selectedBlockId ? (blocks.find(b => b.id === selectedBlockId)?.indent || 0) > 0 : false}
        canIndentRight={selectedBlockId ? (blocks.find(b => b.id === selectedBlockId)?.indent || 0) < 4 : false}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        activeFormats={activeFormats}
      />
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center mb-4 px-4">
          <ImportDocument onImport={handleImport} />
        </div>
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm">
            {blocks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-gray-500">
                    <h3 className="text-lg font-medium mb-2">Начните создавать статью</h3>
                    <p className="text-sm mb-4">Выберите тип блока, чтобы начать</p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => addBlock('H1')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <span className="text-lg font-bold text-gray-400 group-hover:text-blue-500">H1</span>
                        <span className="text-gray-500 group-hover:text-blue-600">Заголовок</span>
                      </button>
                      <span className="text-2xl font-bold text-gray-400">∨</span>
                      <button
                        onClick={() => addBlock('P')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <span className="text-lg font-bold text-gray-400 group-hover:text-blue-500">¶</span>
                        <span className="text-gray-500 group-hover:text-blue-600">Параграф</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Используйте панель инструментов для форматирования
                  </div>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map(block => block.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onUpdate={(updates) => updateBlock(block.id, updates)}
                      onDelete={() => deleteBlock(block.id)}
                      onAdd={(type) => addBlock(type, block.id)}
                      activeFormats={selectedBlockId === block.id ? activeFormats : undefined}
                      onActiveFormatsChange={handleActiveFormatsChange}
                      onEnterPress={() => addBlock('P', block.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setShowPreview(true)}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
          title="Предпросмотр статьи"
        >
          <MdPreview className="w-6 h-6" />
        </button>
        <JsonPreview blocks={blocks} />
      </div>
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-auto">
          <div className="bg-gray-100 rounded-lg shadow-xl w-full min-h-screen relative">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              title="Закрыть предпросмотр"
            >
              <MdClose className="w-6 h-6" />
            </button>
            <ArticlePreview blocks={blocks} />
          </div>
        </div>
      )}
    </div>
  );
}; 