import { DailyProvider } from '@daily-co/daily-react';
import { useDailyCoLifecycle } from '../hooks/useDailyCoLifecycle.ts';

function DailyFatalErrorListener() {
  return null;
}

export function DailyRoot({ children }: { children: React.ReactNode }) {
  const callObject = useDailyCoLifecycle();

  return (
    <DailyProvider callObject={callObject}>
      <DailyFatalErrorListener />
      {children}
    </DailyProvider>
  );
}
