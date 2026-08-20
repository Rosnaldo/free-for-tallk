import React from 'react';
import { MicOff } from 'lucide-react';
import { HeartCounter } from './HeartCounter';
import { OnlineUser } from '@repo/shared-types';
import { getInitials } from '../utils/helpers';

export interface ReactionParticle {
  id: string;
  userId: string;
  emoji: string;
  tx: number;
  delayMs: number;
  sizeRem: number;
}

export interface RoomMemberProps {
  member: OnlineUser;
  isCurrent?: boolean;
  isUserCam?: boolean;
  isUserMuted?: boolean;
  activeReactions?: ReactionParticle[];
  onSelectMember?: (member: OnlineUser) => void;
  onFollow?: (member: OnlineUser) => void;
  onGiveHeart?: (member: OnlineUser) => void;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showHeartButton?: boolean;
  className?: string;
}

export const RoomMember: React.FC<RoomMemberProps> = ({
  member,
  isCurrent = false,
  isUserCam = false,
  isUserMuted = false,
  activeReactions = [],
  onSelectMember,
  onFollow,
  onGiveHeart,
  size = 'lg',
  showName = true,
  showHeartButton = true,
  className = '',
}) => {
  const memberReactions = activeReactions.filter((r) => r.userId === member.id);
  const followingCount = member.hearts ?? 0;

  const handleFollow = () => {
    if (onFollow) {
      onFollow(member);
    } else if (onGiveHeart) {
      onGiveHeart(member);
    }
  };

  const avatarSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  const initialsTextClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl sm:text-2xl',
  }[size];

  return (
    <div
      id={`stage-member-${member.id}`}
      className={`flex flex-col items-center group relative ${className}`}
    >
      {/* Avatar Circle with Status Badges and Reactions */}
      <div className="relative">
        {/* Active Multiple Reaction Particles Burst beside Avatar */}
        {memberReactions.map((r) => (
          <div
            key={r.id}
            style={{
              ['--tx' as any]: `${r.tx}px`,
              animationDelay: `${r.delayMs}ms`,
              fontSize: `${r.sizeRem}rem`,
            }}
            className="reaction-particle absolute -top-4 -right-1 z-30 pointer-events-none flex items-center justify-center select-none"
          >
            <span>{r.emoji}</span>
          </div>
        ))}

        {/* Clickable Avatar Container */}
        <div
          onClick={onSelectMember ? () => onSelectMember(member) : undefined}
          title={onSelectMember ? `Ver transmissão de ${member.name}` : undefined}
          role={onSelectMember ? 'button' : undefined}
          tabIndex={onSelectMember ? 0 : undefined}
          onKeyDown={
            onSelectMember
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMember(member);
                  }
                }
              : undefined
          }
          className={`${
            onSelectMember ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
          } rounded-full`}
        >
          {member.avatar ? (
            <div
              className={`${avatarSizeClasses} rounded-full overflow-hidden transition-all duration-300 shadow-xl border-2 border-transparent group-hover:border-amber-500/50`}
            >
              <img
                src={member.avatar}
                alt={member.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`${avatarSizeClasses} rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl bg-white/10 border border-white/20 group-hover:border-amber-500/50`}
            >
              <span className={`text-white font-bold leading-none ${initialsTextClasses}`}>
                {getInitials(member.name)}
              </span>
              {member.unverified && (
                <span className="text-[9px] text-white font-bold tracking-tighter uppercase mt-1">
                  BANCO
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mute badge */}
        {isUserMuted && (
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shadow pointer-events-none">
            <MicOff className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Member Name */}
      {showName && (
        <div className="mt-2.5 text-center">
          <p className="text-white font-medium text-sm flex items-center justify-center gap-1">
            <span>{member.name}</span>
            {isCurrent && <span className="text-[10px] text-amber-500 font-normal">(You)</span>}
          </p>
        </div>
      )}

      {/* Following / Hearts Counter Component */}
      {showHeartButton && (
        <HeartCounter
          id={`member-heart-counter-${member.id}`}
          count={followingCount}
          onClick={(onFollow || onGiveHeart) ? handleFollow : undefined}
          size="sm"
          label={`Seguir ${member.name}`}
          className="mt-1.5"
        />
      )}
    </div>
  );
};
