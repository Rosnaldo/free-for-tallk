import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Heart,
  Send,
  Sparkles,
  Users,
  LogOut,
  Coffee,
  MessageSquare,
  Video,
  VideoOff,
} from 'lucide-react';
import { IRoom, IChatMessage, OnlineUser } from '@repo/shared-types';
import { useDevicesStore } from '../states/stores';
import confetti from 'canvas-confetti';
import { playLeaveSound } from '../services/audio';

export interface LobbyProps {
  room: IRoom;
  currentUser: OnlineUser;
  onLeaveRoom: () => void;
  onGiveHeart: (roomId: string, targetUserId: string) => void;
}

const REACTION_EMOJIS = ['❤️', '👏', '😂', '🎉'];

interface ReactionParticle {
  id: string;
  userId: string;
  emoji: string;
  tx: number;
  delayMs: number;
  sizeRem: number;
}

export const Lobby: React.FC<LobbyProps> = ({
  room,
  currentUser,
  onLeaveRoom,
  onGiveHeart,
}) => {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  const [activeReactions, setActiveReactions] = useState<ReactionParticle[]>([]);

  // Devices state from Zustand store
  const {
    microphoneOn,
    cameraOn,
    setMicrophoneOn,
    setCameraOn,
  } = useDevicesStore();

  const [isDeafened, setIsDeafened] = useState(false);

  const isMuted = !microphoneOn;
  const isCameraOn = cameraOn;

  const chatEndRef = useRef<HTMLDivElement>(null);

  const triggerUserReaction = (userId: string, emoji: string) => {
    if (emoji === '🎉') return;

    const batchId = `react-batch-${Date.now()}-${Math.random()}`;
    const particle: ReactionParticle = {
      id: `${batchId}-0`,
      userId,
      emoji,
      tx: 0,
      delayMs: 0,
      sizeRem: 2.4,
    };

    // Replace any existing active reaction for this user so only 1 icon renders
    setActiveReactions((prev) => {
      const filtered = prev.filter((p) => p.userId !== userId);
      return [...filtered, particle];
    });

    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((p) => !p.id.startsWith(batchId)));
    }, 2400);
  };

  const showRoomToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Load chat history & listen to room events
  useEffect(() => {
    // Fetch initial chat messages
    fetch(`/api/rooms/${room.id}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});
  }, [room.id]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Camera Toggle
  const handleToggleCamera = () => {
    setCameraOn(!cameraOn);
  };

  // Mic Toggle
  const handleToggleMic = () => {
    setMicrophoneOn(!microphoneOn);
  };

  // Deafen / Audio Toggle
  const handleToggleAudio = () => {
    setIsDeafened((prev) => !prev);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: IChatMessage = {
      id: `msg-${Date.now()}`,
      roomId: room.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: inputText.trim(),
      timestamp: Date.now(),
      type: 'text',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const sendReaction = (emoji: string) => {
    // Instantly trigger animation beside current user's avatar
    triggerUserReaction(currentUser.id, emoji);

    // const reactionMsg: IChatMessage = {
    //   id: `react-${Date.now()}`,
    //   roomId: room.id,
    //   userId: currentUser.id,
    //   userName: currentUser.name,
    //   text: `${currentUser.name} reacted with ${emoji}`,
    //   timestamp: Date.now(),
    //   type: 'reaction',
    // };

    // Burst confetti only if it is the confetti / celebration reaction (🎉)
    if (emoji === '🎉') {
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { x: 0.5, y: 0.6 },
      });
    }
  };

  const triggerFloatingHeart = (_targetUserId: string, label: string) => {
    const id = `heart-${Date.now()}-${Math.random()}`;
    setFloatingHearts((prev) => [...prev, { id, x: Math.random() * 60 + 20, y: 50, text: label }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  const handleGiveHeartInRoom = (member: OnlineUser) => {
    onGiveHeart(room.id, member.id);
  };

  const handleLeave = () => {
    playLeaveSound();
    onLeaveRoom();
  };

  return (
    <div
      id="room-page-container"
      className="w-full h-screen bg-black text-zinc-100 flex flex-col overflow-hidden relative"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/95 border border-amber-500/50 text-amber-200 text-xs font-semibold shadow-xl shadow-black/80 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black/60 shrink-0">
        <div className="min-w-0">
          <h1 className="text-zinc-100 font-bold text-base sm:text-lg tracking-tight truncate">
            {room.title}
          </h1>
          {room.subtitle && (
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {room.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Main Body: Stage Area + Chat Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Audio Lounge Stage */}
        <div
          className={`flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto ${
            showChatOnMobile ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Stage Grid of Participants */}
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-2xl w-full justify-items-center my-auto">
              {room.members.map((member) => {
                const isCurrent = member.id === currentUser.id;
                const isUserMuted = isCurrent ? isMuted : false;
                const isUserCam = isCurrent ? isCameraOn : false;

                return (
                  <div
                    key={member.id}
                    id={`lobby-stage-member-${member.id}`}
                    className="flex flex-col items-center group relative"
                  >
                    {/* Avatar Circle on Stage */}
                    <div className="relative">
                      {/* Active Multiple Reaction Particles Burst beside Avatar */}
                      {activeReactions
                        .filter((r) => r.userId === member.id)
                        .map((r) => (
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

                      {member.avatar ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden transition-all duration-300 shadow-xl">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl"
                          style={{ backgroundColor: '#27272a' }}
                        >
                          <span className="text-zinc-100 font-bold text-xl sm:text-2xl leading-none">
                            {member.initials || member.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Camera badge for user */}
                      {isUserCam && (
                        <div className="absolute top-0 left-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow">
                          <Video className="w-3.5 h-3.5 text-zinc-950" />
                        </div>
                      )}

                      {/* Mute badge */}
                      {isUserMuted && (
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center shadow">
                          <MicOff className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name & Tag */}
                    <div className="mt-2.5 text-center">
                      <p className="text-zinc-100 font-medium text-sm flex items-center justify-center gap-1">
                        <span>{member.name}</span>
                        {isCurrent && <span className="text-[10px] text-amber-400 font-normal">(You)</span>}
                      </p>
                    </div>

                    {/* Heart Button */}
                    <button
                      type="button"
                      onClick={() => handleGiveHeartInRoom(member)}
                      className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-rose-400 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title={`Give love to ${member.name}`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400 hover:fill-rose-400 hover:text-rose-400 transition-colors" />
                      <span>{member.hearts || 0}</span>
                    </button>
                  </div>
                );
              })}

              {/* Empty Seats */}
              {Array.from({ length: Math.max(0, room.maxSlots - room.members.length) }).map((_, idx) => (
                <div key={`lobby-empty-${idx}`} className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/40">
                    <Users className="w-6 h-6 opacity-40 mb-1" />
                    <span className="text-[10px] font-medium text-zinc-500">Open Seat</span>
                  </div>
                  <div className="h-10" />
                </div>
              ))}
            </div>
          </div>

          {/* Stage Floating Heart Labels */}
          {floatingHearts.map((h) => (
            <div
              key={h.id}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-1/2 animate-out fade-out slide-out-to-top duration-1000 text-xs font-bold text-rose-300 bg-rose-950/90 border border-rose-500/50 px-3 py-1 rounded-full shadow-lg"
            >
              {h.text}
            </div>
          ))}

          {/* Quick Reactions Bar */}
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 mr-1 hidden sm:inline">Reactions:</span>
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-base hover:scale-115 active:scale-95 transition-transform cursor-pointer shadow"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Audio & Video Controls Bar */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 bg-transparent p-2 sm:p-3 rounded-2xl">
            <div className="flex items-center gap-3">
              {/* Mic Button: Yellow when enabled (not muted), Darker than parent when disabled (muted) */}
              <button
                id="lobby-toggle-mic-btn"
                onClick={handleToggleMic}
                title={!isMuted ? 'Desativar Microfone' : 'Ativar Microfone'}
                aria-label={!isMuted ? 'Desativar Microfone' : 'Ativar Microfone'}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  !isMuted
                    ? 'bg-amber-500 hover:bg-amber-400'
                    : 'bg-zinc-950 hover:bg-black border border-zinc-800 text-zinc-400'
                }`}
              >
                {!isMuted ? <Mic className="w-5 h-5 text-zinc-950" /> : <MicOff className="w-5 h-5 text-zinc-400" />}
              </button>

              {/* Camera Button: Yellow when enabled (camera on), Darker than parent when disabled (camera off) */}
              <button
                id="lobby-toggle-camera-btn"
                onClick={handleToggleCamera}
                title={isCameraOn ? 'Desativar Câmera' : 'Ativar Câmera'}
                aria-label={isCameraOn ? 'Desativar Câmera' : 'Ativar Câmera'}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isCameraOn
                    ? 'bg-amber-500 hover:bg-amber-400'
                    : 'bg-zinc-950 hover:bg-black border border-zinc-800 text-zinc-400'
                }`}
              >
                {isCameraOn ? <Video className="w-5 h-5 text-zinc-950" /> : <VideoOff className="w-5 h-5 text-zinc-400" />}
              </button>

              {/* Speaker / Audio Button: Yellow when enabled (audio active), Darker than parent when disabled (audio muted) */}
              <button
                id="lobby-toggle-deafen-btn"
                onClick={handleToggleAudio}
                title={!isDeafened ? 'Silenciar Áudio' : 'Ativar Áudio'}
                aria-label={!isDeafened ? 'Silenciar Áudio' : 'Ativar Áudio'}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  !isDeafened
                    ? 'bg-amber-500 hover:bg-amber-400'
                    : 'bg-zinc-950 hover:bg-black border border-zinc-800 text-zinc-400'
                }`}
              >
                {!isDeafened ? <Volume2 className="w-5 h-5 text-zinc-950" /> : <VolumeX className="w-5 h-5 text-zinc-400" />}
              </button>

              {/* Mobile Chat Toggle Button: Yellow when open, Darker than parent when closed */}
              <button
                id="lobby-mobile-chat-toggle-btn"
                onClick={() => setShowChatOnMobile(!showChatOnMobile)}
                title={showChatOnMobile ? 'Ver Palco' : 'Ver Chat'}
                aria-label={showChatOnMobile ? 'Ver Palco' : 'Ver Chat'}
                className={`sm:hidden w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  showChatOnMobile
                    ? 'bg-amber-500 hover:bg-amber-400'
                    : 'bg-zinc-950 hover:bg-black border border-zinc-800 text-zinc-400'
                }`}
              >
                <MessageSquare className={`w-5 h-5 ${showChatOnMobile ? 'text-zinc-950' : 'text-zinc-400'}`} />
              </button>
            </div>

            {/* Leave Room Button: Only Red button, circular, no border, white icon */}
            <button
              id="lobby-leave-bottom-btn"
              onClick={handleLeave}
              title="Sair da sala"
              aria-label="Sair da sala"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Right Live Chat Panel */}
        <div
          className={`w-full sm:w-80 sm:max-w-xs border-l border-zinc-800 bg-black/80 flex flex-col ${
            showChatOnMobile ? 'flex flex-1' : 'hidden sm:flex'
          }`}
        >
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200">Room Chat</span>
            </div>
            <span className="text-[11px] text-zinc-400">
              {messages.length} messages
            </span>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500 text-xs">
                <Coffee className="w-8 h-8 opacity-40 mb-2" />
                <p>No messages yet.</p>
                <p className="text-[11px] mt-1 text-zinc-600">Say hi to everyone in the lounge!</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.type === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="text-center py-1 px-2 rounded-lg bg-zinc-900/60 text-[10px] text-zinc-400 italic"
                    >
                      {msg.text}
                    </div>
                  );
                }

                if (msg.type === 'reaction') {
                  return (
                    <div
                      key={msg.id}
                      className="text-center py-0.5 text-[11px] text-zinc-400"
                    >
                      {msg.text}
                    </div>
                  );
                }

                const isMe = msg.userId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-zinc-400 mb-0.5 px-1">
                      {isMe ? 'You' : msg.userName}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-amber-500 text-zinc-950 font-medium rounded-br-none'
                          : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-transparent">
            <div className="flex items-center gap-2">
              <input
                id="lobby-chat-message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                id="lobby-chat-send-btn"
                type="submit"
                disabled={!inputText.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 shadow ${
                  inputText.trim()
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer'
                    : 'bg-zinc-950 border border-zinc-800/80 text-zinc-600 opacity-60 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
