import { Editor } from '@tiptap/react';
import { create } from 'zustand';

interface ActiveEditorStore {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
}

export const useActiveEditor = create<ActiveEditorStore>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
})); 