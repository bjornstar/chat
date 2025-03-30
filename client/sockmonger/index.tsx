import { createContext, useContext, useEffect, useState } from 'react'

import type { FC, ReactNode } from 'react'

import { SockMonger } from './sockmonger'

export const SockMongerContext = createContext<SockMonger | null>(null);

export const useSockMonger = () => {
  const c = useContext(SockMongerContext);
  if (!c) throw new Error("SockMonger Context not found. SockMonger can only be used within a SockMongerProvider");
  return c;
}

interface SockMongerProviderProps {
  children?: ReactNode,
  server?: string
}

export const SockMongerProvider: FC<SockMongerProviderProps> = ({ children, server = 'ws://localhost:8081' }) => {
  const [sockMonger] = useState(() => new SockMonger(server));

  useEffect(() => {
    const errorHandler = console.error;

    sockMonger.on('error', errorHandler);

    sockMonger.connect();

    return () => {
      sockMonger.disconnect();
      sockMonger.removeListener('error', errorHandler);
    };
  }, []);

  return (
    <SockMongerContext.Provider value={sockMonger}>
      {children}
    </SockMongerContext.Provider>
  )
}
