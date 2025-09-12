
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { CartItem } from "@/components/orders/ShoppingCartModal";
import { useLanguage } from "@/context/LanguageContext";

interface ProductCatalogProps {
  products: Product[];
  loading: boolean;
  error?: any;
  onAddToCart: (productId: string) => void;
}

const ProductCatalog = ({ products, loading, error, onAddToCart }: ProductCatalogProps) => {
  const { t } = useLanguage();
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('product.catalog')}</CardTitle>
        <CardDescription>
          {t('product.catalog.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t('loading.products')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.id}</p>
                      <p className="mt-2 font-bold">{product.price} HTG</p>
                      <p className={`text-sm ${product.inventory > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.inventory > 0 ? `${product.inventory} ${t('in.stock')}` : t('out.of.stock')}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => onAddToCart(product.id)}
                      disabled={product.inventory <= 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {t('add')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCatalog;
