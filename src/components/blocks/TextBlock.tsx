import { ITextBlock } from '@/types/article';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import { useEffect } from 'react';

interface TextBlockProps {
  block: ITextBlock;
  onUpdate: (updates: Partial<ITextBlock>) => void;
  activeFormats?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    superscript: boolean;
  };
  onEnterPress?: () => void;
}

export const TextBlock = ({ block, onUpdate, activeFormats, onEnterPress }: TextBlockProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Superscript
    ],
    content: block.content?.replace('<!---->', '') || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnterPress?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML() + '<!---->'; // Добавляем комментарий для совместимости
      onUpdate({ content });
    },
  });

  // Синхронизируем внешние изменения с редактором
  useEffect(() => {
    if (editor && block.content !== editor.getHTML() + '<!---->') {
      editor.commands.setContent(block.content?.replace('<!---->', '') || '');
    }
  }, [block.content, editor]);

  // Применяем активные форматы
  useEffect(() => {
    if (!editor || !activeFormats) return;

    if (activeFormats.bold) editor.commands.toggleBold();
    if (activeFormats.italic) editor.commands.toggleItalic();
    if (activeFormats.underline) editor.commands.toggleUnderline();
    if (activeFormats.superscript) editor.commands.toggleSuperscript();
  }, [activeFormats, editor]);

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

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`w-full ${getFontSize()} ${getAlignment()}`}
      data-placeholder={block.type === 'CAPTION' ? 'Подпись' : block.type === 'P' ? 'Текст параграфа' : 'Заголовок'}
    >
      <EditorContent editor={editor} />
    </div>
  );
}; 