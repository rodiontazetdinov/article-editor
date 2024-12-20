// 'use client';

// import { Editor } from '@tiptap/react';
// import { createContext, useContext, useState, ReactNode } from 'react';

// interface ActiveEditorContextType {
//   editor: Editor | null;
//   setEditor: (editor: Editor | null) => void;
// }

// const ActiveEditorContext = createContext<ActiveEditorContextType | undefined>(undefined);

// export function ActiveEditorProvider({ children }: { children: ReactNode }) {
//   const [editor, setEditor] = useState<Editor | null>(null);
//   return (
//     <ActiveEditorContext.Provider value={{ editor, setEditor }}>
//       {children}
//     </ActiveEditorContext.Provider>
//   );
// }

// export function useActiveEditor() {
//   const context = useContext(ActiveEditorContext);
//   if (context === undefined) {
//     throw new Error('useActiveEditor must be used within an ActiveEditorProvider');
//   }
//   return context;
// } 