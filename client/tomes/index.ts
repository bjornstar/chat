import { useEffect } from 'react';
import { useSockMonger } from '../sockmonger';
import { useLibrary } from './provider';
import { SleevedTome } from './sleeve';

export function useTome(title: 'chats' | 'users') {
  const library = useLibrary();
  const sm = useSockMonger();

  useEffect(() => {
    library[title] = new SleevedTome(title);
    library[title].connect(sm);

    return () => {
      library[title].disconnect(sm);
    }
  })

  return library[title].tome;
}
