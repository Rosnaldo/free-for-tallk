import React from 'react';
import { Monitor, Video, VideoOff, Maximize2, User as UserIcon, X } from 'lucide-react';
import { getInitials } from '../utils/helpers';
import { OnlineUser } from '@repo/shared-types';

export interface RoomMemberMediaStageProps {
  member: OnlineUser;
  isCurrent?: boolean;
  isCamOn?: boolean;
  isSharingScreen?: boolean;
  onClose?: () => void;
  onSelectMember?: (member: OnlineUser) => void;
  members?: OnlineUser[];
  className?: string;
}

export const RoomMemberMediaStage: React.FC<RoomMemberMediaStageProps> = ({
  member,
  isCurrent = false,
  isCamOn = false,
  isSharingScreen = false,
  onClose,
  className = '',
}) => {
  const hasCam = isCurrent ? isCamOn : (member.cameraOn ?? false);
  const hasScreen = isCurrent ? isSharingScreen : (member.isSharingScreen ?? false);
  const screenTitle = `${member.name}'s Shared Screen`;

  return (
    <div
      id={`member-media-stage-${member.id}`}
      className={`w-full h-full flex flex-col p-3 sm:p-5 relative ${className}`}
    >
      {/* Top Header inside Stage */}
      {onClose && (
        <div className="flex items-center justify-end mb-3 shrink-0">
          <button
            id="close-media-stage-btn"
            type="button"
            onClick={onClose}
            title="Voltar para grade de membros"
            aria-label="Voltar para grade de membros"
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white/80 hover:text-white border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver todos os membros</span>
          </button>
        </div>
      )}

      {/* Main View Area: Screen Share or Primary Camera Feed */}
      <div className="flex-1 min-h-0 grid grid-cols-1 gap-3 relative rounded-2xl overflow-hidden border border-white/15 bg-neutral-950">
        {hasScreen ? (
          /* Screen Share Main Container */
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-4">
            {/* Simulated Desktop / App Window in Screen Share */}
            <div className="w-full h-full max-w-4xl max-h-[500px] rounded-xl border border-white/20 bg-neutral-900/90 shadow-2xl flex flex-col overflow-hidden">
              {/* Window Titlebar */}
              <div className="h-8 bg-neutral-900 border-b border-white/10 px-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-white/60 ml-2 font-mono truncate max-w-xs sm:max-w-md">
                    {screenTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    1080p 60fps
                  </span>
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Window Content Display */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-neutral-950 to-neutral-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                  <Monitor className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-white mb-1">
                  {screenTitle}
                </h4>
                <p className="text-xs text-white/50 max-w-md">
                  Transmissão em tempo real da tela de {member.name}. Áudio do sistema habilitado.
                </p>
              </div>
            </div>

            {/* Picture-in-Picture Floating Camera of Speaker if Camera is also ON */}
            {hasCam && (
              <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-44 sm:h-32 rounded-xl border-2 border-amber-500/60 bg-neutral-900 shadow-2xl overflow-hidden z-20 transition-all hover:scale-105">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-white">
                    <UserIcon className="w-8 h-8 opacity-60 mb-1" />
                    <span className="text-xs font-bold">{getInitials(member.name)}</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1 font-medium">
                  <Video className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{member.name}</span>
                </div>
              </div>
            )}
          </div>
        ) : hasCam ? (
          /* Camera Feed Main Container */
          <div className="w-full h-full relative flex items-center justify-center bg-neutral-950 p-4">
            <div className="w-full h-full max-w-3xl max-h-[500px] rounded-2xl overflow-hidden border border-white/20 bg-neutral-900 relative shadow-2xl flex items-center justify-center">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-800 to-neutral-950 text-white">
                  <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-bold mb-3">
                    {getInitials(member.name)}
                  </div>
                  <p className="text-base font-semibold">{member.name}</p>
                </div>
              )}

              {/* Camera Active Overlay Badge */}
              <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-white flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">{member.name}</span>
                <span className="text-white/40">| Câmera HD</span>
              </div>
            </div>
          </div>
        ) : (
          /* Neither Camera nor Screen Active for this user */
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-neutral-950">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-2xl mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold text-white mb-4">
                {getInitials(member.name)}
              </div>
            )}
            <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
            <p className="text-xs text-white/50 max-w-sm mb-4">
              Este participante está participando por áudio. Nenhuma câmera ou compartilhamento de tela ativo no momento.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <VideoOff className="w-3.5 h-3.5" />
              <span>Vídeo desligado</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
