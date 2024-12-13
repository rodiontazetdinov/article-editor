import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Toolbar } from '../Toolbar/Toolbar';
import Bold from '@tiptap/extension-bold';
import { TArticleBlock, ITextBlock } from '@/types/article';
import { useEffect } from 'react';

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
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getHTML() });
    },
    autofocus: false,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnterPress?.();
          return true;
        }
        return false;
      }
    }
  });

  useEffect(() => {
    if (shouldFocus && editor) {
      setTimeout(() => {
        editor.commands.focus('start');
      }, 0);
    }
  }, [shouldFocus, editor]);

  useEffect(() => {
    if (editor && block.type.startsWith('H')) {
      editor.chain().focus().setNode('heading', { level: parseInt(block.type[1]) }).run();
    }
  }, [editor, block.type]);

  const handleFormatClick = (format: 'bold' | 'italic' | 'underline' | 'superscript') => {
    if (!editor) return;

    const selection = editor.state.selection;
    if (!selection) return;

    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'superscript':
        editor.chain().focus().toggleSuperscript().run();
        break;
    }
  };

  const handleClearFormat = () => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().run();
  };

  return (
    <div className="space-y-4">
      <Toolbar
        onBlockTypeChange={(type) => editor?.chain().focus().setNode(type).run()}
        onTextAlignChange={(align) => editor?.chain().focus().setTextAlign(align).run()}
        onTextCaseChange={(textCase) => {/* ... */}}
        onFormatClick={handleFormatClick}
        onClearFormat={handleClearFormat}
        onListClick={(type) => {
          if (type === 'bullet') editor?.chain().focus().toggleBulletList().run();
          if (type === 'number') editor?.chain().focus().toggleOrderedList().run();
        }}
        onFormulaClick={() => {/* ... */}}
        canUndo={editor?.can().undo() ?? false}
        canRedo={editor?.can().redo() ?? false}
        onUndo={() => editor?.chain().focus().undo().run()}
        onRedo={() => editor?.chain().focus().redo().run()}
        activeFormats={{
          bold: editor?.isActive('bold') ?? false,
          italic: editor?.isActive('italic') ?? false,
          underline: editor?.isActive('underline') ?? false,
          superscript: editor?.isActive('superscript') ?? false,
        }}
      />
      <div className="bg-gray-50 rounded-lg p-2 focus-within:bg-white transition-colors duration-200">
        <EditorContent editor={editor} className="outline-none" />
      </div>
    </div>
  );
}; 