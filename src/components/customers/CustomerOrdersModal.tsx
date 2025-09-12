
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
import { FileText, Printer, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportOrdersToCSV } from "@/utils/orderExport";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer } from "@/hooks/useCustomers";

// Interface Customer déjà importée du hook

// Données de démonstration pour les commandes du client
const generateCustomerOrders = (customerId: number, customerName: string): Order[] => {
  const statuses: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];
  const orders: Order[] = [];

  // Générer entre 3 et 8 commandes pour ce client
  const orderCount = Math.floor(Math.random() * 6) + 3;
  
  for (let i = 0; i < orderCount; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomAmount = Math.floor(Math.random() * 20000) + 5000;
    const formattedAmount = `${randomAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} HTG`;
    
    // Générer une date aléatoire dans les 3 derniers mois
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    
    orders.push({
      id: `ORD-${customerId}${i + 1}`,
      client: customerName,
      date: formattedDate,
      amount: formattedAmount,
      status: randomStatus
    });
  }
  
  // Trier par date (plus récent en premier)
  return orders.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });
};

interface CustomerOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

const CustomerOrdersModal = ({ open, onOpenChange, customer }: CustomerOrdersModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const { getCustomerOrders } = useCustomers();
  
  // Charger les vraies commandes du client
  useEffect(() => {
    if (customer && open) {
      loadCustomerOrders();
    }
  }, [customer, open]);

  const loadCustomerOrders = async () => {
    if (!customer) return;
    
    setOrdersLoading(true);
    try {
      const result = await getCustomerOrders(customer.id.toString());
      if (result.success) {
        setCustomerOrders(result.orders);
      } else {
        // Fallback vers les données de démonstration
        setCustomerOrders(generateCustomerOrders(customer.id, customer.name));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      // Fallback vers les données de démonstration
      setCustomerOrders(generateCustomerOrders(customer.id, customer.name));
    } finally {
      setOrdersLoading(false);
    }
  };
  
  if (!customer) return null;
  
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">En attente</Badge>;
      case "processing":
        return <Badge>En préparation</Badge>;
      case "completed":
        return <Badge variant="success">Livrée</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>;
    }
  };
  
  const handleExportData = () => {
    exportOrdersToCSV(customerOrders);
    toast.success("Commandes exportées avec succès");
  };

  const handlePrintOrders = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.print();
      setIsLoading(false);
    }, 500);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Commandes de {customer.name}</DialogTitle>
          <DialogDescription>
            Historique des commandes du client
          </DialogDescription>
        </DialogHeader>
        
        {selectedOrder ? (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={handleCloseOrderDetails} className="mb-2">
              ← Retour aux commandes
            </Button>
            
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-semibold mb-4">Détails de la commande #{selectedOrder.id}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedOrder.client}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="font-medium">{selectedOrder.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>
              
              <h4 className="font-medium mb-2">Produits commandés</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Produits fictifs pour la démonstration */}
                    {[...Array(Math.floor(Math.random() * 3) + 2)].map((_, index) => {
                      const quantity = Math.floor(Math.random() * 5) + 1;
                      const price = Math.floor(Math.random() * 2000) + 1000;
                      const total = quantity * price;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>Produit {index + 1}</TableCell>
                          <TableCell>{quantity}</TableCell>
                          <TableCell>{price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} HTG</TableCell>
                          <TableCell>{total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} HTG</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Chargement des commandes...</span>
              </div>
            ) : customerOrders.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Total: {customerOrders.length} commandes</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintOrders} disabled={isLoading}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commande #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.date}</TableCell>
                          <TableCell>{order.amount}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewOrderDetails(order)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucune commande trouvée pour ce client</p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerOrdersModal;
