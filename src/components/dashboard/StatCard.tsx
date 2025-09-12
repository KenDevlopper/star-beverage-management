
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

const StatCard = ({ title, value, icon, trend, className }: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center mt-1">
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              vs. mois précédent
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
