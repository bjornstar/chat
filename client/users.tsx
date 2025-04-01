import { useEffect, useState } from 'react';

import { useInput } from './use-input';
import { useSockMonger } from './sockmonger';
import { useTome } from './tomes/index.js';
import { User } from './user';

function union(a: string[] = [], b: string[] = []): string[] {
  return a.filter((v) => b.includes(v));
}

export const Users = ({ number = 100, size = 1 }) => {
  const sm = useSockMonger();

  const [userId, setUserId] = useState<string>('');
  const [userIds, updateUserIds] = useState<string[]>([]);

  const handleOpen = () => sm.remoteEmit('register', 'bjornstar');

  useEffect(() => {
    sm.on('open', handleOpen);
    sm.on('loggedIn', setUserId);

    return () => {
      sm.removeListener('open', handleOpen);
      setUserId('');
    };
  }, [sm]);

  const tChats = useTome('chats');
  const tUsers = useTome('users');

  useEffect(() => {
    const updateState = () => updateUserIds(union(Object.keys(tChats), Object.keys(tUsers)));

    tChats.on('readable', updateState);
    tUsers.on('readable', updateState);

    return () => {
      tChats.removeListener('readable', updateState);
      tUsers.removeListener('readable', updateState);
    };
  }, [tChats, tUsers]);

  useInput(userId);

  return (
    <>
      {userIds.map((userId, offset) => {
        if (!tUsers[userId]) return null;

        const { color, name } = tUsers[userId].unTome();

        return (
          <User key={userId} {...{ color, name, number, offset, size, userId }} />
        );
      })}
    </>
  );
}
