import { TArticleBlock, ITextBlock, IFormulaBlock, IImageBlock } from '@/types/article';
import Image from 'next/image';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Функция предварительной обработки LaTeX формулы
const preprocessLatex = (latex: string) => {
  return latex
    // Исправляем пробелы в командах
    .replace(/\\left\s*{/g, '\\left\\{')
    .replace(/\\right\s*}/g, '\\right\\}')
    .replace(/\\left\s*\(/g, '\\left(')
    .replace(/\\right\s*\)/g, '\\right)')
    .replace(/\\left\s*\[/g, '\\left[')
    .replace(/\\right\s*\]/g, '\\right]')
    // Исправляем overset
    .replace(/\\overset\s*{/g, '\\overset{')
    .replace(/\\overset\s*{\\overline}/g, '\\overline')
    .replace(/\\overset\s*{\\cdot}/g, '\\dot')
    // Исправляем exp
    .replace(/exp\s*⁡/g, '\\exp')
    // Исправляем греческие буквы
    .replace(/\\alpha\s+\\overset/g, '\\alpha\\overset')
    .replace(/\\beta\s+\\right/g, '\\beta\\right')
    .replace(/\\sigma\s+\\alpha/g, '\\sigma\\alpha')
    // Исправляем множественные пробелы
    .replace(/\s+/g, ' ')
    .trim();
};

interface ArticlePreviewProps {
  blocks: TArticleBlock[];
}

export const ArticlePreview = ({ blocks }: ArticlePreviewProps) => {
  const renderBlock = (block: TArticleBlock) => {
    switch (block.type) {
      case 'H1':
        return (
          <h1 
            className="text-4xl font-bold mb-6 mt-8"
            dangerouslySetInnerHTML={{ __html: (block as ITextBlock).content || '' }}
          />
        );
      case 'H2':
        return (
          <h2 
            className="text-3xl font-bold mb-4 mt-6"
            dangerouslySetInnerHTML={{ __html: (block as ITextBlock).content || '' }}
          />
        );
      case 'H3':
        return (
          <h3 
            className="text-2xl font-bold mb-3 mt-5"
            dangerouslySetInnerHTML={{ __html: (block as ITextBlock).content || '' }}
          />
        );
      case 'P':
        const textBlock = block as ITextBlock;
        const content = textBlock.content;
        
        // Разбиваем контент на части, разделенные формулами
        const parts = content.split(/(\$.*?\$)/g);
        
        return (
          <p className="text-lg mb-4 leading-relaxed">
            {parts.map((part, index) => {
              if (part.startsWith('$') && part.endsWith('$')) {
                // Это формула - убираем символы $ и рендерим через KaTeX
                const formula = preprocessLatex(part.slice(1, -1));
                return (
                  <InlineMath 
                    key={index} 
                    math={formula} 
                    errorColor="#e53e3e"
                    renderError={(error) => {
                      console.error('KaTeX error:', error);
                      return (
                        <span 
                          style={{ 
                            color: '#e53e3e',
                            cursor: 'help',
                            borderBottom: '1px dotted #e53e3e'
                          }}
                          title={error.message}
                        >
                          ${part.slice(1, -1)}$
                        </span>
                      );
                    }}
                  />
                );
              } else {
                // Это обычный текст - рендерим как HTML
                return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
              }
            })}
          </p>
        );
      case 'CAPTION':
        return (
          <p 
            className="text-sm text-gray-600 mb-4 italic"
            dangerouslySetInnerHTML={{ __html: (block as ITextBlock).content || '' }}
          />
        );
      case 'IMAGE':
        const imageBlock = block as IImageBlock;
        return imageBlock.src ? (
          <div className="my-6">
            <div className="relative w-full h-[400px]">
              <Image
                src={imageBlock.src}
                alt="Article image"
                fill
                className="object-contain"
              />
            </div>
          </div>
        ) : null;
      case 'FORMULA':
        const formulaBlock = block as IFormulaBlock;
        // Разделяем формулу и номер
        const [formula, numberPart] = (formulaBlock.content || '').split('#').map(part => part.trim());
        const number = numberPart?.replace(/[()]/g, '').trim();
        
        return (
          <div className="my-6 flex justify-center items-center gap-4">
            <BlockMath 
              math={preprocessLatex(formula)} 
              errorColor="#e53e3e"
              renderError={(error) => {
                console.error('KaTeX error:', error);
                return (
                  <div 
                    style={{ 
                      color: '#e53e3e',
                      cursor: 'help',
                      borderBottom: '1px dotted #e53e3e',
                      padding: '1rem'
                    }}
                    title={error.message}
                  >
                    {formula}
                  </div>
                );
              }}
            />
            {number && (
              <div className="text-lg text-gray-600">
                ({number})
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-6 py-8 bg-white">
      {blocks.map((block) => {
        const textBlock = block as ITextBlock;
        return (
          <div 
            key={block.id} 
            className={textBlock.align ? `text-${textBlock.align}` : ''}
            style={{ 
              paddingLeft: `${block.indent * 2}rem`,
              transition: 'padding-left 0.2s ease-in-out'
            }}
          >
            {renderBlock(block)}
          </div>
        );
      })}
    </article>
  );
}; 