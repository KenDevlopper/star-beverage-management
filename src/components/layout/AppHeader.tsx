
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Languages, LogOut, Settings, User, Sun, Moon, Monitor, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const AppHeader = () => {
  const { language, setLanguage } = useLanguage();
  const { t, getCurrentLanguageName } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    name: "Administrateur",
    email: "admin@starbeverage.com",
    role: "Administrateur",
    avatar: ""
  });

  // Charger le profil utilisateur depuis localStorage ou contexte d'authentification
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserProfile(profile);
    } else if (user) {
      // Utiliser les données du contexte d'authentification si disponibles
      setUserProfile({
        name: user.name || "Administrateur",
        email: user.email || "admin@starbeverage.com",
        role: user.role || "Administrateur",
        avatar: user.avatar || ""
      });
    }
  }, [user]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as Language);
    
    // Show a toast notification
    const languageNames = {
      fr: 'Français',
      cr: 'Créole',
      en: 'English'
    };
    
    toast.success(`${t('messages.success.language')} ${languageNames[newLanguage as Language]}`);
  };

  const handleProfileClick = () => {
    navigate('/admin?tab=profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = () => {
    // Utiliser la fonction logout du contexte d'authentification
    // qui gère automatiquement le nettoyage et la redirection
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-border/50 flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold hidden md:block text-primary">
          {t('app.title')}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Select 
          value={language} 
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="w-[140px]">
            <Languages className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">{t('languages.fr')}</SelectItem>
            <SelectItem value="cr">{t('languages.cr')}</SelectItem>
            <SelectItem value="en">{t('languages.en')}</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Bouton de changement de thème */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              {theme === 'light' ? <Sun className="h-4 w-4" /> : 
               theme === 'dark' ? <Moon className="h-4 w-4" /> : 
               <Monitor className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Clair</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Sombre</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Système</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <NotificationBell />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(userProfile.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{userProfile.role}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Mon profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
