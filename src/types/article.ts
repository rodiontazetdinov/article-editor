export type TBlockType = 'H1' | 'H2' | 'H3' | 'P' | 'CAPTION' | 'RENDER' | 'FORMULA' | 'IMAGE';
export type TTextAlign = 'left' | 'center' | 'right';
export type TTextCase = 'normal' | 'uppercase' | 'lowercase' | 'capitalize';

export interface IBaseBlock {
  id: string;
  indent: number;
  type: TBlockType;
  modified: string;
  align?: TTextAlign;
  textCase?: TTextCase;
  $new?: boolean;
}

export interface ITextBlock extends IBaseBlock {
  type: 'H1' | 'H2' | 'H3' | 'P' | 'CAPTION';
  content: string;
}

export interface IFormulaBlock extends IBaseBlock {
  type: 'FORMULA';
  source: 'latex';
  content: string;
  inline?: boolean;
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
  history?: {
    past: TArticleBlock[][];
    future: TArticleBlock[][];
  };
} 