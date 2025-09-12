import React, { useState, useEffect } from "react";
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
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { CartItem } from "./ShoppingCartModal";
import { Product } from "@/types/product";
import { Customer } from "@/hooks/useCustomers";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderFormData {
  id: string;
  client: string;
  date: string;
  items: OrderItem[];
  status: "pending" | "processing" | "completed" | "cancelled";
}

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (order: OrderFormData) => void;
  initialItems?: CartItem[];
  availableProducts?: Product[];
  availableCustomers?: Customer[];
}

const generateOrderId = () => {
  return `ORD-${String(Math.floor(Math.random() * 9000) + 1000)}`;
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Liste de clients par défaut (fallback)
const DEFAULT_CLIENTS = [
  "Hôtel Sérénade",
  "Restaurant Cascade",
  "Café Bleu",
  "Superette Express",
  "Marché Central",
  "Restaurant Delmas",
  "Hôtel Paradis",
  "Bar Tropical",
  "Centre Commercial Star",
  "Café Créole",
];

const NewOrderModal = ({
  open,
  onOpenChange,
  onSave,
  initialItems = [],
  availableProducts = [],
  availableCustomers = [],
}: NewOrderModalProps) => {
  const { t } = useTranslation();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);

  const form = useForm<Omit<OrderFormData, "items">>({
    defaultValues: {
      id: generateOrderId(),
      client: "",
      date: formatDate(new Date()),
      status: "pending",
    },
  });

  // Charger les éléments du panier lorsque le modal s'ouvre
  useEffect(() => {
    if (open && initialItems && initialItems.length > 0) {
      setOrderItems([...initialItems]);
      updateTotal([...initialItems]);
    }
  }, [open, initialItems]);

  const updateTotal = (items: OrderItem[]) => {
    const newTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setTotal(newTotal);
  };

  const handleAddItem = () => {
    const newItem: OrderItem = {
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
    updateTotal(updatedItems);
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...orderItems];
      updatedItems[index] = {
        ...updatedItems[index],
        productId,
        productName: product.name,
        unitPrice: product.price,
      };
      setOrderItems(updatedItems);
      updateTotal(updatedItems);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
    };
    setOrderItems(updatedItems);
    updateTotal(updatedItems);
  };

  const resetForm = () => {
    form.reset({
      id: generateOrderId(),
      client: "",
      date: formatDate(new Date()),
      status: "pending",
    });
    setOrderItems([]);
    setTotal(0);
  };

  const handleCloseModal = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = (formData: Omit<OrderFormData, "items">) => {
    if (orderItems.length === 0) {
      toast.error("Veuillez ajouter au moins un produit à la commande");
      return;
    }

    if (orderItems.some(item => item.productId === "")) {
      toast.error("Veuillez sélectionner tous les produits");
      return;
    }

    // VALIDATION DE STOCK côté frontend
    const stockErrors: string[] = [];
    orderItems.forEach(item => {
      const product = availableProducts.find(p => p.id === item.productId);
      if (product) {
        if (product.inventory <= 0) {
          stockErrors.push(`Le produit '${product.name}' n'est plus en stock`);
        } else if (product.inventory < item.quantity) {
          stockErrors.push(`Le produit '${product.name}' n'a pas de stock suffisant (disponible: ${product.inventory}, demandé: ${item.quantity})`);
        }
      }
    });

    // Si des erreurs de stock sont détectées, les afficher et arrêter
    if (stockErrors.length > 0) {
      stockErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    const completeOrder: OrderFormData = {
      ...formData,
      items: orderItems,
    };

    onSave(completeOrder);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('orders.newOrder')}</DialogTitle>
          <DialogDescription>
            {t('orders.createOrderDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de commande</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(availableCustomers.length > 0 ? availableCustomers.map(c => c.name) : DEFAULT_CLIENTS).map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Produits</h3>
                <Button 
                  type="button" 
                  onClick={handleAddItem} 
                  variant="outline" 
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Ajouter un produit
                </Button>
              </div>

              {orderItems.length > 0 ? (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Select
                          value={item.productId}
                          onValueChange={(value) => handleProductChange(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Produit" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.price} HTG) - Stock: {product.inventory}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <div className="flex flex-col">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 0)}
                            placeholder="Qté"
                          />
                          {item.productId && (
                            <span className="text-xs text-muted-foreground mt-1">
                              Stock: {availableProducts.find(p => p.id === item.productId)?.inventory || 0}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={item.unitPrice > 0 ? `${(item.quantity * item.unitPrice)} HTG` : ""}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="text-right font-medium pt-2 border-t">
                    Total: {total} HTG
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border rounded-md text-muted-foreground">
                  Aucun produit ajouté
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="processing">En préparation</SelectItem>
                      <SelectItem value="completed">Livrée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit">Créer la commande</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderModal;
