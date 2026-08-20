import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { playLeaveSound } from '../services/audio';
import { RoomChat } from './RoomChat';
import { ScreenPainel } from './ScreenPainel';
import confetti from 'canvas-confetti';
import { IChatMessage, IRoom, OnlineUser, RoomReactionEmoji } from '@repo/shared-types';
import { useChatStore, useDevicesStore, useReactionsStore } from '../states/stores';
import { initWs } from '../services/ws/init-ws';

export interface RoomViewProps {
  room: IRoom;
  currentUser: OnlineUser;
  onLeaveRoom: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  room,
  currentUser,
  onLeaveRoom,
}) => {
  // Chat lives in its own store (rather than local state) so a reaction
  // received over ws (see ws-handlers.ts) can add a chat entry from outside
  // this component, same as it does for the sender locally below.
  const { messages: allMessages, addMessage } = useChatStore();
  const messages = allMessages.filter((m) => m.roomId === room.id);

  useEffect(() => {
    const welcomeId = `welcome-msg-${room.id}`;
    if (!allMessages.some((m) => m.id === welcomeId)) {
      addMessage({
        id: welcomeId,
        roomId: room.id,
        userId: 'system',
        userName: 'System',
        text: `Welcome to ${room.title}! Feel free to say hi.`,
        timestamp: Date.now(),
        type: 'text',
      });
    }
    // Seeds the welcome message once per room -- deliberately not reacting
    // to allMessages/addMessage so this doesn't re-fire on every message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number; y: number; text: string }[]>([]);

  // Reaction animation state lives in its own store so it can be driven both
  // by local clicks and by ws events from other room members (see below).
  const { activeReactions, triggerReaction } = useReactionsStore();

  // Devices state from Zustand store
  const {
    microphoneOn,
    cameraOn,
    setMicrophoneOn,
    setCameraOn,
  } = useDevicesStore();

  // No speaker/deafen state in the devices store, so keep it local
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const isMuted = !microphoneOn;
  const isDeafened = !isAudioEnabled;
  const isCameraOn = cameraOn;

  const handleToggleMic = () => {
    const nextMicrophoneOn = !microphoneOn;
    setMicrophoneOn(nextMicrophoneOn);
    initWs.send({ event: 'room:device-state', roomId: room.id, microphoneOn: nextMicrophoneOn, cameraOn });
  };

  const handleToggleCamera = () => {
    const nextCameraOn = !cameraOn;
    setCameraOn(nextCameraOn);
    initWs.send({ event: 'room:device-state', roomId: room.id, microphoneOn, cameraOn: nextCameraOn });
  };

  const handleToggleAudio = () => {
    setIsAudioEnabled((prev) => !prev);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMsg: IChatMessage = {
      id: `msg-${Date.now()}`,
      roomId: room.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'text',
    };

    addMessage(newMsg);

    // Notify other users in the room so their chat panel updates too
    initWs.send({ event: 'room:chat', roomId: room.id, text: text.trim() });
  };

  const sendReaction = (emoji: string) => {
    // Instantly trigger animation beside current user's avatar
    triggerReaction(currentUser.id, emoji);

    // Notify other users in the room so their screens animate too
    initWs.send({ event: 'room:reaction', roomId: room.id, emoji: emoji as RoomReactionEmoji });

    const reactionMsg: IChatMessage = {
      id: `react-${Date.now()}`,
      roomId: room.id,
      userId: currentUser.id,
      userName: currentUser.name,
      text: `${currentUser.name} reacted with ${emoji}`,
      timestamp: Date.now(),
      type: 'reaction',
    };

    addMessage(reactionMsg);

    // Burst confetti only if it is the confetti / celebration reaction (🎉)
    if (emoji === '🎉') {
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { x: 0.5, y: 0.6 },
      });
    }
  };

  const handleFollow = (_member: OnlineUser) => {
    // No-op function executed upon clicking follow
  };

  const handleLeave = () => {
    playLeaveSound();
    onLeaveRoom();
  };

  return (
    <div
      id="room-view-container"
      className="w-full h-screen bg-black text-white flex flex-col overflow-hidden relative"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black border border-amber-500/50 text-amber-500 text-xs font-semibold shadow-xl shadow-black/80 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Body: Stage Area (Members Container with Controls) + Chat Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Audio Lounge Stage Screen Painel (Includes Controls Bar) */}
        <ScreenPainel
          room={room}
          currentUser={currentUser}
          activeMemberId={activeMemberId}
          onSelectMember={(member) => setActiveMemberId(member ? member.id : null)}
          isMuted={isMuted}
          onToggleMic={handleToggleMic}
          isCameraOn={isCameraOn}
          onToggleCamera={handleToggleCamera}
          isDeafened={isDeafened}
          onToggleAudio={handleToggleAudio}
          activeReactions={activeReactions}
          floatingHearts={floatingHearts}
          onFollow={handleFollow}
          onGiveHeart={handleFollow}
          onSendReaction={sendReaction}
          onLeave={handleLeave}
        />

        {/* Right Live Chat Panel Component */}
        <RoomChat
          messages={messages}
          currentUserId={currentUser.id}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};
