import { useEffect } from 'react';
import { useSockMonger } from '../sockmonger';
import { useLibrary } from './provider';
import { SleevedTome } from './sleeve';

export function useTome(title: string) {
  const library = useLibrary();
  const sm = useSockMonger();

  library[title] ??= new SleevedTome(title);

  useEffect(() => {
    library[title].connect(sm);

    return () => {
      library[title].disconnect(sm);
    }
  })

  return library[title].tome;
}
