
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { BarChart, LineChart, PieChart } from "@/components/ui/custom-charts";
import { BarChart3, FileText, Printer, Download, TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useReports, ReportFilters } from "@/hooks/useReports";
import { toast } from "sonner";
import { exportToPDF, exportToExcel, exportKeyStatistics, exportChartData } from "@/utils/exportUtils";

const Reports = () => {
  const { t } = useTranslation();
  const { 
    salesData, 
    productsData, 
    trendsData, 
    keyStatistics, 
    loading, 
    error, 
    applyFilters, 
    formatCurrency, 
    formatNumber, 
    formatPercentage 
  } = useReports();
  
  const form = useForm({
    defaultValues: {
      reportType: "sales",
      dateRange: "month",
      category: "all",
      startDate: "",
      endDate: "",
    },
  });

  const [activeReport, setActiveReport] = useState("sales");
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  // Gérer le changement de rapport
  const handleReportChange = (reportType: string) => {
    setActiveReport(reportType);
    form.setValue('reportType', reportType as any);
  };

  const handleExportPDF = () => {
    try {
      let exportData;
      let filename = 'rapport';

      switch (activeReport) {
        case 'sales':
          if (salesData) {
            exportData = exportChartData(salesData, 'bar', t('reports.salesReport'), t('reports.monthlySales'));
            filename = 'rapport_ventes';
          }
          break;
        case 'products':
          if (productsData) {
            exportData = exportChartData(productsData, 'pie', t('reports.productsReport'), t('reports.categoryDistribution'));
            filename = 'rapport_produits';
          }
          break;
        case 'trends':
          if (trendsData) {
            exportData = exportChartData(trendsData, 'line', t('reports.trendsReport'), t('reports.salesEvolution'));
            filename = 'rapport_tendances';
          }
          break;
        default:
          if (keyStatistics) {
            exportData = exportKeyStatistics(keyStatistics, 'statistiques_cles');
            filename = 'statistiques_cles';
          }
      }

      if (exportData) {
        exportToPDF(exportData, filename);
        toast.success(t('reports.exportPDFSuccess'));
      } else {
        toast.error(t('reports.noDataToExport'));
      }
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(t('reports.exportError'));
    }
  };

  const handleExportExcel = () => {
    try {
      let exportData;
      let filename = 'rapport';

      switch (activeReport) {
        case 'sales':
          if (salesData) {
            exportData = exportChartData(salesData, 'bar', t('reports.salesReport'), t('reports.monthlySales'));
            filename = 'rapport_ventes';
          }
          break;
        case 'products':
          if (productsData) {
            exportData = exportChartData(productsData, 'pie', t('reports.productsReport'), t('reports.categoryDistribution'));
            filename = 'rapport_produits';
          }
          break;
        case 'trends':
          if (trendsData) {
            exportData = exportChartData(trendsData, 'line', t('reports.trendsReport'), t('reports.salesEvolution'));
            filename = 'rapport_tendances';
          }
          break;
        default:
          if (keyStatistics) {
            exportData = exportKeyStatistics(keyStatistics, 'statistiques_cles');
            filename = 'statistiques_cles';
          }
      }

      if (exportData) {
        exportToExcel(exportData, filename);
        toast.success(t('reports.exportExcelSuccess'));
      } else {
        toast.error(t('reports.noDataToExport'));
      }
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error(t('reports.exportError'));
    }
  };

  const handlePrintReport = () => {
    try {
      toast.success(t('reports.printSuccess'));
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast.error(t('reports.printError'));
    }
  };

  const handleApplyFilters = async (data: any) => {
    try {
      const filters: ReportFilters = {
        reportType: data.reportType,
        dateRange: data.dateRange,
        category: data.category,
        startDate: data.startDate,
        endDate: data.endDate
      };
      
      await applyFilters(filters);
      toast.success(t('messages.success.filtersApplied'));
    } catch (error) {
      toast.error('Erreur lors de l\'application des filtres');
      console.error('Erreur applyFilters:', error);
    }
  };

  const renderReport = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des données...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-80">
            <div className="text-center text-red-600">
              <p>Erreur: {error}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch(activeReport) {
      case "sales":
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('reports.salesReport')}</CardTitle>
              <CardDescription>{t('reports.monthlySales')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-4" style={{ height: '320px', overflow: 'hidden' }}>
              <div style={{ height: '280px', width: '100%', overflow: 'hidden' }}>
                {salesData ? (
                  <BarChart data={salesData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case "products":
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('reports.productsReport')}</CardTitle>
              <CardDescription>{t('reports.categoryDistribution')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-4" style={{ height: '320px', overflow: 'hidden' }}>
              <div style={{ height: '280px', width: '100%', overflow: 'hidden' }}>
                {productsData ? (
                  <PieChart data={productsData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case "trends":
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('reports.trendsReport')}</CardTitle>
              <CardDescription>{t('reports.salesEvolution')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-4" style={{ height: '320px', overflow: 'hidden' }}>
              <div style={{ height: '280px', width: '100%', overflow: 'hidden' }}>
                {trendsData ? (
                  <LineChart data={trendsData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">{t('reports.title')}</h1>
        <p className="text-muted-foreground">
          {t('reports.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" 
          onClick={() => handleReportChange("sales")}>
          <CardHeader className={`pb-2 ${activeReport === "sales" ? "border-b-2 border-primary" : ""}`}>
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              {t('reports.salesReport')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Aperçu complet des ventes avec graphiques interactifs et filtres personnalisables
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" 
          onClick={() => handleReportChange("products")}>
          <CardHeader className={`pb-2 ${activeReport === "products" ? "border-b-2 border-primary" : ""}`}>
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              {t('reports.productsReport')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Analyse détaillée des performances produits et des tendances de consommation
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" 
          onClick={() => handleReportChange("trends")}>
          <CardHeader className={`pb-2 ${activeReport === "trends" ? "border-b-2 border-primary" : ""}`}>
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              {t('reports.trends')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Visualisation des évolutions et tendances de ventes sur différentes périodes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 space-y-6 min-w-0">
          <div className="flex justify-between items-center mb-2 md:hidden">
            <h3 className="font-semibold">{t('reports.filters')}</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            >
              {isFiltersVisible ? t('common.hide') : t('common.show')}
            </Button>
          </div>
          
          <div className={`${isFiltersVisible ? 'block' : 'hidden md:block'} space-y-6`}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('reports.filters')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleApplyFilters)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dateRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('reports.period')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('reports.selectPeriod')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="today">{t('reports.today')}</SelectItem>
                              <SelectItem value="week">{t('reports.thisWeek')}</SelectItem>
                              <SelectItem value="month">{t('reports.thisMonth')}</SelectItem>
                              <SelectItem value="quarter">{t('reports.thisQuarter')}</SelectItem>
                              <SelectItem value="year">{t('reports.thisYear')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('reports.category')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('reports.selectCategory')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">{t('reports.allCategories')}</SelectItem>
                              <SelectItem value="eau">{t('products.categories.water')}</SelectItem>
                              <SelectItem value="jus">{t('products.categories.juice')}</SelectItem>
                              <SelectItem value="soda">{t('products.categories.soda')}</SelectItem>
                              <SelectItem value="the">{t('products.categories.tea')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormItem>
                        <FormLabel>{t('reports.startDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>{t('reports.endDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" />
                        </FormControl>
                      </FormItem>
                    </div>

                    <Button type="submit" className="w-full">
                      {t('reports.applyFilters')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('reports.downloads')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left min-w-0 overflow-hidden text-sm" 
                    onClick={handleExportPDF}
                  >
                    <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t('reports.exportPDF')}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left min-w-0 overflow-hidden text-sm" 
                    onClick={handleExportExcel}
                  >
                    <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t('reports.exportExcel')}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left min-w-0 overflow-hidden text-sm" 
                    onClick={handlePrintReport}
                  >
                    <Printer className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t('reports.printReport')}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-3">
          {renderReport()}
          
          <Card className="mt-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('reports.keyStatistics')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : keyStatistics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {t('reports.totalSales')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-2xl font-bold">{formatCurrency(keyStatistics.totalSales)}</p>
                      <p className={`text-sm ${keyStatistics.salesTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(keyStatistics.salesTrend)} {t('reports.sinceLastMonth')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {t('reports.orders')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-2xl font-bold">{formatNumber(keyStatistics.totalOrders)}</p>
                      <p className={`text-sm ${keyStatistics.ordersTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(keyStatistics.ordersTrend)} {t('reports.sinceLastMonth')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {t('reports.topProduct')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xl font-bold">{keyStatistics.topProduct}</p>
                      <p className="text-sm text-muted-foreground">{t('reports.mostSold')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {t('reports.avgValue')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-2xl font-bold">{formatCurrency(keyStatistics.avgOrderValue)}</p>
                      <p className={`text-sm ${keyStatistics.avgTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(keyStatistics.avgTrend)} {t('reports.sinceLastMonth')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">{t('reports.noData')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
