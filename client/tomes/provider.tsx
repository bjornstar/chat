import { createContext, useContext, useEffect, useState } from 'react'

import type { FC, ReactNode } from 'react'
import { type SleevedTome } from './sleeve';

export const LibraryContext = createContext<{ [title: string]: SleevedTome }>({});

export const useLibrary = () => {
  const c = useContext(LibraryContext);
  if (!c) throw new Error("Library Context not found. Library can only be used within a LibraryProvider");
  return c;
}

interface LibraryProviderProps {
  children?: ReactNode
}

export const LibraryProvider: FC<LibraryProviderProps> = ({ children }) => {
  const [library] = useState<{ [title: string]: SleevedTome }>({});

  return (
    <LibraryContext.Provider value={library}>
      {children}
    </LibraryContext.Provider>
  );
}
