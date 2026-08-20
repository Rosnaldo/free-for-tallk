import { useNavigate } from 'react-router-dom';
import { useAuthentication } from './useAuthentication.ts';
import { DailyService } from '../../services/daily.ts';

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuthentication();

  return () => {
    DailyService.getInstance().rebuild();

    logout();
    navigate('/login');
  };
}
