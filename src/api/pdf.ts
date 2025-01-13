const PDF_SERVICE_URL = 'https://service-pdf.teach-in.ru';

interface PDFResponse {
  blocks: Array<{
    type: 'H1' | 'H2' | 'H3' | 'P' | 'FORMULA' | 'IMAGE' | 'CAPTION';
    content: string;
    isInline?: boolean;
  }>;
}

export const pdfAPI = {
  async extractText(file: File): Promise<PDFResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(PDF_SERVICE_URL, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Origin': 'http://localhost:5173'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервиса PDF: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка при обработке PDF:', error);
      throw error;
    }
  }
}; 