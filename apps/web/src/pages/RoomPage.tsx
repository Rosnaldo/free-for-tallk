import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomView } from '../components/RoomView';
import { Footer } from '../components/Footer';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useActiveRoomStore, useCurrentUserStore, useRoomListStore } from '../states/stores';
import { initWs } from '../services/ws/init-ws';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { currentUser } = useCurrentUserStore();
  const { rooms } = useRoomListStore();
  const { activeRoomId, setActiveRoomId } = useActiveRoomStore(); // Assuming you have an active room store for managing the active room state

  const targetRoomId = roomId || activeRoomId;
  const activeRoom = rooms.find((r) => r.id === targetRoomId) || null;

  useEffect(() => {
    if (roomId && activeRoomId !== roomId) {
      setActiveRoomId(roomId);
    }
  }, [roomId, activeRoomId, setActiveRoomId]);

  useEffect(() => {
    if (!activeRoom || !currentUser) return;
    const isMember = activeRoom.members.includes(currentUser.id);
    if (!isMember && activeRoom.members.length >= activeRoom.maxSlots) return;
    initWs.send({ event: 'room:join', roomId: activeRoom.id });
  }, [activeRoom, currentUser]);

  const handleLeaveRoom = () => {
    if (targetRoomId) {
      initWs.send({ event: 'room:leave', roomId: targetRoomId });
    }
    navigate('/');
  };

  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans relative p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-black border border-white/20 text-center shadow-2xl relative z-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Sala não encontrada</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            A sala especificada na URL (<span className="text-amber-400 font-mono">{targetRoomId}</span>) não foi encontrada ou já terminou.
          </p>
          <button
            onClick={() => {
              setActiveRoomId(null);
              navigate('/');
            }}
            className="mt-2 w-full py-3 rounded-xl bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para o início</span>
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col font-sans selection:bg-amber-400 selection:text-black relative">
      <RoomView
        room={activeRoom}
        currentUser={currentUser!}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  );
};
