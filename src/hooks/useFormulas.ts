import { useMutation } from '@tanstack/react-query';
import { checkFormulas } from '@/api/deepseek';
import { TArticleBlock } from '@/types/article';

export function useFormulas() {
  const checkFormulaMutation = useMutation({
    mutationFn: async (block: TArticleBlock & { onUpdate?: (updates: Partial<TArticleBlock>) => void }) => {
      const result = await checkFormulas(block);
      return { block, result };
    },
    onSuccess: ({ block, result }) => {
      if (result.changes.length > 0 && block.onUpdate) {
        // Создаем обновление с новыми изменениями
        const updates: Partial<TArticleBlock> = {
          content: result.corrected,
          changes: result.changes // Не объединяем изменения здесь, это делается в родительском компоненте
        };
        
        // Вызываем функцию обновления
        block.onUpdate(updates);
      }
    }
  });

  return {
    checkFormula: checkFormulaMutation.mutate,
    isChecking: checkFormulaMutation.isPending,
    error: checkFormulaMutation.error
  };
} 