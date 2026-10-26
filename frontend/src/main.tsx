import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_ID = rawClientId ? rawClientId.replace(/['"]/g, '').trim() : '';

console.log("Google Client ID cargado:", GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 15)}...` : "NO CARGADO (usando dummy-id)");

if (!GOOGLE_CLIENT_ID) {
  console.error("ERROR CRITICO: Vite no está cargando la variable VITE_GOOGLE_CLIENT_ID del archivo .env");
}

if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'dummy-id'}>

      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)