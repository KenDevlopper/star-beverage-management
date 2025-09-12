
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { productService } from "@/services/apiService";
import { validateProduct, sanitizeInput, formatPrice } from "@/utils/validation";
import { useTranslation } from "@/hooks/useTranslation";

export interface ProductFormData {
  id: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  status: string;
  description?: string;
}

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: ProductFormData) => void;
  product?: ProductFormData;
  isEditing?: boolean;
}

const generateProductId = () => {
  return `PRD-${String(Math.floor(Math.random() * 900) + 100)}`;
};

const ProductFormModal = ({
  open,
  onOpenChange,
  onSave,
  product,
  isEditing = false,
}: ProductFormModalProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  const form = useForm<ProductFormData>({
    defaultValues: {
      id: product?.id || generateProductId(),
      name: product?.name || "",
      category: product?.category || "",
      price: product?.price ? Number(product.price) : 0,
      inventory: product?.inventory ? Number(product.inventory) : 0,
      status: product?.status || "En stock",
      description: product?.description || "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price ? Number(product.price) : 0,
        inventory: product.inventory ? Number(product.inventory) : 0,
        status: product.status,
        description: product.description || "",
      });
    } else {
      form.reset({
        id: generateProductId(),
        name: "",
        category: "",
        price: 0,
        inventory: 0,
        status: "En stock",
        description: "",
      });
    }
  }, [product, form, open]);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setValidationErrors({});
    
    try {
      // Nettoyer et formater les données
      const cleanedData = {
        ...data,
        name: sanitizeInput(data.name),
        price: Number(data.price),
        inventory: Number(data.inventory),
        description: data.description ? sanitizeInput(data.description) : "",
      };
      
      // Valider les données
      const validation = validateProduct(cleanedData);
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
      
      // Utiliser le service API pour ajouter ou mettre à jour le produit
      if (isEditing) {
        await productService.updateProduct(data.id, cleanedData);
        toast.success(t('products.productUpdated', { name: cleanedData.name }));
      } else {
        await productService.addProduct(cleanedData);
        toast.success(t('products.productAdded', { name: cleanedData.name }));
      }
      
      // Appeler la fonction onSave du parent
      onSave(cleanedData);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`${t('common.error')}: ${error.message || t('common.unexpectedError')}`);
      console.error("Erreur lors de l'enregistrement du produit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('products.editProduct') : t('products.addProduct')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('products.editProductDescription')
              : t('products.addProductDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.productId')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.productName')}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder={t('products.productNamePlaceholder')}
                      className={validationErrors.name ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  {validationErrors.name && (
                    <div className="text-sm text-red-500">
                      {validationErrors.name.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.category')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('products.selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Eau">{t('products.categories.water')}</SelectItem>
                      <SelectItem value="Jus">{t('products.categories.juice')}</SelectItem>
                      <SelectItem value="Soda">{t('products.categories.soda')}</SelectItem>
                      <SelectItem value="Thé">{t('products.categories.tea')}</SelectItem>
                      <SelectItem value="Café">{t('products.categories.coffee')}</SelectItem>
                      <SelectItem value="Autre">{t('products.categories.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.price')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="999999.99"
                        {...field}
                        placeholder={t('products.pricePlaceholder')}
                        className={validationErrors.price ? 'border-red-500' : ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    {validationErrors.price && (
                      <div className="text-sm text-red-500">
                        {validationErrors.price.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inventory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.inventory')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="999999"
                        {...field}
                        placeholder={t('products.inventoryPlaceholder')}
                        className={validationErrors.inventory ? 'border-red-500' : ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    {validationErrors.inventory && (
                      <div className="text-sm text-red-500">
                        {validationErrors.inventory.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.description')}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder={t('products.descriptionPlaceholder')}
                      className={validationErrors.description ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  {validationErrors.description && (
                    <div className="text-sm text-red-500">
                      {validationErrors.description.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.status')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('products.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="En stock">{t('products.statuses.inStock')}</SelectItem>
                      <SelectItem value="Stock limité">{t('products.statuses.lowStock')}</SelectItem>
                      <SelectItem value="Rupture de stock">{t('products.statuses.outOfStock')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.loading') : (isEditing ? t('common.update') : t('common.add'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
