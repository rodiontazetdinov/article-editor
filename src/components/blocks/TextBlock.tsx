import { ITextBlock } from '@/types/article';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { useEffect, useCallback, useState } from 'react';
import { Extension, Node } from '@tiptap/core';
import type { Command, RawCommands } from '@tiptap/core';
import { FormulaNode } from '../Formula/FormulaNode';
import { createPortal } from 'react-dom';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textCase: {
      setUpperCase: () => ReturnType;
      setLowerCase: () => ReturnType;
      setCapitalize: () => ReturnType;
    };
  }
}

const TextCase = Extension.create({
  name: 'textCase',
  addCommands() {
    return {
      setUpperCase: () => ({ tr, state, dispatch }) => {
        console.log('setUpperCase command:', {
          selection: state.selection,
          text: state.doc.textBetween(state.selection.from, state.selection.to)
        });
        
        if (!dispatch) return false;
        const { from, to } = state.selection;
        const text = state.doc.textBetween(from, to);
        const newText = text.toUpperCase();
        
        console.log('Transforming text:', { from, to, text, newText });
        tr.insertText(newText, from, to);
        return true;
      },
      setLowerCase: () => ({ tr, state, dispatch }) => {
        if (!dispatch) return false;
        const { from, to } = state.selection;
        const text = state.doc.textBetween(from, to);
        tr.insertText(text.toLowerCase(), from, to);
        return true;
      },
      setCapitalize: () => ({ tr, state, dispatch }) => {
        if (!dispatch) return false;
        const { from, to } = state.selection;
        const text = state.doc.textBetween(from, to);
        const capitalized = text.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        tr.insertText(capitalized, from, to);
        return true;
      },
    };
  },
});

const Formula = Node.create({
  name: 'formula',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      inline: {
        default: 'true',
      },
      source: {
        default: 'latex',
      },
      content: {
        default: 'формула',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'formula',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['formula', { ...HTMLAttributes, 'data-formula': 'true' }, HTMLAttributes.content];
  },
});

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
  onTextCase?: (type: 'upper' | 'lower' | 'capitalize') => void;
}

export const TextBlock = ({ 
  block, 
  onUpdate, 
  activeFormats, 
  onActiveFormatsChange,
  onEnterPress,
  onTextCase 
}: TextBlockProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
          newGroupDelay: 500
        },
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Superscript,
      TextCase,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-outside ml-5',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-outside ml-5',
        },
      }),
      ListItem,
      Formula,
    ],
    content: block.content?.replace('<!---->', '') || '',
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getHTML() + '<!---->' });
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (event.key === ' ' && !event.repeat) {
            view.dispatch(view.state.tr.insertText(' '));
            return true;
          }
          return false;
        }
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const isInList = editor?.isActive('bulletList') || editor?.isActive('orderedList');
          if (isInList && editor) {
            // Проверяем, пустой ли текущий элемент списка
            const isEmpty = editor.state.doc.textBetween(
              editor.state.selection.from - 1,
              editor.state.selection.from
            ).length === 0;

            if (isEmpty) {
              // Выходим из списка
              editor.commands.liftListItem('listItem');
            } else {
              // Добавляем новый элемент списка
              event.preventDefault();
              editor.commands.splitListItem('listItem');
            }
            return true;
          }
          // Если не в списке, создаем новый блок
          event.preventDefault();
          onEnterPress?.();
          return true;
        }
        if (event.key === 'Escape' && editor) {
          editor.commands.unsetSuperscript();
          editor.commands.unsetBold();
          editor.commands.unsetItalic();
          editor.commands.unsetUnderline();
          return true;
        }
        return false;
      },
    }
  });

  const [formulaNodes, setFormulaNodes] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateFormulas = () => {
      const nodes = editor.view.dom.querySelectorAll('formula') as NodeListOf<HTMLElement>;
      setFormulaNodes(Array.from(nodes));
    };

    editor.on('update', updateFormulas);
    updateFormulas();

    return () => {
      editor.off('update', updateFormulas);
    };
  }, [editor]);

  // Делаем редактор доступным через ref
  useEffect(() => {
    const element = document.querySelector(`[data-block-id="${block.id}"]`);
    if (element && editor) {
      (element as any)._editor = editor;
    }
  }, [editor, block.id]);

  // Применяем textCase при монтировании и изменении
  useEffect(() => {
    if (!editor || !block.textCase) return;
    
    requestAnimationFrame(() => {
      editor.commands.selectAll();
      switch (block.textCase) {
        case 'uppercase':
          editor.chain().setUpperCase().run();
          break;
        case 'lowercase':
          editor.chain().setLowerCase().run();
          break;
        case 'capitalize':
          editor.chain().setCapitalize().run();
          break;
      }
      editor.commands.focus('end');
    });
  }, [editor, block.textCase]);

  const handleTextCase = useCallback((type: 'upper' | 'lower' | 'capitalize') => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    
    // Сохраняем текущее выделение
    const selection = { from, to };
    
    if (!hasSelection) {
      editor.commands.selectAll();
    }
    
    switch (type) {
      case 'upper':
        if (hasSelection) {
          editor.chain()
            .focus()
            .command(({ tr }) => {
              const text = tr.doc.textBetween(selection.from, selection.to);
              tr.insertText(text.toUpperCase(), selection.from, selection.to);
              return true;
            })
            .run();
        } else {
          editor.chain().setUpperCase().run();
          onUpdate({ textCase: 'uppercase' });
        }
        break;
      case 'lower':
        if (hasSelection) {
          editor.chain()
            .focus()
            .command(({ tr }) => {
              const text = tr.doc.textBetween(selection.from, selection.to);
              tr.insertText(text.toLowerCase(), selection.from, selection.to);
              return true;
            })
            .run();
        } else {
          editor.chain().setLowerCase().run();
          onUpdate({ textCase: 'lowercase' });
        }
        break;
      case 'capitalize':
        if (hasSelection) {
          editor.chain()
            .focus()
            .command(({ tr }) => {
              const text = tr.doc.textBetween(selection.from, selection.to);
              const capitalized = text.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              tr.insertText(capitalized, selection.from, selection.to);
              return true;
            })
            .run();
        } else {
          editor.chain().setCapitalize().run();
          onUpdate({ textCase: 'capitalize' });
        }
        break;
    }
    
    editor.commands.focus();
  }, [editor, onUpdate]);

  // Синхронизируем внешние изменения с редактором
  useEffect(() => {
    if (editor && block.content !== editor.getHTML() + '<!---->') {
      editor.commands.setContent(block.content?.replace('<!---->', '') || '');
    }
  }, [block.content, editor]);

  // Применяем активные форматы
  useEffect(() => {
    if (!editor || !activeFormats) return;

    if (activeFormats.bold !== editor.isActive('bold')) {
      editor.commands.toggleBold();
    }
    if (activeFormats.italic !== editor.isActive('italic')) {
      editor.commands.toggleItalic();
    }
    if (activeFormats.underline !== editor.isActive('underline')) {
      editor.commands.toggleUnderline();
    }
    if (activeFormats.superscript !== editor.isActive('superscript')) {
      editor.commands.toggleSuperscript();
    }
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
      data-block-id={block.id}
    >
      <EditorContent editor={editor} />
      {formulaNodes.map((node, index) => 
        createPortal(<FormulaNode key={index} node={node} />, document.body)
      )}
    </div>
  );
}; 