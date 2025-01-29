export type TBlockType = 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
export type TTextAlign = 'left' | 'center' | 'right' | 'justify';
export type TTextCase = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TListType = 'bullet' | 'number';

export interface ArticleBlockBase {
  id: string;
  type: TBlockType;
  content: string;
  indent?: number;
  align?: TTextAlign;
  textCase?: TTextCase;
  $new?: boolean;
  modified?: string;
}

export interface ITextBlock extends ArticleBlockBase {
  type: 'H1' | 'H2' | 'H3' | 'P' | 'CAPTION';
  originalHTML?: string;
  listType?: 'ordered' | 'unordered';
  changes?: Array<{
    position: number;
    before: string;
    after: string;
  }>;
}

export interface IFormulaBlock extends ArticleBlockBase {
  type: 'FORMULA';
  inline?: boolean;
  changes?: Array<{
    position: number;
    before: string;
    after: string;
  }>;
}

export interface IImageBlock extends ArticleBlockBase {
  type: 'IMAGE';
  src?: string;
  images?: string[];
  variant?: string;
}

export type TArticleBlock = ITextBlock | IFormulaBlock | IImageBlock;

export interface IArticle {
  id: string;
  title: string;
  blocks: TArticleBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface IRenderBlock {
  id: string;
  type: TBlockType;
  indent?: number;
} 