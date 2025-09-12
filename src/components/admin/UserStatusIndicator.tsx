import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface UserStatusIndicatorProps {
  userId: string;
  lastLogin?: string;
  isOnline?: boolean;
}

const UserStatusIndicator = ({ userId, lastLogin, isOnline }: UserStatusIndicatorProps) => {
  const { t } = useTranslation();
  const [isBlinking, setIsBlinking] = useState(false);

  // Animation du point clignotant
  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000); // Clignote toutes les secondes

      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Calculer le temps depuis la dernière connexion
  const getTimeSinceLogin = (loginTime: string) => {
    if (!loginTime) return null;
    
    const now = new Date();
    const login = new Date(loginTime);
    const diffMs = now.getTime() - login.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}min`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} min`;
    } else {
      return 'Maintenant';
    }
  };

  if (isOnline) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full bg-green-500 ${
            isBlinking ? 'opacity-100' : 'opacity-60'
          } transition-opacity duration-500`}
        />
        <Badge variant="outline" className="text-green-600 border-green-600">
          {t('admin.status.online')}
        </Badge>
      </div>
    );
  }

  if (lastLogin) {
    const timeSince = getTimeSinceLogin(lastLogin);
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-400" />
        <Badge variant="outline" className="text-gray-600">
          {t('admin.status.offline')} - {timeSince}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-gray-400" />
      <Badge variant="outline" className="text-gray-600">
        {t('admin.status.never')}
      </Badge>
    </div>
  );
};

export default UserStatusIndicator;



