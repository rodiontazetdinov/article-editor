import { useState } from 'react';
import { docxToBlocks, parseLatexToJson } from '@/utils/documentParser';

interface ImportDocumentProps {
  onImport: (blocks: any[]) => void;
}

export const ImportDocument: React.FC<ImportDocumentProps> = ({ onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      let blocks: any[] = [];
      
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        blocks = await docxToBlocks(arrayBuffer);
      } else if (file.name.endsWith('.tex')) {
        const text = await file.text();
        blocks = parseLatexToJson(text);
      } else {
        throw new Error('Неподдерживаемый формат файла. Поддерживаются только .docx и .tex файлы');
      }

      onImport(blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при импорте файла');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full h-64 
            border-2 border-dashed rounded-lg cursor-pointer 
            ${isLoading ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'} 
            ${error ? 'border-red-300' : 'border-gray-300'}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isLoading ? (
              <div className="text-gray-500">Загрузка...</div>
            ) : (
              <>
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
                </p>
                <p className="text-xs text-gray-500">DOCX или TEX</p>
              </>
            )}
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            accept=".docx,.tex"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </label>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}; 