import React from 'react';
import { Users } from 'lucide-react';
import { RoomMember, ReactionParticle } from './RoomMember';
import { RoomControlsBar } from './RoomControlsBar';
import { RoomMemberMediaStage } from './RoomMemberMediaStage';
import { IRoom, OnlineUser } from '@repo/shared-types';
import { useOnlineUserListStore } from '../states/stores';

export interface FloatingHeart {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface ScreenPainelProps {
  room: IRoom;
  currentUser: OnlineUser;
  activeMemberId?: string | null;
  onSelectMember?: (member: OnlineUser | null) => void;
  isMuted?: boolean;
  onToggleMic?: () => void;
  isCameraOn?: boolean;
  onToggleCamera?: () => void;
  isDeafened?: boolean;
  onToggleAudio?: () => void;
  activeReactions?: ReactionParticle[];
  floatingHearts?: FloatingHeart[];
  onFollow?: (member: OnlineUser) => void;
  onGiveHeart?: (member: OnlineUser) => void;
  onSendReaction?: (emoji: string) => void;
  onLeave?: () => void;
  showChatOnMobile?: boolean;
  onToggleChatOnMobile?: () => void;
  className?: string;
}

export const ScreenPainel: React.FC<ScreenPainelProps> = ({
  room,
  currentUser,
  activeMemberId = null,
  onSelectMember,
  isMuted = false,
  onToggleMic,
  isCameraOn = false,
  onToggleCamera,
  isDeafened = false,
  onToggleAudio,
  activeReactions = [],
  floatingHearts = [],
  onFollow,
  onGiveHeart,
  onSendReaction,
  onLeave,
  showChatOnMobile = false,
  onToggleChatOnMobile,
  className = '',
}) => {
  const { onlineUsers } = useOnlineUserListStore();
  const emptySeatsCount = Math.max(0, room.maxSlots - room.members.length);
  const activeMember = onlineUsers.find((u) => u.id === activeMemberId);

  return (
    <div
      id="screen-painel"
      className={`flex-1 flex flex-col justify-between overflow-hidden relative ${
        showChatOnMobile ? 'hidden sm:flex' : 'flex'
      } ${className}`}
    >
      {/* Main Content: Stage Grid of Participants OR Selected Member's Media Stage */}
      {activeMember ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <RoomMemberMediaStage
            member={activeMember}
            isCurrent={activeMember.id === currentUser.id}
            isCamOn={activeMember.id === currentUser.id ? isCameraOn : activeMember.cameraOn}
            isSharingScreen={activeMember.isSharingScreen}
            onClose={() => onSelectMember && onSelectMember(null)}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-2xl w-full justify-items-center my-auto">
            {room.members.map((id) => {
              const isCurrent = id === currentUser.id;
              const member = onlineUsers.find((u) => u.id === id);

              if (!member) return null;

              const isUserMuted = isCurrent ? isMuted : member.microphoneOn === false;
              const isUserCam = isCurrent ? isCameraOn : (member.cameraOn ?? false);

              return (
                <RoomMember
                  key={id}
                  member={member}
                  isCurrent={isCurrent}
                  isUserMuted={isUserMuted}
                  isUserCam={isUserCam}
                  activeReactions={activeReactions}
                  onSelectMember={(m) => onSelectMember && onSelectMember(m)}
                  onFollow={onFollow}
                  onGiveHeart={onGiveHeart}
                />
              );
            })}

            {/* Empty Seats */}
            {Array.from({ length: emptySeatsCount }).map((_, idx) => (
              <div key={`stage-empty-${idx}`} className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-white/60 bg-white/5">
                  <Users className="w-6 h-6 opacity-60 mb-1" />
                  <span className="text-[10px] font-medium text-white/70">Open Seat</span>
                </div>
                <div className="h-10" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Heart Labels */}
      {floatingHearts.map((h) => (
        <div
          key={h.id}
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
          className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-1/2 animate-out fade-out slide-out-to-top duration-1000 text-xs font-bold text-rose-300 bg-rose-950/90 border border-rose-500/50 px-3 py-1 rounded-full shadow-lg"
        >
          {h.text}
        </div>
      ))}

      {/* Bottom Controls Bar inside ScreenPainel */}
      {onToggleMic && onToggleCamera && onToggleAudio && onSendReaction && onLeave && (
        <RoomControlsBar
          isMuted={isMuted}
          onToggleMic={onToggleMic}
          isCameraOn={isCameraOn}
          onToggleCamera={onToggleCamera}
          isDeafened={isDeafened}
          onToggleAudio={onToggleAudio}
          showChatOnMobile={showChatOnMobile}
          onToggleChatOnMobile={onToggleChatOnMobile}
          onSendReaction={onSendReaction}
          onLeave={onLeave}
        />
      )}
    </div>
  );
};
