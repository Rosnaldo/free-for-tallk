import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { bootstrapAuth } from './bootstrap-auth.ts';
import { StoreProvider } from './states/StoreProvider.tsx';
import { createStores } from './states/stores.ts';
import { DevicesProvider } from './providers/devices.tsx';
import { DailyRoot } from './providers/DailyRoot.tsx';
import { DailyService } from './services/daily.ts';
import { initWs } from './services/ws/init-ws.ts';
import properties from './properties.ts';
import App from './App.tsx';
import './index.css';


const stores = createStores();
DailyService.getInstance({ domain: properties.dailyDomain, apiKey: properties.dailyApiKey });

initWs.startTabCoordination();
bootstrapAuth(stores);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <DailyRoot>
            <StoreProvider stores={stores}>
                <DevicesProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </DevicesProvider>
            </StoreProvider>
        </DailyRoot>
    </StrictMode>,
);
