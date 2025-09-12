import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface SessionTimeoutWarningProps {
  onExtendSession?: () => void;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({ onExtendSession }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [sessionTimeout, setSessionTimeout] = useState<number>(30); // 30 minutes par défaut

  useEffect(() => {
    // Récupérer la configuration du timeout de session
    const fetchSessionTimeout = async () => {
      try {
        const response = await fetch('http://localhost/star-beverage-flow-main-v.0/public/api/check_session_timeout.php');
        const data = await response.json();
        if (data.success && data.data.timeoutMinutes) {
          setSessionTimeout(data.data.timeoutMinutes);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du timeout de session:', error);
      }
    };

    fetchSessionTimeout();

    // Vérifier le temps restant toutes les minutes
    const checkTimeLeft = () => {
      if (user?.id) {
        // Simuler le calcul du temps restant (en réalité, cela devrait venir du serveur)
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
          const login = new Date(loginTime);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - login.getTime()) / (1000 * 60)); // en minutes
          const remaining = sessionTimeout - elapsed;
          
          setTimeLeft(Math.max(0, remaining));
          
          // Afficher l'avertissement 5 minutes avant l'expiration
          if (remaining <= 5 && remaining > 0) {
            setShowWarning(true);
          } else if (remaining <= 0) {
            // Session expirée, rediriger vers la page de connexion
            window.location.href = '/login';
          }
        }
      }
    };

    checkTimeLeft();
    const interval = setInterval(checkTimeLeft, 60000); // Vérifier toutes les minutes

    return () => clearInterval(interval);
  }, [user, sessionTimeout]);

  const handleExtendSession = async () => {
    try {
      // Simuler l'extension de session (en réalité, cela devrait mettre à jour last_activity)
      localStorage.setItem('loginTime', new Date().toISOString());
      setShowWarning(false);
      onExtendSession?.();
    } catch (error) {
      console.error('Erreur lors de l\'extension de session:', error);
    }
  };

  if (!showWarning || timeLeft <= 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-80 border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Session sur le point d'expirer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Clock className="h-4 w-4" />
            <span>Votre session expirera dans {timeLeft} minute{timeLeft > 1 ? 's' : ''}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleExtendSession}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Étendre la session
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowWarning(false)}
            >
              Ignorer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionTimeoutWarning;
