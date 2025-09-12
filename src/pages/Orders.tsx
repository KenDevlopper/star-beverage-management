
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "@/components/dashboard/RecentOrdersList";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { CartItem } from "@/components/orders/ShoppingCartModal";
import { OrderFormData } from "@/components/orders/NewOrderModal";
import { exportOrdersToCSV } from "@/utils/orderExport";
import { useTranslation } from "@/hooks/useTranslation";

// Component imports
import ProductCatalog from "@/components/orders/ProductCatalog";
import OrdersList from "@/components/orders/OrdersList";
import NewOrderModal from "@/components/orders/NewOrderModal";
import ShoppingCartModal from "@/components/orders/ShoppingCartModal";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import BulkInvoicePrint from "@/components/orders/BulkInvoicePrint";

const Orders = () => {
  const { t } = useTranslation();
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [bulkInvoiceOpen, setBulkInvoiceOpen] = useState(false);
  
  // Utiliser nos hooks personnalisés
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { orders, loading: ordersLoading, error: ordersError, createOrder, updateOrder } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();

  const handleSaveOrder = async (order: OrderFormData) => {
    try {
      await createOrder(order);
      // La liste des commandes sera automatiquement rafraîchie par le hook
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const handleExportData = () => {
    exportOrdersToCSV(orders);
    toast.success(t('messages.success.exported'));
  };

  const handlePrintOrders = () => {
    if (orders.length === 0) {
      toast.error("Aucune commande à imprimer");
      return;
    }
    setBulkInvoiceOpen(true);
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Vérifier si le produit est déjà dans le panier
    const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Si le produit est déjà dans le panier, augmenter la quantité
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1
      };
      setCartItems(updatedItems);
      toast.success(`Quantité de ${product.name} augmentée`);
    } else {
      // Sinon, ajouter le produit au panier
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price
      };
      setCartItems([...cartItems, newItem]);
      toast.success(t('orders.messages.addedToCart', { product: product.name }));
    }
  };

  const handleCheckout = (items: CartItem[]) => {
    setNewOrderModalOpen(true);
    setCartModalOpen(false);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      // La liste des commandes sera automatiquement rafraîchie par le hook
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };
  
  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setNewOrderModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('orders.newOrder')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCartModalOpen(true)}
            className="relative"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t('common.cart')}
            {cartItems.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {cartItems.length}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      <ProductCatalog 
        products={products} 
        loading={productsLoading} 
        error={productsError}
        onAddToCart={addToCart}
      />
      
      <OrdersList 
        orders={orders}
        onViewDetails={handleViewDetails}
        onExportData={handleExportData}
        onPrintOrders={handlePrintOrders}
      />

      <NewOrderModal 
        open={newOrderModalOpen}
        onOpenChange={setNewOrderModalOpen}
        onSave={handleSaveOrder}
        initialItems={cartItems}
        availableProducts={products}
        availableCustomers={customers}
      />

      <ShoppingCartModal
        open={cartModalOpen}
        onOpenChange={setCartModalOpen}
        onCheckout={handleCheckout}
        cartItems={cartItems}
        setCartItems={setCartItems}
      />

      <OrderDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        order={selectedOrder}
        onOrderStatusChange={handleOrderStatusChange}
      />

      {bulkInvoiceOpen && (
        <BulkInvoicePrint
          orders={orders}
          onClose={() => setBulkInvoiceOpen(false)}
        />
      )}
    </div>
  );
};

export default Orders;
