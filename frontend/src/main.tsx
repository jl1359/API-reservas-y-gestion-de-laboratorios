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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'dummy-id'}>

      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)