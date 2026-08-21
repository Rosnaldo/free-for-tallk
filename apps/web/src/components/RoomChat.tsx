import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { MessageSquare, Coffee, Send, X } from 'lucide-react';
import { IChatMessage } from '@repo/shared-types';

export interface RoomChatProps {
  messages: IChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  // Rendered as a close (X) button in the header -- passed only when this is
  // shown as the mobile chat modal (see RoomView), never for the persistent
  // desktop sidebar.
  onClose?: () => void;
  className?: string;
}

export const RoomChat: React.FC<RoomChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onClose,
  className = '',
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div
      id="room-chat-panel"
      className={`w-full sm:w-80 sm:max-w-xs border-l border-white/20 bg-black/80 flex flex-col flex flex-1 ${className}`}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-white/20 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-white">Chat da Sala</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/60">
            {messages.length} mensagens
          </span>
          {onClose && (
            <button
              id="stage-chat-close-btn"
              onClick={onClose}
              title="Fechar chat"
              aria-label="Fechar chat"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/50 text-xs">
            <Coffee className="w-8 h-8 opacity-40 mb-2" />
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-[11px] mt-1 text-white/40">Diga oi para todo mundo no lounge!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="text-center py-1 px-2 rounded-lg bg-white/5 text-[10px] text-white/60 italic"
                >
                  {msg.text}
                </div>
              );
            }

            if (msg.type === 'reaction') {
              return (
                <div
                  key={msg.id}
                  className="text-center py-0.5 text-[11px] text-white/60"
                >
                  {msg.text}
                </div>
              );
            }

            const isMe = msg.userId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-white/60 mb-0.5 px-1">
                  {isMe ? 'Você' : msg.userName}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-amber-500 text-black font-medium rounded-br-none'
                      : 'bg-white/10 text-white border border-white/20 rounded-bl-none'
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

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/20 bg-transparent">
        <div className="flex items-center gap-2">
          <input
            id="stage-chat-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            id="stage-chat-send-btn"
            type="submit"
            disabled={!inputText.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 shadow ${
              inputText.trim()
                ? 'bg-amber-500 hover:bg-amber-500/90 text-black cursor-pointer'
                : 'bg-black border border-white/20 text-white/40 opacity-60 cursor-not-allowed'
            }`}
            title="Enviar Mensagem"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
