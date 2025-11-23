import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {BrowserRouter} from 'react-router-dom'
import AppContext from '../src/components/Context';
import { getToken } from './components/auth';

// Inject Authorization header for all same-origin API calls
const originalFetch = window.fetch;
window.fetch = (input, init = {}) => {
  try {
    const isRelative = typeof input === 'string' && input.startsWith('/');
    if (isRelative) {
      const token = getToken();
      if (token) {
        const headers = new Headers(init.headers || {});
        if (!headers.has('Authorization')) headers.set('Authorization', token);
        return originalFetch(input, { ...init, headers });
      }
    }
  } catch {}
  return originalFetch(input, init);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AppContext>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  </AppContext>
);

