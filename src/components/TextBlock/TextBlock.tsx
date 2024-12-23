import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Node } from '@tiptap/core';
import { Toolbar } from '../Toolbar/Toolbar';
import Bold from '@tiptap/extension-bold';
import { TArticleBlock, ITextBlock } from '@/types/article';
import { useEffect } from 'react';

// Создаем расширение для инлайн формул
const Formula = Node.create({
  name: 'formula',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      inline: {
        default: 'true'
      },
      source: {
        default: 'latex'
      },
      content: {
        default: ''
      }
    }
  },
  parseHTML() {
    return [
      {
        tag: 'formula',
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['formula', { 
      class: 'inline-block px-2 py-0.5 mx-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100', 
      ...HTMLAttributes 
    }, HTMLAttributes.content]
  }
});

interface TextBlockProps {
  block: ITextBlock;
  onUpdate: (updates: Partial<TArticleBlock>) => void;
  activeFormats?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    superscript: boolean;
  };
  onActiveFormatsChange?: (formats: NonNullable<TextBlockProps['activeFormats']>) => void;
  onEnterPress?: () => void;
  onDelete: () => void;
  onAdd: (type: TArticleBlock['type']) => void;
  shouldFocus?: boolean;
}

export const TextBlock = ({ 
  block,
  onUpdate,
  activeFormats,
  onActiveFormatsChange,
  onEnterPress,
  onDelete,
  onAdd,
  shouldFocus
}: TextBlockProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-4'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4'
          }
        }
      }),
      Bold.configure({
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      Superscript,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Formula, // Добавляем поддержку формул
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getHTML() });
    },
    onSelectionUpdate: ({ editor }) => {
      if (onActiveFormatsChange) {
        onActiveFormatsChange({
          bold: editor.isActive('bold'),
          italic: editor.isActive('italic'),
          underline: editor.isActive('underline'),
          superscript: editor.isActive('superscript'),
        });
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const { $from } = view.state.selection;
          
          const inList = hasParentNode(view.state, 'bulletList') || hasParentNode(view.state, 'orderedList');
          
          if (!inList) {
            event.preventDefault();
            onEnterPress?.();
            return true;
          }
          
          if ($from.parent.textContent.trim() === '') {
            event.preventDefault();
            editor?.chain().focus().liftListItem('listItem').run();
            onEnterPress?.();
            return true;
          }
          
          return false;
        }
        return false;
      }
    }
  });

  const hasParentNode = (state: any, nodeName: string) => {
    const { $from } = state.selection;
    let depth = $from.depth;
    while (depth > 0) {
      const node = $from.node(depth);
      if (node.type.name === nodeName) {
        return true;
      }
      depth--;
    }
    return false;
  };

  // Следим за изменениями форматирования из глобального тулбара
  useEffect(() => {
    if (editor && activeFormats) {
      if (activeFormats.bold !== editor.isActive('bold')) {
        editor.chain().focus().toggleBold().run();
      }
      if (activeFormats.italic !== editor.isActive('italic')) {
        editor.chain().focus().toggleItalic().run();
      }
      if (activeFormats.underline !== editor.isActive('underline')) {
        editor.chain().focus().toggleUnderline().run();
      }
      if (activeFormats.superscript !== editor.isActive('superscript')) {
        editor.chain().focus().toggleSuperscript().run();
      }
    }
  }, [editor, activeFormats]);

  // Добавляем обработку списков
  useEffect(() => {
    if (editor && block.listType) {
      if (block.listType === 'bullet') {
        editor.chain().focus().toggleBulletList().run();
      } else if (block.listType === 'number') {
        editor.chain().focus().toggleOrderedList().run();
      }
    }
  }, [editor, block.listType]);

  useEffect(() => {
    if (editor && block.align) {
      editor.chain().focus().setTextAlign(block.align).run();
    }
  }, [editor, block.align]);

  useEffect(() => {
    if (editor && shouldFocus) {
      editor.commands.focus('end');
    }
  }, [editor, shouldFocus]);

  if (!editor) {
    return null;
  }

  return (
    <div className="prose max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}; 