import React from 'react';
import { X, Users, ChevronDown, Check } from 'lucide-react';
import { useCreateRoomModal } from '../hooks/useCreateRoomModal';
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
  const {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    maxSlots,
    handleSubmit,
    isCapacityOpen,
    toggleCapacityDropdown,
    selectCapacity,
    capacityDropdownRef,
    capacityOptions,
  } = useCreateRoomModal({
    currentUser,
    onClose,
    onCreateRoom,
  });

  return (
    <>
      {/* 1. Translucent Backdrop with Blur (Covers full screen) - z-30 */}
      <div
        id="create-room-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-lg animate-in fade-in duration-200 cursor-pointer"
      />

      {/* 2. Solid Black Container Layer (z-40) - Sits behind the cursor dot (z-50) */}
      <div
        id="create-room-modal-black-overlay"
        aria-hidden="true"
        className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div className="w-full max-w-md bg-black rounded-3xl p-6 sm:p-7 space-y-5 my-auto pointer-events-none select-none shadow-2xl shadow-black animate-in zoom-in-95 duration-200">
          {/* Header replica to match geometry */}
          <div className="flex items-center justify-between border-b border-transparent pb-4 opacity-0">
            <h2 className="text-lg font-bold">Criar Sala</h2>
            <div className="p-1.5"><div className="w-5 h-5" /></div>
          </div>
          {/* Form replica to match geometry */}
          <div className="space-y-4 opacity-0">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5">Título da Sala</div>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-xs border border-transparent">Campo</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Tópico / Descrição</span>
                <span className="text-[10px]">Opcional</span>
              </div>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-xs border border-transparent">Campo</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Capacidade Máxima</span>
              </div>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-xs border border-transparent">Campo</div>
            </div>
            <div className="pt-2">
              <div className="w-full py-3 rounded-xl text-xs uppercase tracking-wider">Botão</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transparent Modal Window (z-[60]) - Sits in front of the cursor dot (z-50) */}
      <div
        id="create-room-modal-container"
        className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div
          id="create-room-card"
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md bg-transparent border border-white/20 rounded-3xl p-6 sm:p-7 space-y-5 my-auto animate-in zoom-in-95 duration-200"
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

            {/* Custom Styled Max Capacity Dropdown */}
            <div className="relative" ref={capacityDropdownRef}>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Capacidade Máxima</span>
              </label>

              {/* Dropdown Trigger Button */}
              <button
                id="create-room-capacity-trigger"
                type="button"
                onClick={toggleCapacityDropdown}
                aria-haspopup="listbox"
                aria-expanded={isCapacityOpen}
                className={`w-full flex items-center justify-between bg-white/5 border rounded-xl px-3.5 py-2.5 text-xs text-white transition-all cursor-pointer ${
                  isCapacityOpen
                    ? 'border-amber-500 bg-white/10 ring-1 ring-amber-500/30'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {maxSlots} {maxSlots === 1 ? 'vaga' : 'vagas'}
                  </span>
                  <span className="text-[11px] text-white/50">
                    (máximo de {maxSlots} participantes)
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                    isCapacityOpen ? 'rotate-180 text-amber-500' : ''
                  }`}
                />
              </button>

              {/* Custom Dropdown Menu Popover Window */}
              {isCapacityOpen && (
                <div
                  id="create-room-capacity-dropdown"
                  role="listbox"
                  className="absolute z-50 top-full left-0 right-0 mt-1.5 p-1 bg-black border border-white/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-in fade-in duration-100"
                >
                  <div className="space-y-0.5">
                    {capacityOptions.map((slots) => {
                      const isSelected = maxSlots === slots;
                      return (
                        <button
                          key={slots}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => selectCapacity(slots)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-black font-bold shadow'
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Users
                              className={`w-3.5 h-3.5 ${
                                isSelected ? 'text-black' : 'text-amber-500'
                              }`}
                            />
                            <span>
                              {slots} {slots === 1 ? 'vaga' : 'vagas'}
                            </span>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-black stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button: "Create Room" (no glow, no plus icon) */}
            <div className="pt-2">
              <button
                id="submit-create-room-btn"
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-500/90 text-black font-bold text-xs uppercase tracking-wider transition-opacity flex items-center justify-center cursor-pointer active:scale-95"
              >
                Criar Sala
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
