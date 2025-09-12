
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, Search, Plus, Edit, Trash, Loader2 } from "lucide-react";
import ProductFormModal, { ProductFormData } from "@/components/products/ProductFormModal";
import DeleteProductDialog from "@/components/products/DeleteProductDialog";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useProducts } from "@/hooks/useProducts";
import { useTranslation } from "@/hooks/useTranslation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Products = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductFormData | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  
  // Utiliser le hook useProducts pour récupérer les produits depuis MySQL
  const { products: productsData, loading, error, refreshProducts } = useProducts();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;
  
  // Filtrer les produits en fonction des filtres
  const filteredProducts = productsData.filter(
    (product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category_id?.toString() || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "" || 
        (product.category_name || "") === categoryFilter;
      
      const matchesStatus = statusFilter === "" || product.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    }
  );
  
  // Paginate the products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Formatage des catégories - utiliser directement category_name de l'API
  const getCategoryName = (product: any) => {
    return product.category_name || "Autre";
  };

  const handleAddProduct = () => {
    setCurrentProduct(undefined);
    setIsEditing(false);
    setProductFormOpen(true);
  };

  const handleEditProduct = (product: any) => {
    const formattedProduct: ProductFormData = {
      id: product.id,
      name: product.name,
      category: getCategoryName(product),
      price: product.price,
      inventory: product.inventory,
      status: product.status
    };
    setCurrentProduct(formattedProduct);
    setIsEditing(true);
    setProductFormOpen(true);
  };

  const handleDeleteClick = (product: any) => {
    const formattedProduct: ProductFormData = {
      id: product.id,
      name: product.name,
      category: getCategoryName(product),
      price: product.price,
      inventory: product.inventory,
      status: product.status
    };
    setCurrentProduct(formattedProduct);
    setDeleteDialogOpen(true);
  };

  const handleSaveProduct = (product: ProductFormData) => {
    if (isEditing) {
      toast.success(t('products.messages.productUpdated', { product: product.name }));
    } else {
      toast.success(t('products.messages.productCreated', { product: product.name }));
    }
    // Refresh products after saving
    refreshProducts();
  };

  const handleDeleteProduct = () => {
    if (currentProduct) {
      toast.success(t('products.messages.productDeleted', { product: currentProduct.name }));
      setDeleteDialogOpen(false);
      // Refresh products after deleting
      refreshProducts();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t('products.title')}</h1>
          <p className="text-muted-foreground">
            {t('products.subtitle')}
          </p>
        </div>

        <Button className="mt-4 md:mt-0" onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" /> {t('products.newProduct')}
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

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('products.overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
                <span className="sr-only">{t('common.search')}</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">{t('common.all')} {t('common.category')}</option>
                <option value="Eau">{t('products.categories.water')}</option>
                <option value="Jus">{t('products.categories.juice')}</option>
                <option value="Soda">{t('products.categories.soda')}</option>
                <option value="Thé">{t('products.categories.tea')}</option>
                <option value="Café">{t('products.categories.coffee')}</option>
                <option value="Autre">{t('products.categories.other')}</option>
              </select>
              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{t('common.all')} {t('common.status')}</option>
                <option value="En stock">{t('inventory.status.inStock')}</option>
                <option value="Stock limité">{t('inventory.status.lowStock')}</option>
                <option value="Rupture de stock">{t('inventory.status.outOfStock')}</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products.productId')}</TableHead>
                  <TableHead>{t('products.productName')}</TableHead>
                  <TableHead>{t('products.productCategory')}</TableHead>
                  <TableHead className="text-right">{t('products.productPrice')}</TableHead>
                  <TableHead className="text-right">{t('products.productStock')}</TableHead>
                  <TableHead>{t('products.productStatus')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin mr-2" />
                        <span>{t('common.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{getCategoryName(product)}</TableCell>
                      <TableCell className="text-right">{product.price.toFixed(2)} HTG</TableCell>
                      <TableCell className="text-right">{product.inventory}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "En stock" 
                            ? "bg-green-100 text-green-800" 
                            : product.status === "Stock limité" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {product.status === "En stock" ? t('inventory.status.inStock') :
                           product.status === "Stock limité" ? t('inventory.status.lowStock') :
                           t('inventory.status.outOfStock')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t('common.edit')}</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">{t('common.delete')}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Boxes className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t('common.noData')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length > 0 && (
            <Pagination className="my-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 3) }).map((_, idx) => {
                  const pageNumber = idx + 1;
                  return (
                    <PaginationItem key={idx}>
                      <PaginationLink 
                        isActive={currentPage === pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        isActive={currentPage === totalPages}
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Modal pour ajouter/modifier un produit */}
      <ProductFormModal
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        onSave={handleSaveProduct}
        product={currentProduct}
        isEditing={isEditing}
      />

      {/* Dialog de confirmation de suppression */}
      {currentProduct && (
        <DeleteProductDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteProduct}
          productName={currentProduct.name}
        />
      )}
    </div>
  );
};

export default Products;
