import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Node, mergeAttributes, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Toolbar } from '../Toolbar/Toolbar';
import Bold from '@tiptap/extension-bold';
import { TArticleBlock, ITextBlock } from '@/types/article';
import { useEffect, useCallback, useRef } from 'react';
import { InlineMath } from 'react-katex';
import React from 'react';
import ReactDOM from 'react-dom';
import 'katex/dist/katex.min.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    formula: {
      setFormula: (content: string) => ReturnType;
    }
  }
}

// Функция предварительной обработки LaTeX формулы
const preprocessLatex = (latex: string) => {
  return latex
    // Исправляем пробелы в командах
    .replace(/\\left\s*{/g, '\\left\\{')
    .replace(/\\right\s*}/g, '\\right\\}')
    .replace(/\\left\s*\(/g, '\\left(')
    .replace(/\\right\s*\)/g, '\\right)')
    .replace(/\\left\s*\[/g, '\\left[')
    .replace(/\\right\s*\]/g, '\\right]')
    // Исправляем overset
    .replace(/\\overset\s*{/g, '\\overset{')
    .replace(/\\overset\s*{\\overline}/g, '\\overline')
    .replace(/\\overset\s*{\\cdot}/g, '\\dot')
    // Исправляем exp
    .replace(/exp\s*⁡/g, '\\exp')
    // Исправляем греческие буквы
    .replace(/\\alpha\s+\\overset/g, '\\alpha\\overset')
    .replace(/\\beta\s+\\right/g, '\\beta\\right')
    .replace(/\\sigma\s+\\alpha/g, '\\sigma\\alpha')
    // Исправляем множественные пробелы
    .replace(/\s+/g, ' ')
    .trim();
};

// Создаем расширение для инлайн формул
const Formula = Node.create({
  name: 'formula',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      content: {
        default: ''
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="formula"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const element = node as HTMLElement;
          return {
            content: element.getAttribute('data-formula')
          }
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { 
      'data-type': 'formula',
      'data-formula': HTMLAttributes.content,
      class: 'inline-formula'
    }];
  },

  addNodeView() {
    return ({ node, editor }) => {
      const dom = document.createElement('span');
      dom.style.display = 'inline-block';
      dom.style.verticalAlign = 'middle';
      dom.style.padding = '0 4px';
      dom.style.margin = '0 1px';
      dom.style.backgroundColor = 'rgba(232, 244, 253, 0.8)';
      dom.style.borderRadius = '4px';
      dom.style.border = '1px solid rgba(187, 222, 251, 0.5)';
      dom.style.transition = 'all 0.2s ease-in-out';
      dom.style.cursor = 'pointer';
      dom.style.minWidth = '20px';
      dom.style.minHeight = '24px';
      dom.className = 'inline-formula';

      // Создаем портал для редактора
      const portalContainer = document.createElement('div');
      portalContainer.style.position = 'fixed';
      portalContainer.style.zIndex = '1000';
      portalContainer.style.top = '0';
      portalContainer.style.left = '0';
      document.body.appendChild(portalContainer);

      let isEditing = false;

      const renderFormula = (content: string) => {
        try {
          const decodedContent = content
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\\\\/g, '\\');

          const processedContent = preprocessLatex(decodedContent);

          // Сохраняем текущие размеры
          const width = dom.offsetWidth;
          const height = dom.offsetHeight;

          // Очищаем содержимое перед рендерингом
          while (dom.firstChild) {
            dom.removeChild(dom.firstChild);
          }

          // Создаем контейнер для формулы
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.minWidth = `${Math.max(width, 20)}px`;
          container.style.minHeight = `${Math.max(height, 24)}px`;
          dom.appendChild(container);

          ReactDOM.render(
            React.createElement(InlineMath, { 
              math: processedContent,
              errorColor: '#e53e3e',
              renderError: (error) => {
                console.error('KaTeX error:', error);
                return React.createElement('span', { 
                  style: { 
                    color: '#e53e3e',
                    cursor: 'help',
                    borderBottom: '1px dotted #e53e3e'
                  },
                  title: error.message
                }, `$${decodedContent}$`);
              }
            }),
            container
          );
        } catch (error) {
          console.error('Error rendering formula:', error);
          dom.innerHTML = `<span style="color: #e53e3e; cursor: help; border-bottom: 1px dotted #e53e3e" title="${error instanceof Error ? error.message : 'Unknown error'}">${content}</span>`;
          dom.style.backgroundColor = 'rgba(254, 242, 242, 0.8)';
          dom.style.border = '1px solid rgba(252, 165, 165, 0.5)';
        }
      };

      const FormulaEditor = ({ content, onSave, onCancel }: { 
        content: string; 
        onSave: (content: string) => void;
        onCancel: () => void;
      }) => {
        const [value, setValue] = React.useState(content);
        const textareaRef = React.useRef<HTMLTextAreaElement>(null);

        React.useEffect(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, []);

        const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            onSave(value);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        };

        return React.createElement('div', {
          style: {
            position: 'absolute',
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '6px',
            padding: '8px',
            width: '300px'
          }
        }, [
          React.createElement('textarea', {
            key: 'textarea',
            ref: textareaRef,
            value,
            onChange: (e) => setValue(e.target.value),
            onKeyDown: handleKeyDown,
            style: {
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              backgroundColor: '#f8fafc',
              fontFamily: 'monospace',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '8px'
            }
          }),
          React.createElement('div', {
            key: 'preview',
            style: {
              padding: '8px',
              backgroundColor: '#f8fafc',
              borderRadius: '4px',
              marginBottom: '8px',
              minHeight: '30px'
            }
          }, React.createElement(InlineMath, { math: preprocessLatex(value) })),
          React.createElement('div', {
            key: 'buttons',
            style: {
              display: 'flex',
              gap: '8px'
            }
          }, [
            React.createElement('button', {
              key: 'save',
              onClick: () => onSave(value),
              style: {
                backgroundColor: '#4299e1',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none'
              }
            }, 'Сохранить'),
            React.createElement('button', {
              key: 'cancel',
              onClick: onCancel,
              style: {
                backgroundColor: '#e2e8f0',
                color: '#4a5568',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none'
              }
            }, 'Отмена')
          ])
        ]);
      };

      const startEditing = () => {
        if (isEditing) return;
        isEditing = true;

        const rect = dom.getBoundingClientRect();
        portalContainer.style.left = `${rect.left}px`;
        portalContainer.style.top = `${rect.bottom + 4}px`;

        const handleSave = (content: string) => {
          // Сначала останавливаем редактирование
          stopEditing();
          
          // Затем обновляем атрибуты узла
          editor.commands.updateAttributes(node.type.name, { content });
          
          // И наконец обновляем отображение
          requestAnimationFrame(() => {
            renderFormula(content);
          });
        };

        const handleCancel = () => {
          stopEditing();
        };

        const handleClickOutside = (e: MouseEvent) => {
          const target = e.target;
          if (target instanceof Element && 
              !portalContainer.contains(target) && 
              !dom.contains(target)) {
            // При клике вне редактора сохраняем текущее значение
            const textarea = portalContainer.querySelector('textarea');
            if (textarea) {
              handleSave(textarea.value);
            } else {
              stopEditing();
            }
          }
        };

        document.addEventListener('mousedown', handleClickOutside);

        ReactDOM.render(
          React.createElement(FormulaEditor, {
            content: node.attrs.content || '',
            onSave: handleSave,
            onCancel: handleCancel
          }),
          portalContainer
        );
      };

      const stopEditing = () => {
        if (!isEditing) return;
        isEditing = false;
        ReactDOM.unmountComponentAtNode(portalContainer);
      };

      dom.addEventListener('click', startEditing);
      
      dom.addEventListener('mouseenter', () => {
        if (!isEditing) {
          dom.style.backgroundColor = 'rgba(187, 222, 251, 0.3)';
          dom.style.border = '1px solid rgba(187, 222, 251, 0.8)';
        }
      });
      
      dom.addEventListener('mouseleave', () => {
        if (!isEditing) {
          dom.style.backgroundColor = 'rgba(232, 244, 253, 0.8)';
          dom.style.border = '1px solid rgba(187, 222, 251, 0.5)';
        }
      });
      
      renderFormula(node.attrs.content || '');
      
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          
          // Обновляем ссылку на текущий узел
          node = updatedNode;
          
          if (!isEditing) {
            // Используем setTimeout для гарантированного обновления после всех изменений
            setTimeout(() => {
              renderFormula(updatedNode.attrs.content || '');
            }, 0);
          }
          return true;
        },
        destroy: () => {
          ReactDOM.unmountComponentAtNode(dom);
          if (portalContainer.parentNode) {
            portalContainer.parentNode.removeChild(portalContainer);
          }
        },
      }
    }
  },

  addCommands() {
    return {
      setFormula: (content: string) => ({ chain }) => {
        return chain()
          .focus()
          .insertContent([
            {
              type: this.name,
              attrs: { content }
            }
          ])
          .run()
      }
    }
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
  const editorRef = useRef<Editor | null>(null);

  const getBlockClass = (type: ITextBlock['type']) => {
    switch (type) {
      case 'H1':
        return 'text-4xl font-bold tracking-tight';
      case 'H2':
        return 'text-3xl font-bold tracking-tight';
      case 'H3':
        return 'text-2xl font-bold tracking-tight';
      case 'P':
        return 'text-lg leading-relaxed';
      case 'CAPTION':
        return 'text-sm text-gray-600 italic';
      default:
        return '';
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-4 space-y-1'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4 space-y-1'
          }
        },
        paragraph: {
          HTMLAttributes: {
            class: 'leading-relaxed'
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
      Formula,
    ],
    content: block.content.replace(/\$(.*?)\$/g, (match, formula) => {
      // Предварительная обработка LaTeX
      const processedFormula = preprocessLatex(formula);
      // Экранируем специальные символы для HTML атрибутов
      const escapedFormula = processedFormula
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\/g, '\\\\');
      return `<span data-type="formula" data-formula="${escapedFormula}"></span>`;
    }),
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      // При сохранении обратно в LaTeX формат, раскодируем специальные символы
      const processedContent = content.replace(
        /<span data-type="formula" data-formula="(.*?)"><\/span>/g,
        (_, formula) => {
          const decodedFormula = formula
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\\\\/g, '\\');
          // Применяем предварительную обработку LaTeX
          const processedFormula = preprocessLatex(decodedFormula);
          return `$${processedFormula}$`;
        }
      );
      onUpdate({ content: processedContent });
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
      attributes: {
        class: getBlockClass(block.type),
      },
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

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  const handleFormulaClick = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (!selectedText) return;

    editor.chain().focus().setFormula(selectedText).run();
  }, [editor]);

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

  useEffect(() => {
    if (editor) {
      const editorElement = document.querySelector(`[data-block-id="${block.id}"] .ProseMirror`);
      if (editorElement) {
        (editorElement as any).__editor = editor;
      }
    }
  }, [editor, block.id]);

  if (!editor) {
    return null;
  }

  return (
    <div 
      className={`prose max-w-none focus-within:outline-none ${block.textCase === 'uppercase' ? 'uppercase' : ''} 
        ${block.textCase === 'lowercase' ? 'lowercase' : ''} 
        ${block.textCase === 'capitalize' ? 'capitalize' : ''}`}
      style={{ 
        paddingLeft: `${block.indent * 2}rem`,
        transition: 'all 0.2s ease-in-out'
      }}
      data-block-id={block.id}
    >
      <EditorContent editor={editor} />
    </div>
  );
}; 