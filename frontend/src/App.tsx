import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { Layout } from './components/layout/Layout';
import { CatalogoPage } from './features/catalogo/CatalogoPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { LaboratorioDetallePage } from './features/laboratorio/LaboratorioDetallePage';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/catalogo" replace />} />
            <Route path="catalogo" element={<CatalogoPage />} />
            <Route path="laboratorios/:id" element={<LaboratorioDetallePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/catalogo" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
