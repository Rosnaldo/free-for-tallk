import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { RoomCard } from '../components/RoomCard';
import { FloatingActions } from '../components/FloatingActions';
import { CursorGlowDot } from '../components/CursorGlowDot';
import { BrazilMapBackground } from '../components/BrazilMapBackground';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { VoteHeroSection } from '../components/VoteHeroSection';
import { Footer } from '../components/Footer';
import { usePreloadRooms } from '../hooks/usePreloadRooms';
import { playJoinSound } from '../services/audio';
import { initWs } from '../services/ws/init-ws';
import { Users, CheckCircle, Loader2 } from 'lucide-react';
import { useCurrentUserStore, useRoomListStore } from '../states/stores';
import { IRoom } from '@repo/shared-types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preload initial rooms dataset on app start
  const { isLoading: isPreloading } = usePreloadRooms();

  const { currentUser } = useCurrentUserStore();
  const {
    rooms,
  } = useRoomListStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleJoinRoom = (room: IRoom) => {
    playJoinSound();
    showToast(`Joining "${room.title}"...`);
    navigate(`/room/${room.id}`);
  };

  const handleCreateRoom = (newRoomData: Partial<IRoom>) => {
    if (!currentUser) {
      showToast('You must be logged in to create a room.');
      return;
    }

    initWs.send({
      event: 'room:create',
      title: newRoomData.title || 'New Voice Lounge',
      subtitle: newRoomData.subtitle || 'Open dialogue session',
      maxSlots: newRoomData.maxSlots || 4,
    });

    setIsCreateModalOpen(false);
    showToast('Voice Lounge created!');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans relative select-none">
      {/* Dynamic Cursor Glowing Yellow Dot (Trailing follow effect) */}
      <CursorGlowDot />

      {/* Subtle Map Outline Vector Backdrop */}
      <BrazilMapBackground />

      {/* Global Toast Alert */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-black border border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <CheckCircle className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header />

      {/* Main App Layout: Discover Aside + Bento Grid Section */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Bento Grid Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-14 sm:pb-20 lg:pb-24 overflow-y-auto">
          {/* Isolated Hero Section with Vote Text and Create Room Button */}
          <VoteHeroSection
            onCreateRoom={() => setIsCreateModalOpen(true)}
          />

          {/* Bento Grid Rooms Section */}
          {isPreloading && rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
              <p className="text-xs font-semibold text-white/70">Loading Bento Rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-white/20 my-8 mb-12">
              <Users className="w-12 h-12 text-white/40 mb-3" />
              <h3 className="text-base font-bold text-white">No rooms available</h3>

            </div>
          ) : (
            <div
              id="rooms-bento-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 auto-rows-fr mb-10 sm:mb-14"
            >
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  currentUserId={currentUser?.id}
                  onJoin={handleJoinRoom}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <FloatingActions />

      {isCreateModalOpen && (
        <CreateRoomModal
          currentUser={currentUser!}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateRoom={handleCreateRoom}
        />
      )}

      <Footer />
    </div>
  );
};
