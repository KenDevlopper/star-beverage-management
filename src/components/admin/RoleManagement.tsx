import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRoles, Role, Permission } from "@/hooks/useRoles";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Shield, Trash2, Plus, Search, Users } from "lucide-react";

const RoleManagement = () => {
  const { t } = useTranslation();
  const { roles, permissions, loading, createRole, updateRole, deleteRole } = useRoles();
  
  const [searchRole, setSearchRole] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: "",
    description: "",
    permissions: {}
  });

  // Filtrage des rôles
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchRole.toLowerCase()) || 
    role.description.toLowerCase().includes(searchRole.toLowerCase())
  );

  // Gestion des permissions
  const handlePermissionChange = (module: string, permission: string, checked: boolean, isNewRole: boolean = false) => {
    if (isNewRole) {
      setNewRole(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: {
            ...prev.permissions?.[module],
            [permission]: checked
          }
        }
      }));
    } else if (editingRole) {
      setEditingRole(prev => prev ? {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: {
            ...prev.permissions?.[module],
            [permission]: checked
          }
        }
      } : null);
    }
  };

  const isPermissionChecked = (module: string, permission: string, role: Role | Partial<Role>) => {
    return role.permissions?.[module]?.[permission] === true;
  };

  // Gestion des rôles
  const handleAddRole = async () => {
    if (!newRole.name) {
      return;
    }

    try {
      await createRole({
        name: newRole.name,
        description: newRole.description || "",
        permissions: newRole.permissions || {}
      });

      setNewRole({
        name: "",
        description: "",
        permissions: {}
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole || !editingRole.name) {
      return;
    }

    try {
      await updateRole(editingRole.id, {
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions
      });

      setEditingRole(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
    }
  };

  const handleDeleteRole = async () => {
    if (!editingRole) return;

    try {
      await deleteRole(editingRole.id);
      setEditingRole(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
    }
  };

  const openEditDialog = (role: Role) => {
    if (role.isSystem) {
      console.warn('Impossible de modifier un rôle système:', role.name);
      return;
    }
    setEditingRole({ ...role });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setEditingRole(role);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('admin.roleManagement')}</CardTitle>
            <CardDescription>{t('admin.roleDescription')}</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addRole')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{t('admin.addRole')}</DialogTitle>
                <DialogDescription>
                  Créez un nouveau rôle avec des permissions spécifiques
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roleName">{t('admin.roleName')}</Label>
                    <Input
                      id="roleName"
                      value={newRole.name || ""}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                      placeholder="Nom du rôle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleDescription">{t('admin.roleDescription')}</Label>
                    <Input
                      id="roleDescription"
                      value={newRole.description || ""}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                      placeholder="Description du rôle"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>{t('admin.rolePermissions')}</Label>
                  <ScrollArea className="h-64 border rounded-md p-4">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(permissions).map(([module, modulePermissions]) => (
                        <AccordionItem key={module} value={module}>
                          <AccordionTrigger className="text-sm font-medium">
                            {t(`admin.permissions.${module}.title`)}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(modulePermissions).map(([permission, description]) => (
                                <div key={permission} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`new-${module}-${permission}`}
                                    checked={isPermissionChecked(module, permission, newRole)}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(module, permission, checked as boolean, true)
                                    }
                                  />
                                  <Label 
                                    htmlFor={`new-${module}-${permission}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {description}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddRole}>
                  {t('admin.addRole')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('admin.searchRoles')}
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table des rôles */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.roleName')}</TableHead>
                <TableHead>{t('admin.roleDescription')}</TableHead>
                <TableHead>{t('admin.userCount')}</TableHead>
                <TableHead>{t('admin.isSystemRole')}</TableHead>
                <TableHead>{t('admin.userActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>{t('common.loading')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Shield className="h-8 w-8 text-gray-400" />
                      <span className="text-gray-500">Aucun rôle trouvé</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span>{role.userCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isSystem ? "default" : "secondary"}>
                        {role.isSystem ? "Système" : "Personnalisé"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(role)}
                          disabled={role.isSystem}
                          title={role.isSystem ? "Impossible de modifier un rôle système" : "Modifier le rôle"}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {!role.isSystem && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDeleteDialog(role)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog d'édition */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{t('admin.editRole')}</DialogTitle>
              <DialogDescription>
                Modifiez les permissions du rôle {editingRole?.name}
              </DialogDescription>
            </DialogHeader>
            {editingRole && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editRoleName">{t('admin.roleName')}</Label>
                    <Input
                      id="editRoleName"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                      placeholder="Nom du rôle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRoleDescription">{t('admin.roleDescription')}</Label>
                    <Input
                      id="editRoleDescription"
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                      placeholder="Description du rôle"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>{t('admin.rolePermissions')}</Label>
                  <ScrollArea className="h-64 border rounded-md p-4">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(permissions).map(([module, modulePermissions]) => (
                        <AccordionItem key={module} value={module}>
                          <AccordionTrigger className="text-sm font-medium">
                            {t(`admin.permissions.${module}.title`)}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(modulePermissions).map(([permission, description]) => (
                                <div key={permission} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${module}-${permission}`}
                                    checked={isPermissionChecked(module, permission, editingRole)}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(module, permission, checked as boolean, false)
                                    }
                                  />
                                  <Label 
                                    htmlFor={`edit-${module}-${permission}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {description}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleEditRole}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de suppression */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.deleteRole')}</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer le rôle "{editingRole?.name}" ? 
                Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteRole}>
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RoleManagement;