
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface StockItem {
  id: string;
  name: string;
  current: number;
  minimum: number;
  unit: string;
}

interface LowStockAlertsProps {
  items: StockItem[];
}

const LowStockAlerts = ({ items }: LowStockAlertsProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produit</TableHead>
          <TableHead>Niveau actuel</TableHead>
          <TableHead>Niveau minimum</TableHead>
          <TableHead>État</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const percentage = Math.round((item.current / item.minimum) * 100);
          let status = "normal";
          
          if (percentage <= 50) {
            status = "critical";
          } else if (percentage <= 100) {
            status = "warning";
          }

          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.current} {item.unit}</TableCell>
              <TableCell>{item.minimum} {item.unit}</TableCell>
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
                    status === "warning" ? "warning" : 
                    "default"
                  }>
                    {status === "critical" ? "Critique" : 
                     status === "warning" ? "Attention" : 
                     "Normal"}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default LowStockAlerts;
