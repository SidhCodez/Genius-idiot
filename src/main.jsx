import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import AppErrorBoundary from './components/AppErrorBoundary';
import 'driver.js/dist/driver.css';
import './index.css';

// A recovery email should land on /reset-password, but if the project's
// Redirect URLs do not allow that path Supabase falls back to the Site URL.
// Send the recovery link to the form before the router sees the page.
if (
  window.location.hash.includes('type=recovery') &&
  window.location.pathname !== '/reset-password'
) {
  window.location.replace(`/reset-password${window.location.search}${window.location.hash}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
