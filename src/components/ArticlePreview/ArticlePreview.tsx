import { TArticleBlock } from '@/types/article';
import Image from 'next/image';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

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
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );
      case 'H2':
        return (
          <h2 
            className="text-3xl font-bold mb-4 mt-6"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );
      case 'H3':
        return (
          <h3 
            className="text-2xl font-bold mb-3 mt-5"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );
      case 'P':
        return (
          <p 
            className="text-lg mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );
      case 'CAPTION':
        return (
          <p 
            className="text-sm text-gray-600 mb-4 italic"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );
      case 'IMAGE':
        return block.src ? (
          <div className="my-6">
            <div className="relative w-full h-[400px]">
              <Image
                src={block.src}
                alt="Article image"
                fill
                className="object-contain"
              />
            </div>
          </div>
        ) : null;
      case 'FORMULA':
        return (
          <div className="my-6 flex justify-center">
            <InlineMath math={block.content || ''} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-6 py-8 bg-white">
      {blocks.map((block) => (
        <div key={block.id} className={block.align ? `text-${block.align}` : ''}>
          {renderBlock(block)}
        </div>
      ))}
    </article>
  );
}; 