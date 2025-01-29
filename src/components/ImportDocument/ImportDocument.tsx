import { useState } from 'react';
import { documentAPI } from '@/api/pdf';
import { MdUpload, MdError, MdCheckCircle } from 'react-icons/md';
import { useDropzone } from 'react-dropzone';

interface ImportDocumentProps {
  onImport: (blocks: any[]) => void;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.tex'],
  'application/json': ['.json']
};

export const ImportDocument: React.FC<ImportDocumentProps> = ({ onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await processFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    multiple: false
  });

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      // Отправляем файл на парсинг
      const result = await documentAPI.parseFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.blocks.length === 0) {
        throw new Error('Не удалось извлечь содержимое из документа');
      }
      
      onImport(result.blocks);
      
      // Сбрасываем прогресс через некоторое время
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Ошибка при обработке файла:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при импорте файла');
      setIsLoading(false);
      setProgress(0);
    }
  };

  const getAcceptedTypesText = () => {
    return Object.values(ACCEPTED_TYPES)
      .flat()
      .join(', ')
      .replace(/\./g, '')
      .toUpperCase();
  };

  return (
    <div 
      {...getRootProps()} 
      className={`dropzone ${isDragActive ? 'active' : ''} ${error ? 'error' : ''}`}
    >
      <input {...getInputProps()} />
      
      {isLoading ? (
        <div className="loading-state">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <p>Обработка документа... {progress}%</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <MdError className="icon error" />
          <p>{error}</p>
        </div>
      ) : isDragActive ? (
        <div className="drag-active">
          <MdUpload className="icon" />
          <p>Отпустите файл здесь...</p>
        </div>
      ) : (
        <div className="idle-state">
          <MdUpload className="icon" />
          <p>Перетащите файл сюда или кликните для выбора</p>
          <p className="supported-formats">
            Поддерживаемые форматы: {getAcceptedTypesText()}
          </p>
        </div>
      )}
    </div>
  );
}; 