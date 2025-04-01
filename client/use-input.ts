import { useEffect } from 'react';

import { isChar } from './font';
import { useSockMonger } from './sockmonger';
import { useTome } from './tomes';

export function useInput(userId: string) {
  const sm = useSockMonger();
  const tChats = useTome('chats');

  useEffect(() => {
    if (!userId || !tChats[userId]) return;

    const tMyChat = tChats[userId];

    const lineBreak = () => {
      if (tMyChat.length) tMyChat.assign([]);
    }

    let timeout: number;

    const onkeydown = ({ altKey, ctrlKey, key, metaKey }: KeyboardEvent) => {
      if (altKey || ctrlKey || metaKey) return;

      clearTimeout(timeout);

      if ([' ', 'Enter'].includes(key)) lineBreak();

      const char = key.toUpperCase();

      if (isChar(char)) tMyChat.push(char);

      timeout = setTimeout(lineBreak, 1000);
    };

    const remoteEmit = () => {
      sm.remoteEmit('diff', tMyChat.read());
    };

    tMyChat.on('readable', remoteEmit);
    window.addEventListener('keydown', onkeydown);

    return () => {
      window.removeEventListener('keydown', onkeydown);
      tMyChat.removeListener('readable', remoteEmit);
    };
  }, [tChats, userId]);
}
