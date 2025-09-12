import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSecurity } from "@/hooks/useSecurity";
import { SecurityPolicy, ApiKey } from "@/types/admin";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Key, 
  LockKeyhole, 
  AlertTriangle,
  UserCheck,
  LogIn,
  Fingerprint,
  EyeOff,
  Copy,
  PlusCircle,
  Trash2
} from "lucide-react";


const SecuritySettings = () => {
  const { t } = useTranslation();
  const { 
    policies: securityPolicies, 
    apiKeys, 
    loading, 
    error, 
    updatePolicies, 
    createApiKey, 
    deleteApiKey 
  } = useSecurity();
  
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [newApiKey, setNewApiKey] = useState<Partial<ApiKey>>({
    name: "",
    permissions: []
  });
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const togglePolicyEnabled = (policyId: string) => {
    const updatedPolicies = securityPolicies.map(policy => 
        policy.id === policyId 
          ? { ...policy, enabled: !policy.enabled } 
          : policy
    );
    updatePolicies(updatedPolicies);
  };
  
  const updatePolicyValue = (policyId: string, value: string | number | boolean) => {
    const updatedPolicies = securityPolicies.map(policy => 
        policy.id === policyId 
          ? { ...policy, value } 
          : policy
    );
    updatePolicies(updatedPolicies);
  };
  
  const handleSaveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      await updatePolicies(securityPolicies);
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleShowApiKey = (keyId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('admin.security.copiedToClipboard'));
  };
  
  const handleAddApiKey = async () => {
    if (!newApiKey.name) {
      toast.error(t('admin.security.apiKeyNameRequired'));
      return;
    }
    
    const newKey = await createApiKey(newApiKey.name, newApiKey.permissions || []);
    if (newKey) {
    setNewApiKey({ name: "", permissions: [] });
    setIsAddKeyDialogOpen(false);
    
    setShowApiKeys(prev => ({
      ...prev,
        [newKey.id]: true
      }));
    }
  };
  
  const handleDeleteApiKey = async (keyId: string) => {
    await deleteApiKey(keyId);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Chargement des paramètres de sécurité...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="password">
      <TabsList className="mb-4">
        <TabsTrigger value="password">
          <LockKeyhole className="mr-2 h-4 w-4" />
          {t('admin.security.passwordPolicy')}
        </TabsTrigger>
        <TabsTrigger value="access">
          <UserCheck className="mr-2 h-4 w-4" />
          {t('admin.security.accessControl')}
        </TabsTrigger>
        <TabsTrigger value="api">
          <Key className="mr-2 h-4 w-4" />
          {t('admin.security.apiKeys')}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t('admin.security.passwordPolicy')}</CardTitle>
                <CardDescription>{t('admin.security.passwordPolicyDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('admin.security.passwordMinLength')}</h4>
                    <p className="text-sm text-muted-foreground">{t('admin.security.passwordMinLengthDescription')}</p>
                  </div>
                  <Switch
                    checked={securityPolicies.find(p => p.name === "passwordMinLength")?.enabled}
                    onCheckedChange={() => togglePolicyEnabled("1")}
                  />
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">6</span>
                    <span className="text-sm">24</span>
                  </div>
                  <Slider
                    defaultValue={[securityPolicies.find(p => p.name === "passwordMinLength")?.value as number]}
                    min={6}
                    max={24}
                    step={1}
                    onValueChange={(value) => updatePolicyValue("1", value[0])}
                    disabled={!securityPolicies.find(p => p.name === "passwordMinLength")?.enabled}
                  />
                  <div className="mt-1 text-center">
                    <Badge variant="outline">
                      {securityPolicies.find(p => p.name === "passwordMinLength")?.value} {t('admin.security.characters')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">{t('admin.security.passwordComplexity')}</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p>{t('admin.security.requireUppercase')}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.security.requireUppercaseDescription')}</p>
                  </div>
                  <Switch
                    checked={securityPolicies.find(p => p.name === "passwordRequireUppercase")?.enabled}
                    onCheckedChange={() => togglePolicyEnabled("2")}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p>{t('admin.security.requireNumbers')}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.security.requireNumbersDescription')}</p>
                  </div>
                  <Switch
                    checked={securityPolicies.find(p => p.name === "passwordRequireNumbers")?.enabled}
                    onCheckedChange={() => togglePolicyEnabled("3")}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p>{t('admin.security.requireSpecialChars')}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.security.requireSpecialCharsDescription')}</p>
                  </div>
                  <Switch
                    checked={securityPolicies.find(p => p.name === "passwordRequireSpecialChars")?.enabled}
                    onCheckedChange={() => togglePolicyEnabled("4")}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('admin.security.passwordExpiry')}</h4>
                    <p className="text-sm text-muted-foreground">{t('admin.security.passwordExpiryDescription')}</p>
                  </div>
                  <Switch
                    checked={securityPolicies.find(p => p.name === "passwordExpiryDays")?.enabled}
                    onCheckedChange={() => togglePolicyEnabled("5")}
                  />
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">30 {t('admin.security.days')}</span>
                    <span className="text-sm">180 {t('admin.security.days')}</span>
                  </div>
                  <Slider
                    defaultValue={[securityPolicies.find(p => p.name === "passwordExpiryDays")?.value as number]}
                    min={30}
                    max={180}
                    step={30}
                    onValueChange={(value) => updatePolicyValue("5", value[0])}
                    disabled={!securityPolicies.find(p => p.name === "passwordExpiryDays")?.enabled}
                  />
                  <div className="mt-1 text-center">
                    <Badge variant="outline">
                      {securityPolicies.find(p => p.name === "passwordExpiryDays")?.value} {t('admin.security.days')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <Button onClick={handleSaveSecuritySettings} disabled={isSaving}>
                  {isSaving ? 'Sauvegarde...' : t('admin.security.saveSecuritySettings')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="access">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t('admin.security.accessControl')}</CardTitle>
                <CardDescription>{t('admin.security.accessControlDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t('admin.security.loginSettings')}
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p>{t('admin.security.accountLockout')}</p>
                      <p className="text-sm text-muted-foreground">{t('admin.security.accountLockoutDescription')}</p>
                    </div>
                    <Switch
                      checked={securityPolicies.find(p => p.name === "accountLockoutAttempts")?.enabled}
                      onCheckedChange={() => togglePolicyEnabled("6")}
                    />
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">3</span>
                      <span className="text-sm">10</span>
                    </div>
                    <Slider
                      defaultValue={[securityPolicies.find(p => p.name === "accountLockoutAttempts")?.value as number]}
                      min={3}
                      max={10}
                      step={1}
                      onValueChange={(value) => updatePolicyValue("6", value[0])}
                      disabled={!securityPolicies.find(p => p.name === "accountLockoutAttempts")?.enabled}
                    />
                    <div className="mt-1 text-center">
                      <Badge variant="outline">
                        {t('admin.security.afterFailedAttempts')}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p>{t('admin.security.sessionTimeout')}</p>
                      <p className="text-sm text-muted-foreground">{t('admin.security.sessionTimeoutDescription')}</p>
                    </div>
                    <Switch
                      checked={securityPolicies.find(p => p.name === "sessionTimeoutMinutes")?.enabled}
                      onCheckedChange={() => togglePolicyEnabled("7")}
                    />
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">15 {t('admin.security.minutes')}</span>
                      <span className="text-sm">120 {t('admin.security.minutes')}</span>
                    </div>
                    <Slider
                      defaultValue={[securityPolicies.find(p => p.name === "sessionTimeoutMinutes")?.value as number]}
                      min={15}
                      max={120}
                      step={15}
                      onValueChange={(value) => updatePolicyValue("7", value[0])}
                      disabled={!securityPolicies.find(p => p.name === "sessionTimeoutMinutes")?.enabled}
                    />
                    <div className="mt-1 text-center">
                      <Badge variant="outline">
                        {securityPolicies.find(p => p.name === "sessionTimeoutMinutes")?.value} {t('admin.security.minutes')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {t('admin.security.advancedSecurity')}
                </h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4" />
                      {t('admin.security.twoFactorAuth')}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('admin.security.twoFactorAuthDescription')}</p>
                  </div>
                  <Switch
                    checked={securityPolicies.find(p => p.name === "twoFactorAuth")?.enabled}
                    onCheckedChange={() => togglePolicyEnabled("8")}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      {t('admin.security.ipRestriction')}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('admin.security.ipRestrictionDescription')}</p>
                  </div>
                  <Switch
                    checked={securityPolicies.find(p => p.name === "ipRestriction")?.enabled}
                    onCheckedChange={() => togglePolicyEnabled("9")}
                  />
                </div>
              </div>
              
              <div className="pt-6">
                <Button onClick={handleSaveSecuritySettings} disabled={isSaving}>
                  {isSaving ? 'Sauvegarde...' : t('admin.security.saveSecuritySettings')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="api">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>{t('admin.security.apiKeys')}</CardTitle>
                  <CardDescription>{t('admin.security.apiKeysDescription')}</CardDescription>
                </div>
              </div>
              <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('admin.security.addApiKey')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('admin.security.addApiKey')}</DialogTitle>
                    <DialogDescription>
                      {t('admin.security.addApiKeyDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="keyName" className="text-right">
                        {t('admin.security.keyName')}
                      </Label>
                      <Input
                        id="keyName"
                        value={newApiKey.name || ""}
                        onChange={(e) => setNewApiKey({...newApiKey, name: e.target.value})}
                        className="col-span-3"
                        placeholder={t('admin.security.keyNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.security.keyPermissions')}</Label>
                      <div className="bg-muted/50 p-3 rounded-md text-sm">
                        <p className="text-muted-foreground">
                          {t('admin.security.keyPermissionsNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddKeyDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleAddApiKey}>
                      {t('admin.security.generateKey')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-md flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">{t('admin.security.apiKeySecurity')}</h4>
                  <p className="text-sm text-muted-foreground">{t('admin.security.apiKeySecurityWarning')}</p>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.security.keyName')}</TableHead>
                      <TableHead>{t('admin.security.apiKey')}</TableHead>
                      <TableHead>{t('admin.security.created')}</TableHead>
                      <TableHead>{t('admin.security.expires')}</TableHead>
                      <TableHead>{t('admin.security.lastUsed')}</TableHead>
                      <TableHead>{t('admin.security.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">{apiKey.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs">
                              {showApiKeys[apiKey.id] 
                                ? apiKey.key 
                                : '••••••••••••••••••••••••'}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleShowApiKey(apiKey.id)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => copyToClipboard(apiKey.key)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{apiKey.createdAt}</TableCell>
                        <TableCell>{apiKey.expiresAt}</TableCell>
                        <TableCell>{apiKey.lastUsed}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SecuritySettings;