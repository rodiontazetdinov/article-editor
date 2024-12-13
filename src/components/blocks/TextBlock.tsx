import React, { useEffect, useRef, useCallback } from 'react';
import type { ITextBlock } from '@/types/article';

interface TextBlockProps {
  block: ITextBlock;
  onUpdate: (updates: Partial<ITextBlock>) => void;
  activeFormats?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    superscript: boolean;
  };
  onActiveFormatsChange?: (formats: NonNullable<TextBlockProps['activeFormats']>) => void;
  onEnterPress?: () => void;
}

export const TextBlock = ({ 
  block, 
  onUpdate, 
  activeFormats, 
  onActiveFormatsChange,
  onEnterPress 
}: TextBlockProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Инициализация контента
  useEffect(() => {
    if (!editorRef.current) return;
    const content = block.content?.replace('<!---->', '') || '';
    if (content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [block.content]);

  // Обработка форматирования
  useEffect(() => {
    if (!activeFormats || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    if (range.collapsed) return;

    // Получаем выделенный текст
    const selectedText = range.toString();
    if (!selectedText) return;

    // Форматируем текст
    let formattedText = selectedText;
    if (activeFormats.bold) formattedText = `<strong>${formattedText}</strong>`;
    if (activeFormats.italic) formattedText = `<em>${formattedText}</em>`;
    if (activeFormats.underline) formattedText = `<u>${formattedText}</u>`;
    if (activeFormats.superscript) formattedText = `<sup>${formattedText}</sup>`;

    // Удаляем старое выделение и вставляем новый текст
    range.deleteContents();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    range.insertNode(fragment);

    // Добавляем пробел после форматированного текста
    const space = document.createTextNode(' ');
    range.collapse(false);
    range.insertNode(space);

    // Перемещаем курсор после пробела
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Обновляем контент
    onUpdate({ content: editorRef.current.innerHTML + '<!---->' });

    // Сбрасываем форматирование
    onActiveFormatsChange?.({
      bold: false,
      italic: false,
      underline: false,
      superscript: false
    });
  }, [activeFormats, onActiveFormatsChange, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnterPress?.();
    }
  }, [onEnterPress]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    onUpdate({ content: editorRef.current.innerHTML + '<!---->' });
  }, [onUpdate]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const getFontSize = () => {
    switch (block.type) {
      case 'H1': return 'text-4xl font-bold';
      case 'H2': return 'text-3xl font-bold';
      case 'H3': return 'text-2xl font-bold';
      case 'CAPTION': return 'text-sm text-gray-600';
      default: return 'text-base';
    }
  };

  const getAlignment = () => {
    switch (block.align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div
      ref={editorRef}
      className={`w-full outline-none ${getFontSize()} ${getAlignment()}`}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onPaste={handlePaste}
      data-placeholder={block.type === 'CAPTION' ? 'Подпись' : block.type === 'P' ? 'Текст параграфа' : 'Заголовок'}
      data-block-id={block.id}
      spellCheck={false}
    />
  );
}; 