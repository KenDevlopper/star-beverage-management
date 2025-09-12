import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useSecurity } from "@/hooks/useSecurity";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from "@/utils/passwordValidation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { profileService } from "@/services/apiService";
import { 
  User, 
  Mail, 
  Key, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe,
  Shield,
  Image,
  Upload,
  Save,
  Edit,
  X,
  Loader2
} from "lucide-react";


const UserProfile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { policies } = useSecurity();
  
  const [profile, setProfile] = useState<any>(null);
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [passwordValidation, setPasswordValidation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le profil depuis l'API
  const loadProfile = async () => {
    if (!user?.id) {
      console.log('Aucun utilisateur connecté, impossible de charger le profil');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Chargement du profil pour l\'utilisateur:', user.id);
      const response = await profileService.getProfile(user.id);
      console.log('Réponse du profil:', response);
      
      if (response.success) {
        setProfile(response.data);
        console.log('Profil chargé avec succès:', response.data);
      } else {
        console.error('Erreur dans la réponse:', response);
        toast.error('Erreur lors du chargement du profil');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      toast.error('Erreur lors du chargement du profil: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect déclenché, user:', user);
    loadProfile();
  }, [user?.id]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword(prev => ({ ...prev, [name]: value }));
    
    // Valider le nouveau mot de passe en temps réel
    if (name === 'new' && value) {
      const validation = validatePassword(value, policies);
      setPasswordValidation(validation);
    } else if (name === 'new' && !value) {
      setPasswordValidation(null);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const response = await profileService.updateProfile(user.id, profile);
      if (response.success) {
        setProfile(response.data);
        toast.success('Profil mis à jour avec succès');
    setIsEditing(false);
      } else {
        toast.error('Erreur lors de la sauvegarde du profil');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (!user?.id) return;
    
    if (password.new !== password.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    // Valider le mot de passe selon les politiques de sécurité
    if (password.new) {
      const validation = validatePassword(password.new, policies);
      if (!validation.isValid) {
        toast.error('Le mot de passe ne respecte pas les politiques de sécurité');
        validation.errors.forEach(error => toast.error(error));
        return;
      }
    }
    
    setIsChangingPassword(true);
    try {
      const response = await profileService.changePassword(user.id, password.current, password.new);
      if (response.success) {
        toast.success('Mot de passe modifié avec succès');
        setPassword({
          current: "",
          new: "",
          confirm: ""
        });
        setPasswordValidation(null);
      } else {
        toast.error('Erreur lors de la modification du mot de passe');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du mot de passe:', error);
      toast.error('Erreur lors de la modification du mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.invalidImageType'));
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    // Create a local URL for the image
    const imageUrl = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, avatar: imageUrl }));
    toast.success(t('profile.avatarUpdated'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement du profil...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Impossible de charger le profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 cursor-pointer transition-opacity group-hover:opacity-80" onClick={handleAvatarClick}>
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-xl">{getInitials(profile.name)}</AvatarFallback>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                </Avatar>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.name || 'Nom non défini'}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Mail className="h-4 w-4" />
                  {profile.email || 'Email non défini'}
                </CardDescription>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Shield className="h-4 w-4" />
                  {profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Rôle non défini'}
                </div>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Modifier le profil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
                <Button 
                  onClick={saveProfile} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="mb-4">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informations personnelles
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sécurité et authentification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <div className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom complet
                      </Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={profile.name || ''} 
                        onChange={handleProfileChange} 
                        placeholder="Saisissez votre nom complet"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Adresse email
                      </Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        value={profile.email || ''} 
                        onChange={handleProfileChange} 
                        placeholder="exemple@starbeverage.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Numéro de téléphone
                      </Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={profile.phone || ''} 
                        onChange={handleProfileChange} 
                        placeholder="+509 1234-5678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar">{t('profile.avatar')}</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="avatar" 
                          name="avatar" 
                          value={profile.avatar || ''} 
                          onChange={handleProfileChange}
                          placeholder="URL de l'image de profil" 
                          disabled
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="shrink-0"
                          onClick={handleAvatarClick}
                          type="button"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t('profile.clickAvatarToChange')}</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">{t('profile.address')}</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        value={profile.address || ''} 
                        onChange={handleProfileChange} 
                        placeholder="Adresse complète"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">{t('profile.birthday')}</Label>
                      <Input 
                        id="birthday" 
                        name="birthday" 
                        type="date"
                        value={profile.birthday || ''} 
                        onChange={handleProfileChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">{t('profile.language')}</Label>
                      <Input 
                        id="language" 
                        name="language" 
                        value={profile.language || 'fr'} 
                        onChange={handleProfileChange} 
                        placeholder="Langue préférée"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">{t('profile.bio')}</Label>
                      <textarea 
                        id="bio" 
                        name="bio" 
                        rows={4}
                        value={profile.bio || ''} 
                        onChange={handleProfileChange}
                        placeholder="Décrivez votre rôle et vos responsabilités dans l'entreprise"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium leading-none">Nom complet</p>
                            <p className="text-sm text-muted-foreground">{profile.name || 'Non défini'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium leading-none">Adresse email</p>
                            <p className="text-sm text-muted-foreground">{profile.email || 'Non définie'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium leading-none">Numéro de téléphone</p>
                            <p className="text-sm text-muted-foreground">{profile.phone || 'Non défini'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium leading-none">Adresse</p>
                            <p className="text-sm text-muted-foreground">{profile.address || 'Non définie'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium leading-none">Date de naissance</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.birthday ? new Date(profile.birthday).toLocaleDateString() : 'Non définie'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium leading-none">Langue préférée</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.language === 'fr' ? 'Français' : 
                               profile.language === 'en' ? 'Anglais' : 
                               profile.language === 'cr' ? 'Créole' : 
                               profile.language || 'Non définie'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Description professionnelle</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.bio || 'Aucune description professionnelle disponible'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Date d'adhésion</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Membre depuis le {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Date non disponible'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Modification du mot de passe
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Mot de passe actuel
                      </Label>
                      <Input 
                        id="currentPassword" 
                        name="current" 
                        type="password" 
                        value={password.current} 
                        onChange={handlePasswordChange} 
                        placeholder="Saisissez votre mot de passe actuel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Nouveau mot de passe
                      </Label>
                      <Input 
                        id="newPassword" 
                        name="new" 
                        type="password" 
                        value={password.new} 
                        onChange={handlePasswordChange}
                        placeholder="Saisissez votre nouveau mot de passe"
                        className={passwordValidation && !passwordValidation.isValid ? 'border-red-500' : ''}
                      />
                      {passwordValidation && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Force du mot de passe :</span>
                            <span className={`text-sm font-medium ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                              {getPasswordStrengthText(passwordValidation.strength)}
                            </span>
                          </div>
                          {passwordValidation.errors.length > 0 && (
                            <div className="text-sm text-red-600">
                              {passwordValidation.errors.map((error, index) => (
                                <div key={index}>• {error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Confirmer le nouveau mot de passe
                      </Label>
                      <Input 
                        id="confirmPassword" 
                        name="confirm" 
                        type="password" 
                        value={password.confirm} 
                        onChange={handlePasswordChange} 
                        placeholder="Confirmez votre nouveau mot de passe"
                      />
                    </div>
                    <Button 
                      onClick={changePassword} 
                      disabled={isChangingPassword}
                      className="flex items-center gap-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Modification en cours...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          Modifier le mot de passe
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Informations de sécurité</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Votre compte est protégé par un système d'authentification sécurisé. 
                        Pour des raisons de sécurité, certaines informations sensibles ne sont pas affichées ici.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Dernière connexion : {profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Non disponible'}</span>
                      </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
