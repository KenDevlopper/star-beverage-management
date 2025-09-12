
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import RecentOrdersList, { Order } from "@/components/dashboard/RecentOrdersList";
import LowStockAlerts, { StockItem } from "@/components/dashboard/LowStockAlerts";
import { BarChart, LineChart, PieChart } from "@/components/ui/custom-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Package, ShoppingCart, TrendingUp, AlertCircle } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { t } = useTranslation();
  const {
    stats,
    recentOrders,
    lowStockItems,
    salesData,
    categoryData,
    loading,
    error,
    isDemo,
    formatCurrency,
    formatDate
  } = useDashboard();

  // Composant de chargement pour les cartes de statistiques
  const StatCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-2">
          {isDemo && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{t('common.demo')}</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Aujourd'hui, le {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={t('dashboard.stats.todayOrders')}
              value={stats?.todayOrders?.toString() || "0"}
              icon={<ShoppingCart className="h-4 w-4" />}
              trend={stats?.todayOrdersTrend ? { value: Math.abs(stats.todayOrdersTrend), positive: stats.todayOrdersTrend > 0 } : undefined}
            />
            <StatCard
              title={t('dashboard.stats.monthlyRevenue')}
              value={stats?.monthlyRevenue ? formatCurrency(stats.monthlyRevenue) : "0 HTG"}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={stats?.monthlyRevenueTrend ? { value: Math.abs(stats.monthlyRevenueTrend), positive: stats.monthlyRevenueTrend > 0 } : undefined}
            />
            <StatCard
              title={t('dashboard.stats.lowStockProducts')}
              value={stats?.lowStockProducts?.toString() || "0"}
              icon={<Package className="h-4 w-4" />}
              trend={stats?.lowStockProductsTrend ? { value: Math.abs(stats.lowStockProductsTrend), positive: stats.lowStockProductsTrend < 0 } : undefined}
            />
            <StatCard
              title={t('dashboard.stats.scheduledDeliveries')}
              value={stats?.scheduledDeliveries?.toString() || "0"}
              icon={<Calendar className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      <div className="mt-6">
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">{t('dashboard.recentOrders')}</TabsTrigger>
            <TabsTrigger value="inventory">{t('dashboard.lowStockAlerts')}</TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <RecentOrdersList orders={recentOrders} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.lowStockAlerts')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <LowStockAlerts items={lowStockItems} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <ChartCard title={t('dashboard.salesChart')}>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : salesData ? (
            <LineChart 
              height={300}
              data={salesData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" as const },
                },
              }}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </ChartCard>
        <ChartCard title={t('dashboard.categoryChart')}>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : categoryData ? (
            <PieChart 
              height={300}
              data={categoryData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "right" as const },
                },
              }}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
