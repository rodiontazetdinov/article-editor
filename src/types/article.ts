export type TBlockType = 'H1' | 'P' | 'RENDER' | 'FORMULA' | 'IMAGE';

export interface IBaseBlock {
  id: string;
  indent: number;
  type: TBlockType;
  modified: string;
  $new?: boolean;
}

export interface ITextBlock extends IBaseBlock {
  type: 'H1' | 'P';
  content: string;
}

export interface IFormulaBlock extends IBaseBlock {
  type: 'FORMULA';
  source: 'latex';
  content: string;
}

export interface IImageBlock extends IBaseBlock {
  type: 'IMAGE';
  variant: string;
  images: string[];
  src: string;
}

export interface IRenderBlock extends IBaseBlock {
  type: 'RENDER';
}

export type TArticleBlock = ITextBlock | IFormulaBlock | IImageBlock | IRenderBlock;

export interface IArticle {
  blocks: TArticleBlock[];
} 