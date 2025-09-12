
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/hooks/useSettings";
import { useUsers } from "@/hooks/useUsers";
import { useTheme } from "@/context/ThemeContext";
import TranslationTest from "@/components/TranslationTest";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Pencil, 
  Trash2, 
  UserPlus, 
  Mail, 
  Key, 
  Shield, 
  Calendar, 
  CheckCircle2,
  XCircle,
  Moon,
  Sun, 
  PanelLeft,
  Monitor,
  Eye,
  Palette,
  Search,
  Users,
  UserCheck,
  UserX
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const Settings = () => {
  const { t } = useLanguage();
  const { translate } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  // Hooks pour les paramètres dynamiques
  const {
    companySettings,
    systemSettings,
    appearanceSettings,
    loading: settingsLoading,
    saveCompanySettings,
    saveSystemSettings,
    saveAppearanceSettings,
    setCompanySettings,
    setSystemSettings,
    setAppearanceSettings
  } = useSettings();

  const {
    users,
    loading: usersLoading,
    createUser,
    updateUser,
    deleteUser
  } = useUsers();

  // États locaux pour les modales
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    username: "",
    role: "Staff",
    password: "",
    confirmPassword: ""
  });

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fonction pour filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSystemSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSystemSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleAppearanceChange = (key: string, value: any) => {
    setAppearanceSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveCompanyInfo = async () => {
    await saveCompanySettings(companySettings);
  };

  const saveSystemSettingsData = async () => {
    await saveSystemSettings(systemSettings);
  };

  const saveAppearanceSettingsData = async () => {
    await saveAppearanceSettings(appearanceSettings);
  };

  const addUser = async () => {
    if (newUser.password !== newUser.confirmPassword) {
      toast.error(t('settings.passwordsDoNotMatch'));
      return;
    }

    const success = await createUser(newUser);
    if (success) {
    setNewUser({
      name: "",
      email: "",
        username: "",
      role: "Staff",
      password: "",
      confirmPassword: ""
    });
    setIsAddUserOpen(false);
    }
  };

  const deleteUserHandler = async (userId: string) => {
    await deleteUser(userId);
  };

  const editUser = (user: any) => {
    setCurrentUser(user);
    setIsEditUserOpen(true);
  };

  const saveUserEdit = async () => {
    if (currentUser) {
      const success = await updateUser(currentUser);
      if (success) {
    setIsEditUserOpen(false);
        setCurrentUser(null);
      }
    }
  };

  const updateUserField = (field: string, value: any) => {
    setCurrentUser({...currentUser, [field]: value});
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="mb-4">
          <TabsTrigger value="company">{t('settings.companyTab')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.systemTab')}</TabsTrigger>
          <TabsTrigger value="appearance">{t('settings.appearanceTab')}</TabsTrigger>
          <TabsTrigger value="users">{t('settings.usersTab')}</TabsTrigger>
          <TabsTrigger value="translations">🌍 {t('settings.translationsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.companyInfo')}</CardTitle>
              <CardDescription>{t('settings.companyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.companyName')}</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={companySettings.name} 
                    onChange={handleCompanyInfoChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">{t('settings.logo')}</Label>
                  <Input 
                    id="logo" 
                    name="logo" 
                    value={companySettings.logo} 
                    onChange={handleCompanyInfoChange}
                    placeholder="URL or upload" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.contactEmail')}</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    value={companySettings.email} 
                    onChange={handleCompanyInfoChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.contactPhone')}</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={companySettings.phone} 
                    onChange={handleCompanyInfoChange} 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('settings.address')}</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    value={companySettings.address} 
                    onChange={handleCompanyInfoChange} 
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">{t('settings.primaryColor')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="primaryColor" 
                      name="primaryColor" 
                      value={companySettings.primaryColor} 
                      onChange={handleCompanyInfoChange} 
                    />
                    <input 
                      type="color" 
                      value={companySettings.primaryColor}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">{t('settings.secondaryColor')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="secondaryColor" 
                      name="secondaryColor" 
                      value={companySettings.secondaryColor} 
                      onChange={handleCompanyInfoChange} 
                    />
                    <input 
                      type="color" 
                      value={companySettings.secondaryColor}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveCompanyInfo}>{t('settings.saveChanges')}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.systemSettings')}</CardTitle>
              <CardDescription>{t('settings.systemDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('settings.currency')}</Label>
                  <Input 
                    id="currency" 
                    name="currency" 
                    value={systemSettings.currency} 
                    onChange={handleSystemSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">{t('settings.dateFormat')}</Label>
                  <Input 
                    id="dateFormat" 
                    name="dateFormat" 
                    value={systemSettings.dateFormat} 
                    onChange={handleSystemSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">{t('settings.timeFormat')}</Label>
                  <Input 
                    id="timeFormat" 
                    name="timeFormat" 
                    value={systemSettings.timeFormat} 
                    onChange={handleSystemSettingsChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                  <Input 
                    id="timezone" 
                    name="timezone" 
                    value={systemSettings.timezone} 
                    onChange={handleSystemSettingsChange} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSystemSettingsData}>{t('settings.saveChanges')}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearanceSettings')}</CardTitle>
              <CardDescription>{t('settings.appearanceDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('settings.appearance.theme')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`border p-4 rounded-lg cursor-pointer flex flex-col items-center gap-2 ${theme === 'light' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                    onClick={() => {
                      setTheme('light');
                      handleAppearanceChange('theme', 'light');
                    }}
                  >
                    <div className="w-full h-24 rounded-md bg-white border"></div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>{t('settings.appearance.lightTheme')}</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`border p-4 rounded-lg cursor-pointer flex flex-col items-center gap-2 ${theme === 'dark' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                    onClick={() => {
                      setTheme('dark');
                      handleAppearanceChange('theme', 'dark');
                    }}
                  >
                    <div className="w-full h-24 rounded-md bg-slate-800 border border-slate-700"></div>
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>{t('settings.appearance.darkTheme')}</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`border p-4 rounded-lg cursor-pointer flex flex-col items-center gap-2 ${theme === 'system' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                    onClick={() => {
                      setTheme('system');
                      handleAppearanceChange('theme', 'system');
                    }}
                  >
                    <div className="w-full h-24 rounded-md bg-gradient-to-r from-white to-slate-800 border"></div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>{t('settings.appearance.systemTheme')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('settings.appearance.colorSettings')}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="accentColor">{t('settings.appearance.accentColor')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="accentColor" 
                      value={appearanceSettings.accentColor} 
                      onChange={(e) => handleAppearanceChange('accentColor', e.target.value)} 
                    />
                    <input 
                      type="color" 
                      value={appearanceSettings.accentColor}
                      onChange={(e) => handleAppearanceChange('accentColor', e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <PanelLeft className="h-5 w-5" />
                  {t('settings.appearance.layoutSettings')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.appearance.sidebarCollapsed')}</Label>
                      <p className="text-sm text-muted-foreground">{t('settings.appearance.sidebarCollapsedDesc')}</p>
                    </div>
                    <Switch 
                      checked={appearanceSettings.sidebarCollapsed}
                      onCheckedChange={(value) => handleAppearanceChange('sidebarCollapsed', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.appearance.denseMode')}</Label>
                      <p className="text-sm text-muted-foreground">{t('settings.appearance.denseModeDesc')}</p>
                    </div>
                    <Switch 
                      checked={appearanceSettings.denseMode}
                      onCheckedChange={(value) => handleAppearanceChange('denseMode', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.appearance.tableStripes')}</Label>
                      <p className="text-sm text-muted-foreground">{t('settings.appearance.tableStripesDesc')}</p>
                    </div>
                    <Switch 
                      checked={appearanceSettings.tableStripes}
                      onCheckedChange={(value) => handleAppearanceChange('tableStripes', value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontSize">{t('settings.appearance.fontSize')}</Label>
                    <Select
                      value={appearanceSettings.fontSize}
                      onValueChange={(value) => handleAppearanceChange('fontSize', value)}
                    >
                      <SelectTrigger id="fontSize">
                        <SelectValue placeholder={t('settings.appearance.selectFontSize')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">{t('settings.appearance.fontSizeSmall')}</SelectItem>
                        <SelectItem value="medium">{t('settings.appearance.fontSizeMedium')}</SelectItem>
                        <SelectItem value="large">{t('settings.appearance.fontSizeLarge')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="animationLevel">{t('settings.appearance.animations')}</Label>
                    <Select
                      value={appearanceSettings.animationLevel}
                      onValueChange={(value) => handleAppearanceChange('animationLevel', value)}
                    >
                      <SelectTrigger id="animationLevel">
                        <SelectValue placeholder={t('settings.appearance.selectAnimation')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('settings.appearance.animationNone')}</SelectItem>
                        <SelectItem value="minimal">{t('settings.appearance.animationMinimal')}</SelectItem>
                        <SelectItem value="medium">{t('settings.appearance.animationMedium')}</SelectItem>
                        <SelectItem value="full">{t('settings.appearance.animationFull')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveAppearanceSettingsData}>{t('settings.saveChanges')}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{t('settings.userManagement')}</CardTitle>
                <CardDescription>{t('settings.userDescription')}</CardDescription>
              </div>
              <Sheet open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <SheetTrigger asChild>
                  <Button className="space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>{t('settings.addUser')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader className="pb-5">
                    <SheetTitle>{t('settings.addUser')}</SheetTitle>
                    <SheetDescription>
                      {t('settings.addUserDescription')}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newName">{t('settings.name')}</Label>
                      <Input 
                        id="newName" 
                        value={newUser.name} 
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUsername">{t('settings.username')}</Label>
                      <Input 
                        id="newUsername" 
                        value={newUser.username} 
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">{t('settings.email')}</Label>
                      <Input 
                        id="newEmail" 
                        type="email" 
                        value={newUser.email} 
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newRole">{t('settings.role')}</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value) => setNewUser({...newUser, role: value})}
                      >
                        <SelectTrigger id="newRole">
                          <SelectValue placeholder={t('settings.selectRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">{t('settings.roles.admin')}</SelectItem>
                          <SelectItem value="Manager">{t('settings.roles.manager')}</SelectItem>
                          <SelectItem value="Staff">{t('settings.roles.staff')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{t('settings.password')}</Label>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        value={newUser.password} 
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={newUser.confirmPassword} 
                        onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})} 
                      />
                    </div>
                  </div>
                  <SheetFooter>
                    <Button type="submit" onClick={addUser}>{t('settings.addUser')}</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              {/* Edit User Sheet */}
              {currentUser && (
                <Sheet open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                  <SheetContent className="sm:max-w-md">
                    <SheetHeader className="pb-5">
                      <SheetTitle>{t('settings.editUser')}</SheetTitle>
                      <SheetDescription>
                        {t('settings.editUserDescription')}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="editName">{t('settings.name')}</Label>
                        <Input 
                          id="editName" 
                          value={currentUser.name} 
                          onChange={(e) => updateUserField('name', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEmail">{t('settings.email')}</Label>
                        <Input 
                          id="editEmail" 
                          type="email" 
                          value={currentUser.email} 
                          onChange={(e) => updateUserField('email', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editRole">{t('settings.role')}</Label>
                        <Select 
                          value={currentUser.role} 
                          onValueChange={(value) => updateUserField('role', value)}
                        >
                          <SelectTrigger id="editRole">
                            <SelectValue placeholder={t('settings.selectRole')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">{t('settings.roles.admin')}</SelectItem>
                            <SelectItem value="Manager">{t('settings.roles.manager')}</SelectItem>
                            <SelectItem value="Staff">{t('settings.roles.staff')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editStatus">{t('settings.status')}</Label>
                        <Select 
                          value={currentUser.status} 
                          onValueChange={(value) => updateUserField('status', value)}
                        >
                          <SelectTrigger id="editStatus">
                            <SelectValue placeholder={t('settings.selectStatus')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{t('settings.statuses.active')}</SelectItem>
                            <SelectItem value="inactive">{t('settings.statuses.inactive')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SheetFooter>
                      <Button type="submit" onClick={saveUserEdit}>{t('settings.saveChanges')}</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              )}
            </CardHeader>
            <CardContent>
              {/* Barres de recherche et de filtrage */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Barre de recherche */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('settings.searchUsers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Filtres */}
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder={t('settings.filterByRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('settings.allRoles')}</SelectItem>
                        <SelectItem value="Admin">{t('settings.roles.admin')}</SelectItem>
                        <SelectItem value="Manager">{t('settings.roles.manager')}</SelectItem>
                        <SelectItem value="Staff">{t('settings.roles.staff')}</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder={t('settings.filterByStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('settings.allStatuses')}</SelectItem>
                        <SelectItem value="active">{t('settings.statuses.active')}</SelectItem>
                        <SelectItem value="inactive">{t('settings.statuses.inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Statistiques rapides */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{t('settings.totalUsers')}: {users.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4" />
                    <span>{t('settings.activeUsers')}: {users.filter(u => u.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>{t('settings.adminUsers')}: {users.filter(u => u.role === 'Admin').length}</span>
                  </div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">{t('settings.name')}</TableHead>
                    <TableHead>{t('settings.email')}</TableHead>
                    <TableHead>{t('settings.role')}</TableHead>
                    <TableHead>{t('settings.status')}</TableHead>
                    <TableHead>{t('settings.lastLogin')}</TableHead>
                    <TableHead className="text-right">{t('settings.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <UserX className="h-8 w-8" />
                          <span>{t('settings.noUsers')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === 'Admin' ? 'destructive' : user.role === 'Manager' ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            <Shield className="h-3 w-3" />
                            {t(`settings.roles.${user.role.toLowerCase()}`)}
                          </Badge>
                        </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.status === 'active' ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                <Badge variant="outline" className="text-green-600 border-green-200">
                              {t('settings.statuses.active')}
                                </Badge>
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                                <Badge variant="outline" className="text-gray-600 border-gray-200">
                              {t('settings.statuses.inactive')}
                                </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                          {user.lastLogin === '-' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                            {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                          </div>
                        )}
                      </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => editUser(user)}
                          variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                              onClick={() => deleteUserHandler(user.id)}
                          variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations">
          <TranslationTest />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
