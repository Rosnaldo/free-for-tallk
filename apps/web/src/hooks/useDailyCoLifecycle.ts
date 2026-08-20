import { useEffect, useState } from 'react';
import { DailyService } from '../services/daily.ts';

export function useDailyCoLifecycle() {
  const [callObject, setCallObject] = useState(() => DailyService.getInstance().callObject);

  useEffect(() => {
    const dailyService = DailyService.getInstance();
    dailyService.onCallObjectChanged(setCallObject);

    const handleBeforeUnload = () => {
      dailyService.destroy();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      dailyService.rebuild();
    };
  }, []);

  return callObject;
}
