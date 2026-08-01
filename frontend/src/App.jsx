import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ConfigProvider } from './context/ConfigContext.jsx';

import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import Fournisseurs from './pages/Fournisseurs.jsx';
import Produits from './pages/Produits.jsx';
import Ventes from './pages/Ventes.jsx';
import VenteDetail from './pages/VenteDetail.jsx';
import Achats from './pages/Achats.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <ToastProvider>
            <Routes>
              <Route path="/connexion" element={<Login />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="fournisseurs" element={<Fournisseurs />} />
                <Route path="produits" element={<Produits />} />
                <Route path="ventes" element={<Ventes />} />
                <Route path="ventes/:id" element={<VenteDetail />} />
                <Route path="achats" element={<Achats />} />
              </Route>

              {/* Toute URL inconnue retombe sur le tableau de bord. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
