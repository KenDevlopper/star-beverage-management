import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserPlus, 
  Edit, 
  UserX, 
  Shield, 
  Key, 
  LockKeyhole, 
  UserCircle,
  Search,
  Users,
  UserCheck,
  UserX as UserXIcon,
  Activity,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { useUserLogs } from "@/hooks/useUserLogs";
import RoleManagement from "@/components/admin/RoleManagement";
import SecuritySettings from "@/components/admin/SecuritySettings";
import SecurityInfo from "@/components/admin/SecurityInfo";
import UserProfile from "@/components/admin/UserProfile";
import UserStatusIndicator from "@/components/admin/UserStatusIndicator";
import { useActiveSessions } from "@/hooks/useActiveSessions";
import { useUserActivity } from "@/hooks/useUserActivity";
import { validateUser, sanitizeInput } from "@/utils/validation";
import { ROLE_PERMISSIONS } from "@/utils/permissions";
import { toast } from "sonner";

const Admin = () => {
  const { t } = useTranslation();
  const { users, loading: usersLoading, createUser, updateUser, deleteUser } = useUsers();
  
  const { roles, loading: rolesLoading } = useRoles();
  const { logsData, loading: logsLoading, fetchLogs, lastUpdate, newLogsCount, resetNewLogsCount } = useUserLogs();
  const { sessions, isUserOnline } = useActiveSessions();
  const { logUserAction } = useUserActivity();
  
  const [newUser, setNewUser] = useState({ 
    name: "", 
    email: "", 
    username: "",
    role: "staff", 
    password: "",
    confirmPassword: ""
  });
  const [searchUser, setSearchUser] = useState("");
  const [searchLog, setSearchLog] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Gestion des utilisateurs
  const handleAddUser = async () => {
    console.log('New User Data:', newUser);
    setValidationErrors({});
    
    // Nettoyer et formater les données
    const cleanedData = {
      ...newUser,
      name: sanitizeInput(newUser.name),
      email: sanitizeInput(newUser.email),
      username: sanitizeInput(newUser.username),
    };
    
    // Valider les données
    const validation = validateUser(cleanedData);
    if (!validation.isValid) {
      const errors: Record<string, string[]> = {};
      validation.errors.forEach(error => {
        // Le format est maintenant "fieldName:errorMessage"
        const [fieldName, errorMessage] = error.split(':');
        if (fieldName && errorMessage) {
          if (!errors[fieldName]) errors[fieldName] = [];
          errors[fieldName].push(errorMessage);
        }
      });
      setValidationErrors(errors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    // Validation supplémentaire pour la confirmation du mot de passe
    if (newUser.password !== newUser.confirmPassword) {
      setValidationErrors({
        confirmPassword: [t('validation.passwordMismatch')]
      });
      toast.error(t('validation.passwordMismatch'));
      return;
    }

    try {
      await createUser({
        name: cleanedData.name,
        email: cleanedData.email,
        username: cleanedData.username,
        role: newUser.role,
        password: newUser.password,
        confirmPassword: newUser.confirmPassword
      });

      setNewUser({ 
        name: "", 
        email: "", 
        username: "",
        role: "staff", 
        password: "",
        confirmPassword: ""
      });
      setIsAddUserDialogOpen(false);
      toast.success(t('admin.userCreated'));
      console.log('User added successfully, form reset');
      
      // Logger l'action
      await logUserAction('user_created', 'user', `Nouvel utilisateur créé: ${cleanedData.name} (${cleanedData.email})`);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(t('admin.messages.confirmDeleteUser'))) {
      try {
        const userToDelete = users.find(u => u.id.toString() === userId);
        await deleteUser(userId);
        
        // Logger l'action
        await logUserAction('user_deleted', 'user', `Utilisateur supprimé: ${userToDelete?.name || userId}`);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchUser.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Statistiques des utilisateurs
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    // Statistiques dynamiques par rôle
    ...ROLE_PERMISSIONS.reduce((acc, roleConfig) => {
      const count = users.filter(u => u.role && u.role.toLowerCase() === roleConfig.role).length;
      acc[roleConfig.role] = count;
      return acc;
    }, {} as Record<string, number>)
  };

  // Filtrage des logs
  const filteredLogs = logsData?.logs.filter(log => 
    log.userName.toLowerCase().includes(searchLog.toLowerCase()) || 
    log.action.toLowerCase().includes(searchLog.toLowerCase()) ||
    (log.target && log.target.toLowerCase().includes(searchLog.toLowerCase()))
  ) || [];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        <p className="text-muted-foreground">{t('admin.subtitle')}</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">{t('admin.usersTab')}</TabsTrigger>
          <TabsTrigger value="roles">{t('admin.rolesTab')}</TabsTrigger>
          <TabsTrigger value="logs">{t('admin.logsTab')}</TabsTrigger>
          <TabsTrigger value="security">{t('admin.securityTab')}</TabsTrigger>
          <TabsTrigger value="profile">{t('admin.profileTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('admin.userManagement')}</CardTitle>
                  <CardDescription>{t('admin.userDescription')}</CardDescription>
                </div>
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('admin.addUser')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('admin.addUser')}</DialogTitle>
                      <DialogDescription>
                        {t('admin.addUserDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">{t('admin.fullName')}</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            placeholder={t('admin.fullNamePlaceholder')}
                            className={validationErrors.name ? 'border-red-500' : ''}
                          />
                          {validationErrors.name && (
                            <div className="text-sm text-red-500">
                              {validationErrors.name.map((error, index) => (
                                <div key={index}>{error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="username">{t('admin.userName')}</Label>
                          <Input
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            placeholder={t('admin.userNamePlaceholder')}
                            className={validationErrors.username ? 'border-red-500' : ''}
                          />
                          {validationErrors.username && (
                            <div className="text-sm text-red-500">
                              {validationErrors.username.map((error, index) => (
                                <div key={index}>{error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">{t('admin.emailAddress')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder={t('admin.emailPlaceholder')}
                          className={validationErrors.email ? 'border-red-500' : ''}
                        />
                        {validationErrors.email && (
                          <div className="text-sm text-red-500">
                            {validationErrors.email.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="role">{t('admin.userRole')}</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_PERMISSIONS.map((roleConfig) => (
                              <SelectItem key={roleConfig.role} value={roleConfig.role}>
                                {roleConfig.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="password">{t('admin.password')}</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            placeholder={t('admin.passwordPlaceholder')}
                            className={validationErrors.password ? 'border-red-500' : ''}
                          />
                          {validationErrors.password && (
                            <div className="text-sm text-red-500">
                              {validationErrors.password.map((error, index) => (
                                <div key={index}>{error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">{t('admin.confirmPassword')}</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={newUser.confirmPassword}
                            onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                            placeholder={t('admin.confirmPasswordPlaceholder')}
                            className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                          />
                          {validationErrors.confirmPassword && (
                            <div className="text-sm text-red-500">
                              {validationErrors.confirmPassword.map((error, index) => (
                                <div key={index}>{error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleAddUser}>
                        {t('admin.addUser')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{t('admin.totalUsers')}</p>
                        <p className="text-2xl font-bold">{userStats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{t('admin.activeUsers')}</p>
                        <p className="text-2xl font-bold">{userStats.active}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <UserXIcon className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">{t('admin.inactiveUsers')}</p>
                        <p className="text-2xl font-bold">{userStats.inactive}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Cartes de statistiques dynamiques par rôle */}
                {ROLE_PERMISSIONS.map((roleConfig, index) => {
                  const colors = ['text-purple-600', 'text-orange-600', 'text-gray-600', 'text-blue-600', 'text-green-600'];
                  const icons = [Shield, UserCircle, Users, UserCheck, UserXIcon];
                  const IconComponent = icons[index % icons.length];
                  const color = colors[index % colors.length];
                  
                  return (
                    <Card key={roleConfig.role}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`h-4 w-4 ${color}`} />
                          <div>
                            <p className="text-sm font-medium">{roleConfig.displayName}</p>
                            <p className="text-2xl font-bold">{userStats[roleConfig.role] || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('admin.searchUsers')}
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder={t('admin.filterByRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {ROLE_PERMISSIONS.map((roleConfig) => (
                      <SelectItem key={roleConfig.role} value={roleConfig.role}>
                        {roleConfig.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder={t('admin.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Table des utilisateurs */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.fullName')}</TableHead>
                      <TableHead>{t('admin.emailAddress')}</TableHead>
                      <TableHead>{t('admin.userRole')}</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>{t('admin.accountStatus')}</TableHead>
                      <TableHead>{t('admin.lastLogin')}</TableHead>
                      <TableHead>{t('admin.userActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>{t('common.loading')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <UserXIcon className="h-8 w-8 text-gray-400" />
                            <span className="text-gray-500">Aucun utilisateur trouvé</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserCircle className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                        <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role.toLowerCase() === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                        <TableCell>
                            <UserStatusIndicator 
                              userId={user.id} 
                              lastLogin={user.lastLogin}
                              isOnline={isUserOnline(user.id)}
                            />
                        </TableCell>
                        <TableCell>
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                          <TableCell>
                            {user.lastLogin ? (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Jamais</span>
                            )}
                          </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                            </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteUser(user.id.toString())}
                              >
                                <UserX className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {t('admin.activityLogs')}
                    {newLogsCount > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {newLogsCount} nouveau{newLogsCount > 1 ? 'x' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {t('admin.logsDescription')}
                    <span className="text-xs text-muted-foreground">
                      Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {newLogsCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetNewLogsCount}
                    >
                      Marquer comme lu
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchLogs()}
                    disabled={logsLoading}
                  >
                    {logsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : (
                      'Actualiser'
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtres pour les logs */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                      placeholder={t('admin.logs.searchLogs')}
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                      className="pl-10"
                />
                  </div>
                </div>
              </div>
              
              {/* Statistiques des logs */}
              {logsData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{t('admin.logs.totalLogs')}</p>
                          <p className="text-2xl font-bold">{logsData.statistics.totalLogs}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">{t('admin.logs.recentActivity')}</p>
                          <p className="text-2xl font-bold">{filteredLogs.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium">{t('admin.logs.actionStats')}</p>
                          <p className="text-2xl font-bold">{logsData.statistics.actionStats.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Table des logs */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.logs.user')}</TableHead>
                      <TableHead>{t('admin.logs.action')}</TableHead>
                      <TableHead>{t('admin.logs.target')}</TableHead>
                      <TableHead>{t('admin.logs.details')}</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>{t('admin.logs.timestamp')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>{t('admin.logs.loadingLogs')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Activity className="h-8 w-8 text-gray-400" />
                            <span className="text-gray-500">{t('admin.logs.noLogs')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log, index) => {
                        // Marquer les 5 premiers logs comme potentiellement nouveaux
                        const isNewLog = index < 5 && newLogsCount > 0;
                        
                        return (
                          <TableRow key={log.id} className={isNewLog ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <UserCircle className="h-3 w-3 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {log.userName}
                                    {isNewLog && (
                                      <Badge variant="secondary" className="text-xs animate-pulse">
                                        Nouveau
                                      </Badge>
                                    )}
                                  </div>
                                  {log.userRole && (
                                    <div className="text-xs text-muted-foreground">{log.userRole}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.target || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{log.details || '-'}</TableCell>
                          <TableCell>
                            {log.sessionDuration ? (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-blue-400" />
                                <span className="text-sm text-blue-600">{log.sessionDuration}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <SecurityInfo />
            <SecuritySettings />
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <UserProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;