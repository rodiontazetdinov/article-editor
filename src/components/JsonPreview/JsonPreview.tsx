import { useState } from 'react';
import { TArticleBlock } from '@/types/article';
import { MdCode } from 'react-icons/md';

interface JsonPreviewProps {
  blocks: TArticleBlock[];
}

export const JsonPreview = ({ blocks }: JsonPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    const json = JSON.stringify(blocks, null, 2);
    navigator.clipboard.writeText(json);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
        title="Показать JSON"
      >
        <MdCode className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
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
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(blocks, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 