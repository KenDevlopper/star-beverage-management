import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPage?: string;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPage,
  fallbackPath = '/'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { checkPermission, checkPageAccess, roleInfo } = usePermissions();
  const location = useLocation();

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier l'accès à la page si spécifié
  if (requiredPage && !checkPageAccess(requiredPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rôle actuel :</strong> {roleInfo?.displayName || 'Non défini'}<br />
                <strong>Description :</strong> {roleInfo?.description || 'Aucune description'}
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="mr-2"
              >
                Retour
              </Button>
              <Button onClick={() => window.location.href = fallbackPath}>
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier la permission spécifique si demandée
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl text-yellow-600">Permission Insuffisante</CardTitle>
            <CardDescription>
              Cette action nécessite des permissions supplémentaires.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Permission requise :</strong> {requiredPermission}<br />
                <strong>Rôle actuel :</strong> {roleInfo?.displayName || 'Non défini'}
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="mr-2"
              >
                Retour
              </Button>
              <Button onClick={() => window.location.href = fallbackPath}>
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si toutes les vérifications passent, afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute;
