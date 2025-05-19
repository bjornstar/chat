import { memo, useEffect, useState } from 'react';

import { UserInput } from './user-input';
import { useSockMonger } from './sockmonger';
import { useLibrary } from './tomes/provider';
import { User } from './user';

const UsersComponent = ({ number = 100, size = 1 }) => {
  const sm = useSockMonger();
  const library = useLibrary();

  const [myUserId, setMyUserId] = useState<string>('');
  const [userIds, updateUserIds] = useState<string[]>(Object.keys(library.users.tome));

  useEffect(() => {
    const handleLoggedIn = (userId: string) => {
      localStorage.setItem('userId', userId);
      setMyUserId(userId);
    }

    const handleOpen = () => {
      const localUserId = localStorage.getItem('userId');

      if (localUserId) {
        sm.remoteEmit('login', localUserId)
      } else {
        sm.remoteEmit('register', 'bjornstar');
      }
    }

    sm.on('loggedIn', handleLoggedIn);
    sm.on('open', handleOpen);

    return () => {
      sm.removeListener('loggedIn', handleLoggedIn);
      sm.removeListener('open', handleOpen);

      setMyUserId('');
    };
  }, [sm]);

  useEffect(() => {
    const syncUserIds = () => updateUserIds(Object.keys(library.users.tome));

    library.users.tome.on('add', syncUserIds);
    library.users.tome.on('del', syncUserIds);

    return () => {
      library.users.tome.removeListener('add', syncUserIds);
      library.users.tome.removeListener('del', syncUserIds);
    };
  }, [library.users.tome]);

  return (
    <>
      <UserInput userId={myUserId} />
      {userIds.map((userId, offset) => {
        if (!library.users.tome[userId]) return null;

        const { color, name } = library.users.tome[userId].unTome();

        return (
          <User key={userId} {...{ color, name, number, offset, size, userId }} />
        );
      })}
    </>
  );
}

export const Users = memo(UsersComponent);
