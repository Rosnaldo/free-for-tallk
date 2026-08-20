import { IRoom, OnlineUser } from '@repo/shared-types';
import { useState, useCallback, FormEvent } from 'react';

interface UseCreateRoomFormProps {
  currentUser: OnlineUser;
  onCreateRoom: (roomData: Partial<IRoom>) => void;
}

export const useCreateRoomForm = ({
  currentUser,
  onCreateRoom,
}: UseCreateRoomFormProps) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [maxSlots, setMaxSlots] = useState<number>(4);

  const resetForm = useCallback(() => {
    setTitle('');
    setSubtitle('');
    setMaxSlots(4);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      onCreateRoom({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        maxSlots,
        creator: currentUser,
        members: [
          {
            ...currentUser,
            microphoneOn: true,
          },
        ],
      });
    },
    [title, subtitle, maxSlots, currentUser, onCreateRoom]
  );

  return {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    maxSlots,
    setMaxSlots,
    resetForm,
    handleSubmit,
  };
};
