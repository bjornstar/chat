import { createContext, useContext, useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'

import { SleevedTome } from './sleeve';
import { useSockMonger } from '../sockmonger';

export const LibraryContext = createContext<Record<'chats' | 'users', SleevedTome >>({ chats: new SleevedTome('chats'), users: new SleevedTome('users') });

export const useLibrary = () => {
  const c = useContext(LibraryContext);
  if (!c) throw new Error("Library Context not found. Library can only be used within a LibraryProvider");
  return c;
}

interface LibraryProviderProps {
  children?: ReactNode
}

export const LibraryProvider: FC<LibraryProviderProps> = ({ children }) => {
  const sm = useSockMonger();
  const [library] = useState<Record<'chats' | 'users', SleevedTome >>({ chats: new SleevedTome('chats'), users: new SleevedTome('users') });

  useEffect(() => {
    Object.values(library).forEach(sleevedTome => sleevedTome.connect(sm));
    return () => {
      Object.values(library).forEach(sleevedTome => sleevedTome.disconnect(sm));
    };
  });

  return (
    <LibraryContext.Provider value={library}>
      {children}
    </LibraryContext.Provider>
  );
}
