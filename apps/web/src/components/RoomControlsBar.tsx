import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LogOut,
  Video,
  VideoOff,
} from 'lucide-react';
import { ROOM_REACTION_EMOJIS } from '@repo/shared-types';

export interface RoomControlsBarProps {
  isMuted?: boolean;
  onToggleMic: () => void;
  isCameraOn?: boolean;
  onToggleCamera: () => void;
  isDeafened?: boolean;
  onToggleAudio: () => void;
  onSendReaction: (emoji: string) => void;
  onLeave: () => void;
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
  reactionEmojis = DEFAULT_REACTION_EMOJIS,
  className = '',
}) => {
  return (
    <div
      id="room-controls-bar"
      className={`w-full shrink-0 border-t border-white/20 bg-black/90 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3 z-30 flex-wrap sm:flex-nowrap ${className}`}
    >
      {/* Device Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mic Button */}
        <button
          id="stage-toggle-mic-btn"
          onClick={onToggleMic}
          title={!isMuted ? 'Desativar Microfone' : 'Ativar Microfone'}
          aria-label={!isMuted ? 'Desativar Microfone' : 'Ativar Microfone'}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
            !isMuted
              ? 'bg-amber-500 hover:bg-amber-500/90'
              : 'bg-black hover:bg-white/10 border border-white/20 text-white/70'
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
              ? 'bg-amber-500 hover:bg-amber-500/90'
              : 'bg-black hover:bg-white/10 border border-white/20 text-white/70'
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
              ? 'bg-amber-500 hover:bg-amber-500/90'
              : 'bg-black hover:bg-white/10 border border-white/20 text-white/70'
          }`}
        >
          {!isDeafened ? <Volume2 className="w-5 h-5 text-black" /> : <VolumeX className="w-5 h-5 text-white/70" />}
        </button>
      </div>

      {/* Reactions Group */}
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

      {/* Leave Room Button: Only Red button, circular, no border, white icon */}
      <button
        id="stage-leave-bottom-btn"
        onClick={onLeave}
        title="Sair da sala"
        aria-label="Sair da sala"
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-lg active:scale-95"
      >
        <LogOut className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};
