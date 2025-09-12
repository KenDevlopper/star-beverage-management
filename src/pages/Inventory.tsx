
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Filter, FileText, Loader2, Settings, Clock } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventory";
import { useTranslation } from "@/hooks/useTranslation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import InventoryAdjustModal from "@/components/inventory/InventoryAdjustModal";
import InventoryHistoryModal from "@/components/inventory/InventoryHistoryModal";
import { toast } from "sonner";
import ProductFormModal from "@/components/products/ProductFormModal";
import { useNavigate } from "react-router-dom";

const Inventory = () => {
  const { t } = useTranslation();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState<boolean>(false);
  
  const navigate = useNavigate();
  
  // Utiliser le hook useInventory pour récupérer l'inventaire depuis MySQL
  const { inventory, loading, error, isDemo, refreshInventory, adjustStock } = useInventory();
  
  const filteredInventory = filterCategory === "all" 
    ? inventory 
    : inventory.filter(item => item.category_name?.toLowerCase() === filterCategory);
    
  const searchedInventory = searchQuery
    ? filteredInventory.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredInventory;
  
  const handleAdjustStock = (item: any) => {
    setSelectedItem(item);
    setAdjustModalOpen(true);
  };
  
  const handleViewHistory = (item: any) => {
    setSelectedItem(item);
    setHistoryModalOpen(true);
  };
  
  const handleSaveAdjustment = async (itemId: string, newQuantity: number, reason: string) => {
    try {
      await adjustStock(itemId, newQuantity, reason);
      setAdjustModalOpen(false);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const handleAddProduct = () => {
    // Option 1: Ouvrir le modal directement
    setProductModalOpen(true);
    
    // Option 2: Naviguer vers la page produits (commenté)
    // navigate('/products', { state: { openAddProduct: true } });
  };

  const handleSaveProduct = (product: any) => {
    toast.success(`Produit ${product.name} ajouté avec succès`);
    refreshInventory();
    setProductModalOpen(false);
  };

  const handleExportData = () => {
    // Créer un CSV à partir des données d'inventaire
    const headers = ["ID", "Produit", "Catégorie", "Stock actuel", "Minimum requis", "Statut"];
    
    const csvData = searchedInventory.map(item => {
      const percentage = Math.round((item.inventory / item.minimum_quantity) * 100);
      let status = "Normal";
      
      if (percentage <= 50) {
        status = "Critique";
      } else if (percentage <= 100) {
        status = "Attention";
      }
      
      return [
        item.id,
        item.name,
        item.category_name,
        `${item.inventory} ${item.unit}`,
        `${item.minimum_quantity} ${item.unit}`,
        status
      ].join(",");
    });
    
    const csvContent = [
      headers.join(","),
      ...csvData
    ].join("\n");
    
    // Créer un fichier de téléchargement
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Configurer le lien de téléchargement
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `inventaire_${date}.csv`);
    link.style.visibility = "hidden";
    
    // Ajouter à la page, cliquer et supprimer
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(t('messages.success.exported'));
  };
    
  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          {t('products.newProduct')}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t('messages.error.network')}</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {isDemo && (
        <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200">
          <AlertTitle>{t('common.demo')}</AlertTitle>
          <AlertDescription>
            {t('common.demoDescription')}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.title')}</CardTitle>
          <CardDescription>
            {t('inventory.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select 
                defaultValue="all"
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('common.all') + ' ' + t('common.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')} {t('common.category')}</SelectItem>
                  <SelectItem value="eau">{t('products.categories.water')}</SelectItem>
                  <SelectItem value="soda">{t('products.categories.soda')}</SelectItem>
                  <SelectItem value="jus">{t('products.categories.juice')}</SelectItem>
                  <SelectItem value="autre">{t('products.categories.other')}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportData}>
                <FileText className="mr-2 h-4 w-4" />
                {t('common.export')}
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products.productName')}</TableHead>
                  <TableHead>{t('products.productCategory')}</TableHead>
                  <TableHead>{t('inventory.currentStock')}</TableHead>
                  <TableHead>{t('inventory.minimumStock')}</TableHead>
                  <TableHead>{t('inventory.level')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin mr-2" />
                        <span>{t('common.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : searchedInventory.length > 0 ? (
                  searchedInventory.map((item) => {
                    const percentage = Math.round((item.inventory / item.minimum_quantity) * 100);
                    let status = "normal";
                    
                    if (percentage <= 50) {
                      status = "critical";
                    } else if (percentage <= 100) {
                      status = "warning";
                    }

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="capitalize">{item.category_name}</TableCell>
                        <TableCell>{item.inventory} {item.unit}</TableCell>
                        <TableCell>{item.minimum_quantity} {item.unit}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={percentage > 100 ? 100 : percentage} 
                              className="h-2" 
                              indicatorClassName={
                                status === "critical" ? "bg-red-500" : 
                                status === "warning" ? "bg-amber-500" : 
                                "bg-green-500"
                              }
                            />
                            <Badge variant={
                              status === "critical" ? "destructive" : 
                              status === "warning" ? "default" : 
                              "default"
                            } className={
                              status === "warning" ? "bg-amber-500 hover:bg-amber-600" : 
                              status === "normal" ? "bg-green-500 hover:bg-green-600" : 
                              ""
                            }>
                              {status === "critical" ? "Critique" : 
                              status === "warning" ? "Attention" : 
                              "Normal"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAdjustStock(item)}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              {t('inventory.adjustStock')}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewHistory(item)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {t('inventory.stockHistory')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <p className="text-muted-foreground">{t('common.noData')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal pour ajuster le stock */}
      <InventoryAdjustModal
        open={adjustModalOpen}
        onOpenChange={setAdjustModalOpen}
        item={selectedItem}
        onSave={handleSaveAdjustment}
      />
      
      {/* Modal pour voir l'historique */}
      <InventoryHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        item={selectedItem}
      />
      
      {/* Modal pour ajouter un produit */}
      <ProductFormModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onSave={handleSaveProduct}
        isEditing={false}
      />
    </div>
  );
};

export default Inventory;
