import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserBadge } from './UserBadge';
import { useCurrentUserStore } from '../states/stores';
import { useLogout } from '../hooks/auth/useLogout';
import logoMissao from '../assets/logo-missao-mark.webp';

export const Header: React.FC = () => {
  const { currentUser } = useCurrentUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    useLogout();
    navigate('/login');
  };

  const handleOpenConfig = () => {
    navigate('/profile');
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-30 w-full bg-black border-b border-white/20 transition-colors"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mission Logo */}
        <img
          id="main-header-logo"
          src={logoMissao}
          alt="Missão"
          className="h-9 w-auto"
        />

        {/* Right Action Group: User Badge */}
        <div className="flex items-center gap-3">
          <UserBadge
            currentUser={currentUser}
            onOpenConfig={handleOpenConfig}
            onLogout={handleLogout}
            onLogin={() => navigate('/login')}
            onHome={() => navigate('/')}
          />
        </div>
      </div>
    </header>
  );
};

