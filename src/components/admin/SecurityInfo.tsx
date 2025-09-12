import { useSecurity } from '@/hooks/useSecurity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, LockKeyhole, Clock, UserCheck } from 'lucide-react';

const SecurityInfo = () => {
  const { policies, loading } = useSecurity();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Chargement des politiques de sécurité...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPolicyValue = (policyName: string) => {
    const policy = policies.find(p => p.name === policyName);
    return policy?.enabled ? policy.value : null;
  };

  const minLength = getPolicyValue('passwordMinLength');
  const requireUppercase = getPolicyValue('passwordRequireUppercase');
  const requireNumbers = getPolicyValue('passwordRequireNumbers');
  const requireSpecialChars = getPolicyValue('passwordRequireSpecialChars');
  const expiryDays = getPolicyValue('passwordExpiryDays');
  const lockoutAttempts = getPolicyValue('accountLockoutAttempts');
  const sessionTimeout = getPolicyValue('sessionTimeoutMinutes');
  const twoFactorAuth = getPolicyValue('twoFactorAuth');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Politiques de Sécurité Actives
          </CardTitle>
          <CardDescription>
            Configuration actuelle des paramètres de sécurité du système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Politiques de mot de passe */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              Politique de Mot de Passe
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {minLength && (
                <div className="flex justify-between">
                  <span>Longueur minimale :</span>
                  <Badge variant="outline">{minLength} caractères</Badge>
                </div>
              )}
              {requireUppercase && (
                <div className="flex justify-between">
                  <span>Majuscules requises :</span>
                  <Badge variant="outline">Oui</Badge>
                </div>
              )}
              {requireNumbers && (
                <div className="flex justify-between">
                  <span>Chiffres requis :</span>
                  <Badge variant="outline">Oui</Badge>
                </div>
              )}
              {requireSpecialChars && (
                <div className="flex justify-between">
                  <span>Caractères spéciaux :</span>
                  <Badge variant="outline">Oui</Badge>
                </div>
              )}
              {expiryDays && (
                <div className="flex justify-between">
                  <span>Expiration :</span>
                  <Badge variant="outline">{expiryDays} jours</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Politiques d'accès */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Contrôle d'Accès
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {lockoutAttempts && (
                <div className="flex justify-between">
                  <span>Verrouillage après :</span>
                  <Badge variant="outline">{lockoutAttempts} échecs</Badge>
                </div>
              )}
              {sessionTimeout && (
                <div className="flex justify-between">
                  <span>Timeout de session :</span>
                  <Badge variant="outline">{sessionTimeout} minutes</Badge>
                </div>
              )}
              {twoFactorAuth && (
                <div className="flex justify-between">
                  <span>Authentification 2FA :</span>
                  <Badge variant="outline">Activée</Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityInfo;



