
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SessionTimeoutWarning from "./components/auth/SessionTimeoutWarning";

const queryClient = new QueryClient();

// Composant de protection des routes de base (pour l'authentification uniquement)
const BasicProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // Afficher un écran de chargement pendant la vérification de l'authentification
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers login
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={
        <BasicProtectedRoute>
          <AppLayout />
        </BasicProtectedRoute>
      }>
        {/* Dashboard - accessible à tous les utilisateurs authentifiés */}
        <Route path="/" element={
          <ProtectedRoute requiredPage="dashboard">
            <Dashboard />
          </ProtectedRoute>
        } />
      
      {/* Commandes - accessible aux agents de vente, staff, manager, admin */}
      <Route path="/orders" element={
        <ProtectedRoute requiredPage="orders">
          <Orders />
        </ProtectedRoute>
      } />
      
      {/* Inventaire - accessible aux agents de stock, staff, manager, admin */}
      <Route path="/inventory" element={
        <ProtectedRoute requiredPage="inventory">
          <Inventory />
        </ProtectedRoute>
      } />
      
      {/* Produits - accessible aux agents de stock, staff, manager, admin */}
      <Route path="/products" element={
        <ProtectedRoute requiredPage="products">
          <Products />
        </ProtectedRoute>
      } />
      
      {/* Clients - accessible aux agents de vente, staff, manager, admin */}
      <Route path="/customers" element={
        <ProtectedRoute requiredPage="customers">
          <Customers />
        </ProtectedRoute>
      } />
      
      {/* Rapports - accessible aux manager et admin uniquement */}
      <Route path="/reports" element={
        <ProtectedRoute requiredPage="reports">
          <Reports />
        </ProtectedRoute>
      } />
      
      {/* Paramètres - accessible aux admin uniquement */}
      <Route path="/settings" element={
        <ProtectedRoute requiredPage="settings">
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Administration - accessible aux admin uniquement */}
      <Route path="/admin" element={
        <ProtectedRoute requiredPage="admin">
          <Admin />
        </ProtectedRoute>
      } />
    </Route>
    
    <Route path="*" element={<NotFound />} />
  </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <Toaster />
              <Sonner />
              <SessionTimeoutWarning />
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
