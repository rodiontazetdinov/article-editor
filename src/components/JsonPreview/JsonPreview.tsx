import { useState } from 'react';
import { TArticleBlock } from '@/types/article';
import { MdCode } from 'react-icons/md';
import { cleanArticleBlocks } from '@/utils/contentCleaner';

interface JsonPreviewProps {
  blocks: TArticleBlock[];
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({ blocks }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatBlockForExport = (block: TArticleBlock) => {
    // Сначала очищаем блок от HTML-мусора
    const cleanBlock = cleanArticleBlocks([block])[0];
    
    const baseBlock = {
      type: cleanBlock.type,
      content: 'content' in cleanBlock ? cleanBlock.content : '',
      indent: cleanBlock.indent || 0,
      id: cleanBlock.id,
      modified: cleanBlock.modified
    };

    if (cleanBlock.type === 'FORMULA') {
      return {
        ...baseBlock,
        isInline: 'inline' in cleanBlock ? cleanBlock.inline : false
      };
    }

    if (cleanBlock.type === 'IMAGE') {
      return {
        ...baseBlock,
        variant: 'variant' in cleanBlock ? cleanBlock.variant : '1',
        images: 'images' in cleanBlock ? cleanBlock.images : [],
        src: 'src' in cleanBlock ? cleanBlock.src : ''
      };
    }

    return baseBlock;
  };

  const handleCopy = () => {
    const formattedBlocks = blocks.map(formatBlockForExport);
    const json = JSON.stringify(formattedBlocks, null, 2);
    navigator.clipboard.writeText(json);
  };

  const handleDownload = () => {
    const formattedBlocks = blocks.map(formatBlockForExport);
    const json = JSON.stringify(formattedBlocks, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
        title="Показать JSON"
      >
        <MdCode className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Предпросмотр JSON</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  Копировать
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                >
                  Скачать
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(blocks.map(formatBlockForExport), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 