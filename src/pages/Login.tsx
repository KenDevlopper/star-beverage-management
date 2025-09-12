
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, KeyRound, AlertCircle, Eye, EyeOff, Shield, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Si l'utilisateur est déjà authentifié, rediriger vers la page d'accueil
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError(t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Carte de connexion */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="space-y-1 pb-6">
            {/* Logo et titre principal */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <img 
                  src="/image/Logo_Star copie.png" 
                  alt="Logo Star Beverage" 
                  className="h-24 w-24 object-contain" 
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                SYSGESTAB
              </h1>
              <p className="text-sm text-gray-600">
                Système de Gestion de Star Beverage
              </p>
            </div>
            
            <CardTitle className="text-2xl text-center font-bold text-gray-900">
              Connexion
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Accédez à votre espace de travail sécurisé
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="Nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="username"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connexion en cours...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Se connecter
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="pt-6">
            <div className="w-full text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                <Building2 className="h-4 w-4" />
                <span>Accès sécurisé au système</span>
              </div>
              <p className="text-xs text-gray-400">
                Utilisez vos identifiants fournis par l'administrateur
              </p>
              <p className="text-xss text-gray-400">
                © 2025 Star Beverage. Tous droits réservés.
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
          
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
