interface DocumentResponse {
  status: 'success';
  filename: string;
  blocks: Array<{
    type: 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
    content: string;
    isInline?: boolean;
    indent?: number;
  }>;
}

const PARSER_URL = 'http://localhost:8000';

export const documentAPI = {
  async parseFile(file: File): Promise<DocumentResponse> {
    console.log('Отправка файла на парсинг:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${PARSER_URL}/parse`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервиса: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('Результат парсинга:', {
        filename: result.filename,
        totalBlocks: result.blocks.length,
        blockTypes: result.blocks.map(b => b.type)
      });

      return result;
      
    } catch (error) {
      console.error('Ошибка при парсинге файла:', error);
      throw error;
    }
  }
}; 