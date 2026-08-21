import React, { useState } from 'react';
import { playLeaveSound } from '../services/audio';
import { RoomChat } from './RoomChat';
import { ScreenPainel } from './ScreenPainel';
import confetti from 'canvas-confetti';
import { IChatMessage, IRoom, OnlineUser, RoomReactionEmoji } from '@repo/shared-types';
import { useChatStore, useDevicesStore, useReactionsStore } from '../states/stores';
import { initWs } from '../services/ws/init-ws';
import { useIsMobile } from '../hooks/useIsMobile';

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

  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  // Chat is a persistent sidebar on desktop but a modal opened via
  // RoomControlsBar's chat button on mobile (see ScreenPainel/RoomControlsBar).
  const isMobile = useIsMobile();
  const [isChatOpen, setIsChatOpen] = useState(false);

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
      className="w-full h-screen text-white flex flex-col overflow-hidden relative z-10"
    >
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
          onFollow={handleFollow}
          onGiveHeart={handleFollow}
          onSendReaction={sendReaction}
          onLeave={handleLeave}
          onOpenChat={() => setIsChatOpen(true)}
        />

        {/* Right Live Chat Panel on desktop; a bottom-sheet modal on mobile,
            opened via RoomControlsBar's chat button -- only one is ever
            mounted at a time (RoomChat's DOM ids aren't unique per instance). */}
        {isMobile ? (
          isChatOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/70 flex items-end"
              onClick={() => setIsChatOpen(false)}
            >
              <div
                className="w-full max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <RoomChat
                  messages={messages}
                  currentUserId={currentUser.id}
                  onSendMessage={handleSendMessage}
                  onClose={() => setIsChatOpen(false)}
                  className="rounded-t-2xl border-t-0 border-l-0 max-h-[85vh]"
                />
              </div>
            </div>
          )
        ) : (
          <RoomChat
            messages={messages}
            currentUserId={currentUser.id}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};
