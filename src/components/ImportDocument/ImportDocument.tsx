import { useState } from 'react';
import { docxToBlocks, parseLatexToJson } from '@/utils/documentParser';
import { MdUpload, MdError, MdCheckCircle } from 'react-icons/md';

interface ImportDocumentProps {
  onImport: (blocks: any[]) => void;
}

export const ImportDocument: React.FC<ImportDocumentProps> = ({ onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      let blocks: any[] = [];
      
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        blocks = await docxToBlocks(arrayBuffer);
      } else if (file.name.endsWith('.tex')) {
        const text = await file.text();
        blocks = parseLatexToJson(text);
      } else {
        throw new Error('Поддерживаются только .docx и .tex файлы');
      }

      clearInterval(progressInterval);
      setProgress(100);
      onImport(blocks);
      
      // Сбрасываем прогресс через некоторое время
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при импорте файла');
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className="mb-4">
      <div 
        className="relative flex items-center justify-center w-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="dropzone-file"
          className={`
            flex items-center justify-center w-full h-32 
            border-2 border-dashed rounded-lg cursor-pointer 
            transition-all duration-200 ease-in-out
            ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
            ${isLoading ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          <div className="flex items-center gap-3 px-4">
            {isLoading ? (
              <>
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Загрузка файла...</span>
                  <span className="text-xs text-gray-500">{progress}%</span>
                </div>
              </>
            ) : error ? (
              <>
                <MdError className="w-8 h-8 text-red-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-red-700">Ошибка загрузки</span>
                  <span className="text-xs text-red-500">{error}</span>
                </div>
              </>
            ) : progress === 100 ? (
              <>
                <MdCheckCircle className="w-8 h-8 text-green-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-green-700">Файл загружен</span>
                  <span className="text-xs text-green-500">Документ успешно импортирован</span>
                </div>
              </>
            ) : (
              <>
                <MdUpload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    Выберите файл или перетащите его сюда
                  </span>
                  <span className="text-xs text-gray-500">DOCX или TEX</span>
                </div>
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
      
      {/* Прогресс бар */}
      {progress > 0 && progress < 100 && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}; 