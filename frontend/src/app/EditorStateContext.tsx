import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";


interface EditorStateContextValue {
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
}

const EditorStateContext = createContext<EditorStateContextValue | undefined>(undefined);

export function EditorStateProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <EditorStateContext.Provider value={{ isDirty, setIsDirty }}>
      {children}
    </EditorStateContext.Provider>
  );
}

export function useEditorState() {
  const context = useContext(EditorStateContext);

  if (!context) {
    throw new Error("useEditorState must be used within EditorStateProvider");
  }

  return context;
}   