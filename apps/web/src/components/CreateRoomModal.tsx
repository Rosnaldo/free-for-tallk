import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { IRoom, OnlineUser } from '@repo/shared-types';

interface CreateRoomModalProps {
  currentUser: OnlineUser;
  onClose: () => void;
  onCreateRoom: (roomData: Partial<IRoom>) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  currentUser,
  onClose,
  onCreateRoom,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [maxSlots, setMaxSlots] = useState<number>(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateRoom({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      maxSlots,
      creator: currentUser,
      members: [
        {
          ...currentUser,
          microphoneOn: true,
        },
      ],
    });
  };

  return (
    <div
      id="create-room-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        id="create-room-card"
        className="w-full max-w-md bg-black border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/90 space-y-5 my-auto"
      >
        {/* Modal Header: Only the title and close button */}
        <div className="flex items-center justify-between border-b border-white/20 pb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Criar Sala</h2>
          <button
            id="close-create-room-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Title */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Título da Sala
            </label>
            <input
              id="create-room-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Bate-papo Aberto"
              required
              autoFocus
              className="w-full bg-white/5 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Subtitle / Topic (Optional) */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Tópico / Descrição</span>
              <span className="text-[10px] text-white/50 font-normal">Opcional</span>
            </label>
            <input
              id="create-room-subtitle-input"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="ex: Conversa sobre o dia a dia"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Max Capacity */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Capacidade Máxima</span>
            </label>
            <div className="grid grid-cols-4 gap-2 bg-white/5 p-1.5 rounded-xl border border-white/20">
              {[2, 3, 4, 6].map((slots) => (
                <button
                  type="button"
                  key={slots}
                  onClick={() => setMaxSlots(slots)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    maxSlots === slots
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {slots} vagas
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button: "Create Room" (no glow, no plus icon) */}
          <div className="pt-2">
            <button
              id="submit-create-room-btn"
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer active:scale-95"
            >
              Criar Sala
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
