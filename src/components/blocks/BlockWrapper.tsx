import { TArticleBlock } from '@/types/article';
import { useState, useRef, useEffect } from 'react';
import { MdDelete, MdCode, MdAdd, MdTitle, MdTextFields, MdFunctions, MdImage, MdMoreVert, MdScience } from 'react-icons/md';
import { checkFormulas } from '@/api/deepseek';

interface BlockWrapperProps {
  block: TArticleBlock;
  onUpdate: (updates: Partial<TArticleBlock>) => void;
  onDelete: () => void;
  onAdd: (type: TArticleBlock['type']) => void;
  blockControls?: React.ReactNode;
  children: React.ReactNode;
}

export const BlockWrapper = ({ block, onUpdate, onDelete, onAdd, blockControls, children }: BlockWrapperProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckFormulas = async () => {
    if (!block.content) return;
    
    setIsChecking(true);
    try {
      const result = await checkFormulas(block);
      console.log('Результат проверки:', result);
      
      if (result.changes.length > 0) {
        // Применяем изменения к блоку
        onUpdate({ 
          content: result.corrected,
          changes: result.changes
        });
        
        // Показываем уведомление об изменениях
        const changesCount = result.changes.length;
        alert(`Исправлено формул: ${changesCount}`);
      } else {
        alert('Ошибок в формулах не найдено');
      }
    } catch (error) {
      console.error('Ошибка при проверке формул:', error);
      alert('Ошибка при проверке формул');
    } finally {
      setIsChecking(false);
    }
  };

  const blockTypes = [
    { type: 'H1' as const, icon: MdTitle, label: 'Заголовок' },
    { type: 'P' as const, icon: MdTextFields, label: 'Параграф' },
    { type: 'FORMULA' as const, icon: MdFunctions, label: 'Формула' },
    { type: 'IMAGE' as const, icon: MdImage, label: 'Изображение' },
  ];

  return (
    <div className="group/block relative">
      {/* Основной контент */}
      <div className="relative">
        {children}
      </div>

      {/* Контекстное меню */}
      <div className="absolute right-0 top-0 opacity-0 group-hover/block:opacity-100 transition-opacity duration-200">
        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckFormulas}
              disabled={isChecking}
              className={`p-1.5 rounded-md hover:bg-blue-50 text-blue-500 
                transition-colors ${isChecking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Проверить формулы"
              aria-label="Проверить формулы в блоке"
            >
              <MdScience className="w-4 h-4" />
              {isChecking && (
                <span className="absolute -top-1 -right-1 w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MdMoreVert className="w-4 h-4" />
            </button>
          </div>

          {showMenu && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
                {block.type}
              </div>
              
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700 text-sm"
              >
                <MdCode className="w-4 h-4" />
                <span>{showJson ? "Скрыть JSON" : "Показать JSON"}</span>
              </button>

              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600 text-sm"
              >
                <MdDelete className="w-4 h-4" />
                <span>Удалить блок</span>
              </button>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500">
                  Добавить блок
                </div>
                {blockTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => {
                      onAdd(type.type);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                  >
                    <type.icon className="w-4 h-4" />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON представление */}
      {showJson && (
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200 font-mono text-xs text-gray-600 overflow-x-auto">
          <pre>{JSON.stringify(block, null, 2)}</pre>
        </div>
      )}

      {blockControls && (
        <div className="absolute right-8 top-0 opacity-0 group-hover/block:opacity-100 transition-opacity duration-200">
          {blockControls}
        </div>
      )}
    </div>
  );
}; 