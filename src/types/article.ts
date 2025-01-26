export type TBlockType = 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
export type TTextAlign = 'left' | 'center' | 'right' | 'justify';
export type TTextCase = 'normal' | 'uppercase' | 'lowercase' | 'capitalize';

interface BaseBlock {
  id: string;
  type: TBlockType;
  indent: number;
  modified: string;
  $new?: boolean;
}

export interface ITextBlock extends BaseBlock {
  type: 'H1' | 'H2' | 'H3' | 'P' | 'CAPTION';
  content: string;
  align?: TTextAlign;
  textCase?: TTextCase;
  listType?: 'bullet' | 'number';
}

export interface IFormulaBlock extends BaseBlock {
  type: 'FORMULA';
  source: 'latex' | 'math';
  content: string;
  latex?: string;
  ref?: string;
  inline?: boolean;
}

export interface IImageBlock extends BaseBlock {
  type: 'IMAGE';
  variant: string;
  images: string[];
  src: string;
  content?: string;
}

export interface IRenderBlock extends BaseBlock {
  type: TBlockType;
}

export type TArticleBlock = ITextBlock | IFormulaBlock | IImageBlock | IRenderBlock;

export interface IArticle {
  blocks: TArticleBlock[];
} 