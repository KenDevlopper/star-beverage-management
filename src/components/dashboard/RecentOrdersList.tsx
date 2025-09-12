
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface Order {
  id: string;
  client: string;
  date: string;
  amount: string;
  status: OrderStatus;
}

interface RecentOrdersListProps {
  orders: Order[];
}

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return { label: "En attente", variant: "warning" as const };
    case "processing":
      return { label: "En préparation", variant: "default" as const };
    case "completed":
      return { label: "Livrée", variant: "success" as const };
    case "cancelled":
      return { label: "Annulée", variant: "destructive" as const };
  }
};

const RecentOrdersList = ({ orders }: RecentOrdersListProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commande #</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const statusConfig = getStatusConfig(order.status);
          
          return (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.client}</TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>{order.amount}</TableCell>
              <TableCell>
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default RecentOrdersList;
