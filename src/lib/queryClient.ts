import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Данные не устаревают автоматически
      gcTime: 1000 * 60 * 5, // Кэш живет 5 минут
      retry: false, // Не повторяем запросы при ошибке
    },
    mutations: {
      retry: false,
    },
  },
}); 