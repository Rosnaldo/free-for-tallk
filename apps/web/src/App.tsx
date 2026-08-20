import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "sonner";
import { LoginPage } from './pages/LoginPage.tsx';
import { ErrorPage } from './pages/ErrorPage.tsx';
import { UserProfileContainer } from './pages/user-profile/container.tsx';
import { useAuthStore } from './states/stores.ts';
import { HomePage } from './pages/HomePage.tsx';
import { RoleProtectedRoute } from './role-protected-route.tsx';
import { RoomPage } from './pages/RoomPage.tsx';
import { usePreloadRooms } from './hooks/usePreloadRooms.ts';
import { usePreloadOnlineUsers } from './hooks/usePreloadOnlineUsers.ts';


export default function App() {
  const ready = useAuthStore((s) => s.ready);
  const error = useAuthStore((s) => s.error);

  usePreloadRooms();
  usePreloadOnlineUsers();

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-brand-canvas)]">
      <div className="text-center bg-white p-8 rounded-2xl border border-slate-200/50 max-w-sm shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Initialization Error</h3>
        <p className="text-xs text-slate-500 mt-2">{error}</p>
        <button
          onClick={() => window.location.replace('/login')}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!ready) return <div>Loading session…</div>;

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RoleProtectedRoute allowedRoles={['member', 'admin']} />}>
          <Route path="/profile" element={<UserProfileContainer />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
        </Route>

        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
