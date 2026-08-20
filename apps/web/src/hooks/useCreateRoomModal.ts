import { IRoom, OnlineUser } from '@repo/shared-types';
import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';

export interface UseCreateRoomModalOptions {
  currentUser?: OnlineUser;
  initialIsOpen?: boolean;
  onClose?: () => void;
  onCreateRoom?: (roomData: Partial<IRoom>) => void;
}

export function useCreateRoomModal(options?: UseCreateRoomModalOptions) {
  const { currentUser, initialIsOpen = false, onClose, onCreateRoom } = options || {};

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialIsOpen);

  const openModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsCreateModalOpen(false);
    onClose?.();
  }, [onClose]);

  const toggleModal = useCallback(() => {
    setIsCreateModalOpen((prev) => !prev);
  }, []);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [maxSlots, setMaxSlots] = useState<number>(4);

  const [isCapacityOpen, setIsCapacityOpen] = useState(false);
  const capacityDropdownRef = useRef<HTMLDivElement>(null);
  const capacityOptions = [2, 3, 4, 5, 6, 7, 8];

  const resetForm = useCallback(() => {
    setTitle('');
    setSubtitle('');
    setMaxSlots(4);
    setIsCapacityOpen(false);
  }, []);

  const selectCapacity = useCallback((slots: number) => {
    setMaxSlots(slots);
    setIsCapacityOpen(false);
  }, []);

  const toggleCapacityDropdown = useCallback(() => {
    setIsCapacityOpen((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      if (onCreateRoom && currentUser) {
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
      }
    },
    [title, subtitle, maxSlots, currentUser, onCreateRoom]
  );

  // Close dropdown on click outside or Escape; close modal if dropdown is already closed on Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        capacityDropdownRef.current &&
        !capacityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCapacityOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCapacityOpen) {
          setIsCapacityOpen(false);
        } else {
          closeModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCapacityOpen, closeModal]);

  return {
    // Modal visibility states & controls (isolated from useRoomsStore)
    isCreateModalOpen,
    setIsCreateModalOpen,
    openModal,
    closeModal,
    toggleModal,

    // Form fields & handlers
    title,
    setTitle,
    subtitle,
    setSubtitle,
    maxSlots,
    setMaxSlots,
    handleSubmit,
    resetForm,

    // Capacity dropdown states & handlers
    isCapacityOpen,
    setIsCapacityOpen,
    toggleCapacityDropdown,
    selectCapacity,
    capacityDropdownRef,
    capacityOptions,
  };
}
