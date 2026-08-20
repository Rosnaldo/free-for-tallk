import React from 'react';
import { Phone, Ban, Heart, UserPlus } from 'lucide-react';
import { IRoom } from '@repo/shared-types';
import { getInitials } from '../utils/helpers';

interface RoomCardProps {
  room: IRoom;
  currentUserId?: string;
  onJoin: (room: IRoom) => void;
  onGiveHeart?: (roomId: string, targetUserId: string) => void;
  onOpenSettings?: (room: IRoom) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  currentUserId,
  onJoin,
}) => {
  const isFull = room.members.length >= room.maxSlots;
  const isMember = room.members.some((m) => m.id === currentUserId);
  const emptySlotsCount = Math.max(0, room.maxSlots - room.members.length);

  return (
    <div
      id={`room-card-${room.id}`}
      className="col-span-1 bg-transparent p-5 rounded-3xl border border-white/20 flex flex-col justify-between shadow-xl shadow-black/20 relative select-none"
    >
      <div>
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">
            {room.title}
          </h3>
          {room.subtitle && (
            <p className="text-xs text-white mt-1 line-clamp-2">
              {room.subtitle}
            </p>
          )}
        </div>

        {/* Avatars Bento Grid - Non-clickable */}
        <div className="my-3 min-h-[72px] flex items-center gap-3 flex-wrap pointer-events-none">
          {room.members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center group/member"
            >
              <div className="relative">
                {member.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full flex flex-col items-center justify-center shadow bg-white/10 border border-white/20">
                    <span className="text-white font-bold text-sm leading-none">
                      {getInitials(member.name)}
                    </span>
                    {member.unverified && (
                      <span className="text-[7px] text-white font-bold tracking-tighter uppercase mt-0.5">
                        BANCO
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Heart Display under avatar */}
              <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-xs text-amber-400">
                <Heart className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-semibold">{member.hearts || 0}</span>
              </div>
            </div>
          ))}

          {/* Empty Seats (Dashed Bento Style) - Non-clickable */}
          {Array.from({ length: emptySlotsCount }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white/60" />
              </div>
              <div className="h-4 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Card Action Button */}
      <div className="mt-4 pt-3 border-t border-white/20">
        {isFull && !isMember ? (
          <button
            id={`room-btn-full-${room.id}`}
            disabled
            className="w-full py-2.5 bg-transparent border border-white/20 rounded-xl text-xs font-bold text-white/50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Este grupo está cheio.</span>
          </button>
        ) : (
          <button
            id={`room-btn-talk-${room.id}`}
            onClick={() => onJoin(room)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              isMember
                ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 hover:border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-transparent hover:bg-amber-500 text-white hover:text-black border border-white/30 hover:border-amber-500'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{isMember ? 'Voltar para a sala' : 'Entrar e conversar!'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
