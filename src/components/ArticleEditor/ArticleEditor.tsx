'use client';

import { useState, useCallback } from 'react';
import type { IArticle, TArticleBlock, ITextBlock, IFormulaBlock, IImageBlock, IRenderBlock, TBlockType, TTextAlign, TTextCase } from '@/types/article';
import { nanoid } from 'nanoid';
import { TextBlock } from '../blocks/TextBlock';
import { FormulaBlock } from '../blocks/FormulaBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { BlockWrapper } from '../blocks/BlockWrapper';
import { AddBlockButton } from '../blocks/AddBlockButton';
import { Toolbar } from '../Toolbar/Toolbar';
import { JsonPreview } from '../JsonPreview/JsonPreview';

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
  const [history, setHistory] = useState<{ past: TArticleBlock[][]; future: TArticleBlock[][] }>({ past: [], future: [] });
  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    superscript: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    superscript: false
  });

  const updateHistory = useCallback((newBlocks: TArticleBlock[]) => {
    setHistory(prev => ({
      past: [...prev.past, blocks],
      future: []
    }));
    setBlocks(newBlocks);
    onChange?.({ blocks: newBlocks });
  }, [blocks, onChange]);

  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    setHistory({
      past: newPast,
      future: [blocks, ...history.future]
    });
    setBlocks(previous);
    onChange?.({ blocks: previous });
  }, [blocks, history, onChange]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    setHistory({
      past: [...history.past, blocks],
      future: newFuture
    });
    setBlocks(next);
    onChange?.({ blocks: next });
  }, [blocks, history, onChange]);

  const createBlock = (type: TArticleBlock['type']): TArticleBlock => {
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

  const addBlock = (type: TArticleBlock['type'], afterId?: string) => {
    const newBlock = createBlock(type);
    let newBlocks: TArticleBlock[];

    if (!afterId) {
      newBlocks = [...blocks, newBlock];
    } else {
      const index = blocks.findIndex(block => block.id === afterId);
      newBlocks = [
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1)
      ];
    }

    updateHistory(newBlocks);
  };

  const updateBlock = (id: string, updates: Partial<TArticleBlock>) => {
    const newBlocks = blocks.map(block => {
      if (block.id !== id) return block;
      const updatedBlock = { ...block, ...updates, modified: new Date().toISOString() };
      return updatedBlock as TArticleBlock;
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

  const handleFormatClick = (format: 'bold' | 'italic' | 'underline' | 'superscript') => {
    setActiveFormats(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const handleActiveFormatsChange = (formats: typeof activeFormats) => {
    setActiveFormats(formats);
  };

  const handleListClick = (type: 'bullet' | 'number') => {
    if (!selectedBlockId) return;
    
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || block.type !== 'P') return;

    const blockElement = document.querySelector(`[data-block-id="${selectedBlockId}"]`);
    if (!blockElement) return;

    const editor = (blockElement as any)._editor;
    if (!editor) return;

    if (type === 'bullet') {
      editor.chain().focus().toggleBulletList().run();
    } else {
      editor.chain().focus().toggleOrderedList().run();
    }
  };

  const handleFormulaClick = () => {
    if (!selectedBlockId) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const formula = `<formula inline="true" source="latex">${selectedText}</formula>`;
      document.execCommand('insertHTML', false, formula);
    } else {
      const formula = '<formula inline="true" source="latex">формула</formula>';
      document.execCommand('insertHTML', false, formula);
    }
  };

  const renderBlock = (block: TArticleBlock) => {
    switch (block.type) {
      case 'H1':
      case 'H2':
      case 'H3':
      case 'P':
      case 'CAPTION':
        return (
          <TextBlock 
            block={block} 
            onUpdate={(updates) => updateBlock(block.id, updates)}
            activeFormats={selectedBlockId === block.id ? activeFormats : undefined}
            onActiveFormatsChange={handleActiveFormatsChange}
            onEnterPress={() => addBlock('P', block.id)}
          />
        );
      case 'FORMULA':
        return <FormulaBlock block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />;
      case 'IMAGE':
        return <ImageBlock block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />;
      default:
        return null;
    }
  };

  const handleTextCase = (type: 'upper' | 'lower' | 'capitalize') => {
    if (selectedBlockId) {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (block?.type === 'P') {
        setBlocks(blocks.map(b => 
          b.id === selectedBlockId ? { ...b } : b
        ));
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Toolbar
        onBlockTypeChange={handleBlockTypeChange}
        onTextAlignChange={handleTextAlignChange}
        onTextCaseChange={handleTextCaseChange}
        onFormatClick={handleFormatClick}
        onListClick={handleListClick}
        onFormulaClick={handleFormulaClick}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        activeFormats={activeFormats}
      />
      <div className="p-4">
        <div>
          {blocks.length === 0 ? (
            <div className="text-center py-12">
              <AddBlockButton onAdd={(type) => addBlock(type)} />
              <p className="text-gray-500 mt-4">Нажмите + чтобы добавить первый блок</p>
            </div>
          ) : (
            blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                className={`relative ${selectedBlockId === block.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
              >
                <BlockWrapper
                  block={block}
                  onUpdate={(updates) => updateBlock(block.id, updates)}
                  onDelete={() => deleteBlock(block.id)}
                  onAdd={(type) => addBlock(type, block.id)}
                >
                  {renderBlock(block)}
                </BlockWrapper>
              </div>
            ))
          )}
        </div>
      </div>
      <JsonPreview blocks={blocks} />
    </div>
  );
}; 