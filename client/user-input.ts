import { type FC, useEffect } from 'react';

import { isChar } from './font';
import { useSockMonger } from './sockmonger';
import { useLibrary } from './tomes/provider';

export const UserInput: FC<{ userId: string }> = ({ userId }) => {
  const library = useLibrary();
  const sm = useSockMonger();

  useEffect(() => {
    if (!userId) return console.info('I have no userId');

    const tMyChat = library.chats.tome[userId];

    if (!tMyChat) return console.warn('my chat is missing')

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
  }, [library, sm, userId]);

  return null;
};
