import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LogOut,
  Video,
  VideoOff,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react';
import { ROOM_REACTION_EMOJIS } from '@repo/shared-types';
import { useIsMobile } from '../hooks/useIsMobile';

export interface RoomControlsBarProps {
  isMuted?: boolean;
  onToggleMic: () => void;
  isCameraOn?: boolean;
  onToggleCamera: () => void;
  isDeafened?: boolean;
  onToggleAudio: () => void;
  onSendReaction: (emoji: string) => void;
  onLeave: () => void;
  onOpenChat?: () => void;
  reactionEmojis?: string[];
  className?: string;
}

const DEFAULT_REACTION_EMOJIS: string[] = [...ROOM_REACTION_EMOJIS];

export const RoomControlsBar: React.FC<RoomControlsBarProps> = ({
  isMuted = false,
  onToggleMic,
  isCameraOn = false,
  onToggleCamera,
  isDeafened = false,
  onToggleAudio,
  onSendReaction,
  onLeave,
  onOpenChat,
  reactionEmojis = DEFAULT_REACTION_EMOJIS,
  className = '',
}) => {
  const isMobile = useIsMobile();
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Reused both inline (desktop) and inside the mobile settings modal below
  // -- never rendered in both places at once, since these buttons have fixed
  // ids that can't be duplicated in the DOM.
  const deviceControlsButtons = (
    <>
      {/* Mic Button */}
      <button
        id="stage-toggle-mic-btn"
        onClick={onToggleMic}
        title={!isMuted ? 'Desativar Microfone' : 'Ativar Microfone'}
        aria-label={!isMuted ? 'Desativar Microfone' : 'Ativar Microfone'}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
          !isMuted
            ? 'bg-amber-400 hover:bg-amber-400/90'
            : 'bg-transparent hover:bg-white/10 border border-white/20 text-white/70'
        }`}
      >
        {!isMuted ? <Mic className="w-5 h-5 text-black" /> : <MicOff className="w-5 h-5 text-white/70" />}
      </button>

      {/* Camera Button */}
      <button
        id="stage-toggle-camera-btn"
        onClick={onToggleCamera}
        title={isCameraOn ? 'Desativar Câmera' : 'Ativar Câmera'}
        aria-label={isCameraOn ? 'Desativar Câmera' : 'Ativar Câmera'}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
          isCameraOn
            ? 'bg-amber-400 hover:bg-amber-400/90'
            : 'bg-transparent hover:bg-white/10 border border-white/20 text-white/70'
        }`}
      >
        {isCameraOn ? <Video className="w-5 h-5 text-black" /> : <VideoOff className="w-5 h-5 text-white/70" />}
      </button>

      {/* Speaker / Audio Button */}
      <button
        id="stage-toggle-deafen-btn"
        onClick={onToggleAudio}
        title={!isDeafened ? 'Silenciar Áudio' : 'Ativar Áudio'}
        aria-label={!isDeafened ? 'Silenciar Áudio' : 'Ativar Áudio'}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
          !isDeafened
            ? 'bg-amber-400 hover:bg-amber-400/90'
            : 'bg-transparent hover:bg-white/10 border border-white/20 text-white/70'
        }`}
      >
        {!isDeafened ? <Volume2 className="w-5 h-5 text-black" /> : <VolumeX className="w-5 h-5 text-white/70" />}
      </button>
    </>
  );

  const reactionsGroup = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {reactionEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSendReaction(emoji)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow border border-white/10"
          title={`Enviar ${emoji}`}
          aria-label={`Reagir com ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  const leaveButton = (
    <button
      id="stage-leave-bottom-btn"
      onClick={onLeave}
      title="Sair da sala"
      aria-label="Sair da sala"
      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-lg active:scale-95"
    >
      <LogOut className="w-5 h-5 text-white" />
    </button>
  );

  return (
    <div
      id="room-controls-bar"
      className={`w-full shrink-0 border-t border-white/20 bg-transparent px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3 z-30 flex-wrap sm:flex-nowrap ${className}`}
    >
      {isMobile ? (
        <>
          {/* Reactions in the left corner */}
          {reactionsGroup}

          {/* Right corner: device settings, chat, leave -- grouped together */}
          <div className="flex items-center gap-2">
            <button
              id="stage-open-device-settings-btn"
              onClick={() => setIsDeviceModalOpen(true)}
              title="Configurações de dispositivo"
              aria-label="Configurações de dispositivo"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-black hover:bg-white/10 border border-white/20 text-white/70 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Settings className="w-5 h-5 text-white/70" />
            </button>

            {onOpenChat && (
              <button
                id="stage-open-chat-btn"
                onClick={onOpenChat}
                title="Abrir chat"
                aria-label="Abrir chat"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black hover:bg-white/10 border border-white/20 text-white/70 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <MessageSquare className="w-5 h-5 text-white/70" />
              </button>
            )}

            {leaveButton}
          </div>
        </>
      ) : (
        <>
          {/* Device Controls */}
          <div className="flex items-center gap-2 sm:gap-3">{deviceControlsButtons}</div>

          {reactionsGroup}

          {leaveButton}
        </>
      )}

      {/* Device Settings Modal: mobile-only, opened via the gear button above */}
      {isMobile && isDeviceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end"
          onClick={() => setIsDeviceModalOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl border-t border-white/20 bg-black/95 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white">Dispositivos</span>
              <button
                id="stage-close-device-settings-btn"
                onClick={() => setIsDeviceModalOpen(false)}
                title="Fechar"
                aria-label="Fechar"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-4">{deviceControlsButtons}</div>
          </div>
        </div>
      )}
    </div>
  );
};
