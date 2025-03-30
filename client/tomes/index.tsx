import Tome from '@bjornstar/tomes';
import { useEffect } from 'react';

import { useSockMonger } from '../sockmonger';

interface Bookkeeper {
  handleDiff: (diff: any) => void,
  handleInit: (value: any) => void,
  handleReadable: () => void,
  subs: number,
  tome: any,
}

const Bookkeepers: Record<string, Bookkeeper> = {};

function createBookkeeper() {
  const tome = Tome.conjure({});
  return {
    handleDiff: (diff) => tome.merge(diff),
    handleInit: (value) => tome.assign(value),
    handleReadable: () => tome.read(),
    subs: 0,
    tome,
  };
}

export function useTome(name: string) {
  Bookkeepers[name] ??= createBookkeeper();

  const { handleDiff, handleInit, handleReadable, tome } = Bookkeepers[name];

  const sm = useSockMonger();

  const connect = () => {
    if (!Bookkeepers[name].subs) {
      sm.on(name, handleInit);
      sm.on(`${name}.diff`, handleDiff);
      tome.on('readable', handleReadable);
    }

    Bookkeepers[name].subs += 1;

    return () => {
      Bookkeepers[name].subs -= 1;
      if (!Bookkeepers[name].subs) {
        sm.removeListener(name, handleInit);
        sm.removeListener(`${name}.diff`, handleDiff);
        tome.removeListener('readable', handleReadable);
      }
    };
  }

  useEffect(connect, [sm]);

  return tome;
}
