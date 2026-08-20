import React, { useState, useRef, useEffect } from 'react';
import { Heart, Settings, LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { getInitials } from '../utils/helpers';
import { OnlineUser } from '@repo/shared-types';

export interface UserBadgeProps {
  currentUser?: OnlineUser;
  onOpenConfig?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  currentUser,
  onOpenConfig,
  onLogout,
  onLogin,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="header-user-badge-trigger"
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-expanded={dropdownOpen}
        aria-haspopup="menu"
        className={`flex items-center gap-2.5 p-1 pl-3 pr-1.5 rounded-full border bg-transparent text-left transition-colors cursor-pointer ${
          dropdownOpen
            ? 'border-white/40'
            : 'border-white/20 hover:border-white/40'
        }`}
      >
        {currentUser ? (
          <>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] flex items-center gap-1 mt-0.5">
                <Heart className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-amber-500">{currentUser.hearts || 0}</span>
              </p>
            </div>

            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-black shadow-sm">
                {getInitials(currentUser.name)}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                Visitante
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">
                Clique para entrar
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 shadow-sm">
              <UserIcon className="w-4 h-4" />
            </div>
          </>
        )}
      </button>

      {/* User Dropdown Menu */}
      {dropdownOpen && (
        <div
          id="header-user-dropdown-menu"
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-black border border-white/20 rounded-2xl p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {currentUser ? (
            <>
              {/* User Mini Info Header */}
              <div className="px-3 py-2 border-b border-white/15 mb-1">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] truncate mt-0.5 flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span className="font-semibold text-amber-500">{currentUser.hearts || 0}</span>
                </p>
              </div>

              {/* Config / Settings Option */}
              <button
                id="dropdown-config-btn"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenConfig?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-white/70" />
                <span>Config</span>
              </button>

              {/* Logout Option */}
              <button
                id="dropdown-logout-btn"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Guest Mini Info Header */}
              <div className="px-3 py-2 border-b border-white/15 mb-1">
                <p className="text-xs font-bold text-white truncate">Visitante</p>
                <p className="text-[10px] text-white/60 truncate mt-0.5">
                  Faça login para salvar seu progresso
                </p>
              </div>

              {/* Login Option */}
              <button
                id="dropdown-login-btn"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogin?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-500 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4 text-amber-500" />
                <span>Login</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
