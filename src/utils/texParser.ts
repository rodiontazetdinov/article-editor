import { TeXParser } from './mathParser';
import { TArticleBlock, TBlockType, ITextBlock, IFormulaBlock } from '@/types/article';

export class TexDocumentParser {
  private mathParser: TeXParser;
  
  constructor() {
    this.mathParser = new TeXParser();
  }

  private findClosingBrace(text: string, startPos: number): number {
    let braceCount = 1;
    let pos = startPos;
    
    while (braceCount > 0 && pos < text.length) {
      if (text[pos] === '{') braceCount++;
      if (text[pos] === '}') braceCount--;
      pos++;
    }
    
    return braceCount === 0 ? pos - 1 : -1;
  }

  private processCommand(command: string, content: string): string {
    switch (command) {
      case '\\Large':
      case '\\large':
      case '\\bf':
        return content;
      case '\\omega':
        return 'ω';
      case '\\mbox':
        return content;
      default:
        return `${command}{${content}}`;
    }
  }

  private parseCommand(text: string): { command: string, content: string, rest: string } {
    let pos = 0;
    let command = '';
    
    // Читаем команду
    while (pos < text.length && /[a-zA-Z]/.test(text[pos])) {
      command += text[pos];
      pos++;
    }
    
    // Если после команды нет открывающей скобки, возвращаем команду как есть
    if (pos >= text.length || text[pos] !== '{') {
      return {
        command: '\\' + command,
        content: '',
        rest: text.slice(pos)
      };
    }
    
    // Ищем закрывающую скобку
    const contentStart = pos + 1;
    const contentEnd = this.findClosingBrace(text, contentStart);
    
    if (contentEnd === -1) {
      return {
        command: '\\' + command,
        content: text.slice(contentStart),
        rest: ''
      };
    }
    
    return {
      command: '\\' + command,
      content: text.slice(contentStart, contentEnd),
      rest: text.slice(contentEnd + 1)
    };
  }

  private parseEnvironment(content: string, envName: string): { content: string, rest: string } {
    console.log(`Парсинг окружения ${envName}`);
    const beginStr = `\\begin{${envName}}`;
    const endStr = `\\end{${envName}}`;
    
    if (!content.startsWith(beginStr)) {
      console.log(`Окружение ${envName} не найдено`);
      return { content: '', rest: content };
    }
    
    const startContent = beginStr.length;
    const endContent = content.indexOf(endStr);
    
    if (endContent === -1) {
      console.log(`Не найден конец окружения ${envName}`);
      return { content: '', rest: content };
    }
    
    console.log(`Найдено окружение ${envName}`);
    const envContent = content.slice(startContent, endContent);
    const rest = content.slice(endContent + endStr.length).trim();
    
    return { content: envContent, rest };
  }

  private processEnvironment(envName: string, content: string): string {
    switch (envName) {
      case 'center':
        return content.trim();
      case 'picture':
        // Пропускаем picture окружения, так как они обрабатываются отдельно
        return '';
      default:
        return `\\begin{${envName}}${content}\\end{${envName}}`;
    }
  }

