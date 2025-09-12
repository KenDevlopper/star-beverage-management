
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "@/components/dashboard/RecentOrdersList";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, RefreshCw, RotateCw } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useOrders } from "@/hooks/useOrders";
import InvoicePrint from "./InvoicePrint";

// Données de démonstration pour les détails de la commande
const DEMO_ORDER_ITEMS = [
  { id: 1, product: "Eau minérale naturelle", quantity: 50, unitPrice: 150, total: 7500 },
  { id: 2, product: "Jus d'orange tropical", quantity: 12, unitPrice: 275, total: 3300 },
  { id: 3, product: "Soda cola classique", quantity: 8, unitPrice: 200, total: 1600 },
];

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onOrderStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
}

const OrderDetailsModal = ({ 
  open, 
  onOpenChange, 
  order: initialOrder,
  onOrderStatusChange 
}: OrderDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const { getOrderById } = useOrders();
  
  // Mettre à jour l'état local lorsque la prop order change
  useEffect(() => {
    setOrder(initialOrder);
    if (initialOrder && open) {
      loadOrderDetails(initialOrder.id);
    }
  }, [initialOrder, open]);

  const loadOrderDetails = async (orderId: string) => {
    try {
      const orderDetails = await getOrderById(orderId);
      if (orderDetails && orderDetails.items) {
        setOrderItems(orderDetails.items);
      } else {
        // Utiliser les données de démonstration si pas d'items
        setOrderItems(DEMO_ORDER_ITEMS);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      // Utiliser les données de démonstration en cas d'erreur
      setOrderItems(DEMO_ORDER_ITEMS);
    }
  };
  
  if (!order) return null;
  
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return { label: "En attente", variant: "warning" as const, color: "bg-amber-500" };
      case "processing":
        return { label: "En préparation", variant: "default" as const, color: "bg-blue-500" };
      case "completed":
        return { label: "Livrée", variant: "success" as const, color: "bg-green-500" };
      case "cancelled":
        return { label: "Annulée", variant: "destructive" as const, color: "" };
    }
  };
  
  const statusConfig = getStatusConfig(order.status);
  
  const handlePrintInvoice = () => {
    setShowInvoice(true);
    onOpenChange(false); // Fermer la fenêtre détails
  };
  
  const handleDownloadInvoice = () => {
    setShowInvoice(true);
    onOpenChange(false); // Fermer la fenêtre détails
  };
  
  const handleStatusChange = async (newStatus: OrderStatus) => {
    // Éviter de changer vers le même statut
    if (newStatus === order.status) return;
    
    setIsUpdatingStatus(true);
    
    try {
      // Notification du parent si le callback est fourni
      if (onOrderStatusChange) {
        await onOrderStatusChange(order.id, newStatus);
      }
      
      // Mise à jour locale
      const updatedOrder = {
        ...order,
        status: newStatus
      };
      
      setOrder(updatedOrder);
      
      // Notification utilisateur
      toast.success(`Statut mis à jour: ${getStatusConfig(newStatus).label}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // Déterminer les statuts disponibles suivants selon le statut actuel
  const getNextAvailableStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case "pending":
        return ["processing", "cancelled"];
      case "processing":
        return ["completed", "cancelled"];
      case "completed":
        return ["pending", "processing", "cancelled"]; // Dans certains cas, on peut vouloir revenir en arrière
      case "cancelled":
        return ["pending", "processing"]; // Parfois une commande annulée peut être réactivée
      default:
        return ["pending", "processing", "completed", "cancelled"];
    }
  };
  
  const nextStatuses = getNextAvailableStatuses(order.status);
  
  // Calculer le total
  const subtotal = orderItems.reduce((sum, item) => {
    const itemTotal = item.total_price || item.total || 0;
    const numTotal = typeof itemTotal === 'string' ? parseFloat(itemTotal) : itemTotal;
    return sum + (isNaN(numTotal) ? 0 : numTotal);
  }, 0);
  const taxRate = 0.10; // 10% de taxe
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Détails de la commande #{order.id}</DialogTitle>
          <DialogDescription>
            Informations et articles de la commande
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm">Client</h3>
              <p>{order.client}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm">Date</h3>
              <p>{order.date}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm">Montant</h3>
              <p>{order.amount}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm">Statut</h3>
              <div className="flex items-center space-x-2">
                <Badge variant={statusConfig.variant} className={statusConfig.color ? statusConfig.color : ""}>
                  {statusConfig.label}
                </Badge>
                
                {/* Menu déroulant pour changer le statut */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isUpdatingStatus}>
                    <Button variant="outline" size="sm" className="h-8">
                      {isUpdatingStatus ? (
                        <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Changer statut
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {nextStatuses.map((status) => (
                      <DropdownMenuItem 
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Badge variant={getStatusConfig(status).variant} className="mr-2">
                            {getStatusConfig(status).label}
                          </Badge>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Articles de la commande</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item, index) => {
                    const unitPrice = item.unit_price || item.unitPrice || 0;
                    const totalPrice = item.total_price || item.total || 0;
                    const numUnitPrice = typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice;
                    const numTotalPrice = typeof totalPrice === 'string' ? parseFloat(totalPrice) : totalPrice;
                    
                    return (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.product_name || item.product}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{isNaN(numUnitPrice) ? '0' : numUnitPrice.toFixed(2)} HTG</TableCell>
                        <TableCell className="text-right">{isNaN(numTotalPrice) ? '0' : numTotalPrice.toFixed(2)} HTG</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{subtotal.toFixed(2)} HTG</span>
            </div>
            <div className="flex justify-between">
              <span>Taxe (10%)</span>
              <span>{taxAmount.toFixed(2)} HTG</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{total.toFixed(2)} HTG</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-end gap-2">
          <Button variant="outline" onClick={handleDownloadInvoice}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
          <Button onClick={handlePrintInvoice} disabled={isLoading}>
            {isLoading ? (
              <span>Chargement...</span>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Facture
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Composant de facture pour impression */}
    {showInvoice && order && (
      <InvoicePrint 
        order={order} 
        onClose={() => setShowInvoice(false)} 
      />
    )}
  </>
  );
};

export default OrderDetailsModal;
