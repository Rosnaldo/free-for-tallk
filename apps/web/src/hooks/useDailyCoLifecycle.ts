import { useEffect, useState } from 'react';
import { DailyService } from '../services/daily.ts';

export function useDailyCoLifecycle() {
  const [callObject, setCallObject] = useState(() => DailyService.getInstance().callObject);

  useEffect(() => {
    const dailyService = DailyService.getInstance();
    dailyService.onCallObjectChanged(setCallObject);

    // pagehide is the reliable signal for a tab close: unlike beforeunload it
    // also fires on mobile Safari and doesn't opt the page out of bfcache.
    const handlePageHide = () => {
      dailyService.destroy();
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      dailyService.rebuild();
    };
  }, []);

  return callObject;
}