  private parseSections(content: string): TArticleBlock[] {
    console.log('Начало парсинга секций');
    console.log(`Длина контента: ${content.length} символов`);
    
    const blocks: TArticleBlock[] = [];
    let currentContent = content;
    let currentText = '';
    let safetyCounter = 0;
    const MAX_ITERATIONS = 10000;

    const flushText = () => {
      if (currentText.trim()) {
        const textBlock: ITextBlock = {
          type: 'P',
          content: currentText.trim(),
          indent: 0,
          modified: new Date().toISOString(),
          id: `p-${blocks.length}`
        };
        blocks.push(textBlock);
        currentText = '';
      }
    };

    while (currentContent && safetyCounter < MAX_ITERATIONS) {
      safetyCounter++;
      let matched = false;
      console.log(`Итерация ${safetyCounter}, осталось символов: ${currentContent.length}`);

      // Проверяем начало команды или окружения
      if (currentContent.startsWith('\\')) {
        const commandMatch = currentContent.slice(1).match(/^([a-zA-Z]+)/);
        if (commandMatch) {
          const command = commandMatch[1];
          
          // Проверяем, является ли это началом окружения
          if (command === 'begin') {
            const envNameStart = currentContent.indexOf('{');
            const envNameEnd = currentContent.indexOf('}');
            if (envNameStart !== -1 && envNameEnd !== -1) {
              const envName = currentContent.slice(envNameStart + 1, envNameEnd);
              const { content: envContent, rest } = this.parseEnvironment(currentContent, envName);
              
              flushText();
              
              if (envContent) {
                const processedContent = this.processEnvironment(envName, envContent);
                if (processedContent) {
                  currentText += processedContent;
                }
              }
              
              currentContent = rest;
              matched = true;
            }
          } else {
            // Обрабатываем обычную команду
            const { command: cmd, content: cmdContent, rest } = this.parseCommand(currentContent.slice(1));
            const processedContent = this.processCommand(cmd, cmdContent);
            currentText += processedContent;
            currentContent = rest;
            matched = true;
          }
        }
      }

      // Проверяем формулы
      if (!matched) {
        if (currentContent.startsWith('$$')) {
          flushText();
          
          const endIndex = currentContent.indexOf('$$', 2);
          if (endIndex !== -1) {
            const formula = currentContent.slice(2, endIndex);
            const mathBlock = this.mathParser.parseFormula(formula);
            
            const formulaBlock: IFormulaBlock = {
              type: 'FORMULA',
              content: mathBlock.content,
              inline: false,
              source: 'latex',
              indent: 0,
              modified: new Date().toISOString(),
              id: `formula-${blocks.length}`
            };
            blocks.push(formulaBlock);
            
            currentContent = currentContent.slice(endIndex + 2).trim();
            matched = true;
          }
        } else if (currentContent.startsWith('$')) {
          const endIndex = currentContent.indexOf('$', 1);
          if (endIndex !== -1) {
            const formula = currentContent.slice(1, endIndex);
            const mathBlock = this.mathParser.parseFormula(formula);
            currentText += `<formula inline="true" source="latex">${mathBlock.content}</formula>`;
            currentContent = currentContent.slice(endIndex + 1);
            matched = true;
          }
        }
      }

      // Если ничего не совпало, добавляем символ к текущему тексту
      if (!matched) {
        currentText += currentContent[0];
        currentContent = currentContent.slice(1);
      }

      if (safetyCounter === MAX_ITERATIONS) {
        console.error('Достигнут лимит итераций при парсинге');
        break;
      }
    }

    // Добавляем оставшийся текст
    flushText();

    console.log(`Парсинг завершен. Создано ${blocks.length} блоков`);
    return blocks;
  }

  public parseTeX(content: string): TArticleBlock[] {
    try {
      console.log('Начало парсинга TeX файла');
      // Удаляем комментарии и лишние пробелы
      const cleanContent = content
        .replace(/%.*$/gm, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n\n+/g, '\n')
        .trim();
      
      console.log('Комментарии удалены');
      
      // Находим преамбулу и основной текст
      const documentStart = cleanContent.indexOf('\\begin{document}');
      const documentEnd = cleanContent.indexOf('\\end{document}');
      
      console.log(`Найдены границы документа: start=${documentStart}, end=${documentEnd}`);
      
      if (documentStart === -1 || documentEnd === -1) {
        console.log('Документ без окружения document, парсим весь текст');
        return this.parseSections(cleanContent);
      }
      
      // Парсим только содержимое document
      const mainContent = cleanContent.slice(
        documentStart + '\\begin{document}'.length,
        documentEnd
      );
      
      console.log('Извлечено содержимое документа');
      return this.parseSections(mainContent.trim());
    } catch (error) {
      console.error('Ошибка при парсинге TeX документа:', error);
      const errorBlock: ITextBlock = {
        type: 'P',
        content: 'Error parsing TeX document',
        indent: 0,
        modified: new Date().toISOString(),
        id: 'error-0'
      };
      return [errorBlock];
    }
  }
} 