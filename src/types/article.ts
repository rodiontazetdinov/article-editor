export type BlockType = 'H1' | 'P' | 'RENDER' | 'FORMULA' | 'IMAGE';

export interface BaseBlock {
  id: string;
  indent: number;
  type: BlockType;
  modified: string;
  $new?: boolean;
}

export interface TextBlock extends BaseBlock {
  type: 'H1' | 'P';
  content: string;
}

export interface FormulaBlock extends BaseBlock {
  type: 'FORMULA';
  source: 'latex';
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'IMAGE';
  variant: string;
  images: string[];
  src: string;
}

export interface RenderBlock extends BaseBlock {
  type: 'RENDER';
}

export type ArticleBlock = TextBlock | FormulaBlock | ImageBlock | RenderBlock;

export interface Article {
  blocks: ArticleBlock[];
} 