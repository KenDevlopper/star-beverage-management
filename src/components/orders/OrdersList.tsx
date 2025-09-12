
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, FileText, Printer, Eye, Search } from "lucide-react";
import { Order, OrderStatus } from "@/components/dashboard/RecentOrdersList";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface OrdersListProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onExportData: () => void;
  onPrintOrders: () => void;
}

const OrdersList = ({ orders, onViewDetails, onExportData, onPrintOrders }: OrdersListProps) => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" ? true : order.status === filterStatus;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       order.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return { label: t('orders.status.pending'), variant: "warning" as const };
      case "processing":
        return { label: t('orders.status.processing'), variant: "default" as const };
      case "completed":
        return { label: t('orders.status.completed'), variant: "success" as const };
      case "cancelled":
        return { label: t('orders.status.cancelled'), variant: "destructive" as const };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('orders.title')}</CardTitle>
        <CardDescription>
          {t('orders.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('orders.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select 
              defaultValue="all"
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('orders.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('orders.status.pending')}</SelectItem>
                <SelectItem value="processing">{t('orders.status.processing')}</SelectItem>
                <SelectItem value="completed">{t('orders.status.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('orders.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onExportData}>
              <FileText className="mr-2 h-4 w-4" />
              {t('common.export')}
            </Button>
            <Button variant="outline" onClick={onPrintOrders}>
              <Printer className="mr-2 h-4 w-4" />
              {t('common.print')}
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orders.orderNumber')}</TableHead>
                <TableHead>{t('orders.customer')}</TableHead>
                <TableHead>{t('orders.orderDate')}</TableHead>
                <TableHead>{t('orders.amount')}</TableHead>
                <TableHead>{t('orders.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
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
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewDetails(order)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t('orders.viewDetails')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {t('orders.noOrdersFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersList;
