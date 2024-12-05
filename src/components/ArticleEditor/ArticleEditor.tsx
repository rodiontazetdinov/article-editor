'use client';

import { useState } from 'react';
import type { IArticle, TArticleBlock, ITextBlock, IFormulaBlock, IImageBlock, IRenderBlock } from '@/types/article';
import { nanoid } from 'nanoid';
import { TextBlock } from '../blocks/TextBlock';
import { FormulaBlock } from '../blocks/FormulaBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { BlockWrapper } from '../blocks/BlockWrapper';

interface ArticleEditorProps {
  initialData?: IArticle;
  onChange?: (article: IArticle) => void;
}

export const ArticleEditor = ({ initialData, onChange }: ArticleEditorProps) => {
  const [blocks, setBlocks] = useState<TArticleBlock[]>(initialData?.blocks || []);

  const addBlock = (type: TArticleBlock['type']) => {
    const baseBlock = {
      id: nanoid(10),
      indent: 0,
      type,
      modified: new Date().toISOString(),
      $new: true,
    };

    let newBlock: TArticleBlock;
    
    if (type === 'H1' || type === 'P') {
      newBlock = { ...baseBlock, type, content: '' } as ITextBlock;
    } else if (type === 'FORMULA') {
      newBlock = { ...baseBlock, type, source: 'latex', content: '' } as IFormulaBlock;
    } else if (type === 'IMAGE') {
      newBlock = { ...baseBlock, type, variant: '1', images: [], src: '' } as IImageBlock;
    } else {
      newBlock = { ...baseBlock, type } as IRenderBlock;
    }

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange?.({ blocks: newBlocks });
  };

  const updateBlock = (id: string, updates: Partial<TArticleBlock>) => {
    const newBlocks = blocks.map(block => {
      if (block.id !== id) return block;
      const updatedBlock = { ...block, ...updates, modified: new Date().toISOString() };
      return updatedBlock as TArticleBlock;
    });
    setBlocks(newBlocks);
    onChange?.({ blocks: newBlocks });
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id);
    setBlocks(newBlocks);
    onChange?.({ blocks: newBlocks });
  };

  const renderBlock = (block: TArticleBlock) => {
    switch (block.type) {
      case 'H1':
      case 'P':
        return <TextBlock block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />;
      case 'FORMULA':
        return <FormulaBlock block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />;
      case 'IMAGE':
        return <ImageBlock block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        {blocks.map((block) => (
          <BlockWrapper
            key={block.id}
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onDelete={() => deleteBlock(block.id)}
          >
            {renderBlock(block)}
          </BlockWrapper>
        ))}
      </div>
      <div className="mt-4 space-x-2">
        <button
          onClick={() => addBlock('H1')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Добавить заголовок
        </button>
        <button
          onClick={() => addBlock('P')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Добавить параграф
        </button>
        <button
          onClick={() => addBlock('FORMULA')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Добавить формулу
        </button>
        <button
          onClick={() => addBlock('IMAGE')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Добавить изображение
        </button>
      </div>
    </div>
  );
}; 