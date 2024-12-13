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
      Node.create({
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
      })
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getHTML() });
    },
    autofocus: false,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const { $from } = view.state.selection;
          const node = $from.node();
          
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
    
    const plainText = editor.state.doc.textContent;
    
    editor.chain()
      .focus()
      .clearNodes()
      .clearContent()
      .insertContent(plainText)
      .setParagraph()
      .setTextAlign('left')
      .run();

    onUpdate({ 
      type: 'P',
      align: 'left',
      content: `<p>${plainText}</p>`
    });
  };

  return (
    <div className="space-y-4">
      <Toolbar
        onBlockTypeChange={(type) => {
          if (!editor) return;
          
          let newContent = '';
          if (type.startsWith('H')) {
            editor.chain().focus().setNode('heading', { level: parseInt(type[1]) }).run();
            newContent = editor.getHTML();
          } else if (type === 'P' || type === 'CAPTION') {
            editor.chain().focus().setParagraph().run();
            newContent = editor.getHTML();
          }
          
          onUpdate({ 
            type,
            content: newContent
          });
        }}
        onTextAlignChange={(align) => editor?.chain().focus().setTextAlign(align).run()}
        onTextCaseChange={(textCase) => {
          if (!editor) return;
          
          const { from, to } = editor.state.selection;
          const selectedText = editor.state.doc.textBetween(from, to);
          
          if (!selectedText) return;
          
          let newText = selectedText;
          switch (textCase) {
            case 'uppercase':
              newText = selectedText.toUpperCase();
              break;
            case 'lowercase':
              newText = selectedText.toLowerCase();
              break;
            case 'capitalize':
              newText = selectedText
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              break;
          }
          
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent(newText)
            .run();
            
          onUpdate({ textCase });
        }}
        onFormatClick={handleFormatClick}
        onClearFormat={handleClearFormat}
        onListClick={(type) => {
          if (!editor) return;
          if (type === 'bullet') {
            editor.chain().focus().toggleBulletList().run();
          }
          if (type === 'number') {
            editor.chain().focus().toggleOrderedList().run();
          }
        }}
        onFormulaClick={() => {
          if (!editor) return;
          
          const { from, to } = editor.state.selection;
          const selectedText = editor.state.doc.textBetween(from, to);
          
          if (!selectedText) return;
          
          editor.chain()
            .focus()
            .deleteSelection()
            .insertContent({
              type: 'formula',
              attrs: {
                inline: 'true',
                source: 'latex',
                content: selectedText
              }
            })
            .run();
        }}
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