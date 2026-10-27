import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Toaster } from '@innostes/ui';
import { AuthGate, configureApi, SetupGate } from '@innostes/kernel';

import App from './app/app';

// Where the backend engine (apps/api-server) runs. Set VITE_API_URL in apps/web-app/.env.
configureApi({ baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8001' });

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    {/* First visit on a fresh install shows the setup wizard; afterwards authentication is enforced */}
    <SetupGate>
      <AuthGate>
        <App />
      </AuthGate>
    </SetupGate>
    <Toaster />
  </StrictMode>,
);
