import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Étendre le type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// Types pour les données d'export
export interface ExportData {
  title: string;
  subtitle?: string;
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    width?: number;
  }>;
  summary?: {
    label: string;
    value: string | number;
  }[];
}

export interface ChartExportData {
  title: string;
  subtitle?: string;
  chartType: 'bar' | 'line' | 'pie';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
    }>;
  };
}

// Fonction pour exporter en PDF
export const exportToPDF = (exportData: ExportData | ChartExportData, filename: string = 'rapport') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(exportData.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (exportData.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(exportData.subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
  }

  // Date et heure
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${dateStr} à ${timeStr}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 20;

  // Vérifier si c'est un tableau de données ou un graphique
  if ('data' in exportData && Array.isArray(exportData.data) && 'columns' in exportData) {
    // Export de tableau de données
    const tableData = exportData.data.map(row => 
      exportData.columns.map(col => row[col.key] || '')
    );

    const tableHeaders = exportData.columns.map(col => col.label);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [139, 92, 246], // Couleur violette
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 50;

    // Ajouter le résumé si disponible
    if (exportData.summary && exportData.summary.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Résumé', 20, yPosition);
      yPosition += 10;

      exportData.summary.forEach(item => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.label}: ${item.value}`, 20, yPosition);
        yPosition += 7;
      });
    }
  } else if ('chartType' in exportData) {
    // Export de données de graphique
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Données du graphique', 20, yPosition);
    yPosition += 10;

    // Créer un tableau avec les données du graphique
    const chartData = exportData.data.labels.map((label, index) => {
      const row: any = { 'Période': label };
      exportData.data.datasets.forEach(dataset => {
        row[dataset.label] = dataset.data[index];
      });
      return row;
    });

    const chartHeaders = ['Période', ...exportData.data.datasets.map(ds => ds.label)];
    const chartTableData = chartData.map(row => 
      chartHeaders.map(header => row[header] || '')
    );

    autoTable(doc, {
      head: [chartHeaders],
      body: chartTableData,
      startY: yPosition,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  }

  // Pied de page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} sur ${totalPages} - StarBeverage Management System`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Télécharger le PDF
  doc.save(`${filename}_${dateStr.replace(/\//g, '-')}.pdf`);
};

// Fonction pour exporter en Excel
export const exportToExcel = (exportData: ExportData | ChartExportData, filename: string = 'rapport') => {
  const workbook = XLSX.utils.book_new();
  
  // Créer une feuille de données
  let worksheet;
  
  if ('data' in exportData && Array.isArray(exportData.data) && 'columns' in exportData) {
    // Export de tableau de données
    const headers = exportData.columns.map(col => col.label);
    const data = exportData.data.map(row => 
      exportData.columns.map(col => row[col.key] || '')
    );
    
    worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // Ajouter le résumé si disponible
    if (exportData.summary && exportData.summary.length > 0) {
      const summaryData = [
        [''],
        ['RÉSUMÉ'],
        ...exportData.summary.map(item => [item.label, item.value])
      ];
      
      const summaryRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const summaryStartRow = summaryRange.e.r + 3;
      
      XLSX.utils.sheet_add_aoa(worksheet, summaryData, { origin: `A${summaryStartRow}` });
    }
  } else if ('chartType' in exportData) {
    // Export de données de graphique
    const headers = ['Période', ...exportData.data.datasets.map(ds => ds.label)];
    const data = exportData.data.labels.map((label, index) => {
      const row = [label];
      exportData.data.datasets.forEach(dataset => {
        row.push(dataset.data[index]);
      });
      return row;
    });
    
    worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  }

  // Ajouter des métadonnées
  const metadata = [
    ['Titre', exportData.title],
    ['Sous-titre', exportData.subtitle || ''],
    ['Date de génération', new Date().toLocaleString('fr-FR')],
    ['Généré par', 'StarBeverage Management System'],
    ['']
  ];
  
  if (worksheet) {
    XLSX.utils.sheet_add_aoa(worksheet, metadata, { origin: 'A1' });
    
    // Ajuster la largeur des colonnes
    const colWidths = [];
    if ('columns' in exportData) {
      exportData.columns.forEach(col => {
        colWidths.push({ wch: col.width || 15 });
      });
    } else {
      // Pour les graphiques, ajuster selon le nombre de colonnes
      const numCols = exportData.data.datasets.length + 1;
      for (let i = 0; i < numCols; i++) {
        colWidths.push({ wch: 15 });
      }
    }
    worksheet['!cols'] = colWidths;
  }

  // Ajouter la feuille au classeur
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');

  // Télécharger le fichier Excel
  const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
  XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};

// Fonction pour exporter les statistiques clés
export const exportKeyStatistics = (statistics: any, filename: string = 'statistiques_cles') => {
  const exportData: ExportData = {
    title: 'Statistiques Clés',
    subtitle: 'Résumé des performances de l\'entreprise',
    data: [],
    columns: [
      { key: 'metric', label: 'Métrique' },
      { key: 'value', label: 'Valeur' },
      { key: 'trend', label: 'Tendance' }
    ],
    summary: [
      { label: 'Total des ventes', value: `${statistics.totalSales?.toLocaleString('fr-FR')} HTG` },
      { label: 'Nombre de commandes', value: statistics.totalOrders?.toLocaleString('fr-FR') },
      { label: 'Produit le plus vendu', value: statistics.topProduct },
      { label: 'Valeur moyenne des commandes', value: `${statistics.avgOrderValue?.toLocaleString('fr-FR')} HTG` }
    ]
  };

  // Créer les données du tableau
  exportData.data = [
    {
      metric: 'Total des ventes',
      value: `${statistics.totalSales?.toLocaleString('fr-FR')} HTG`,
      trend: `${statistics.salesTrend >= 0 ? '+' : ''}${statistics.salesTrend}%`
    },
    {
      metric: 'Nombre de commandes',
      value: statistics.totalOrders?.toLocaleString('fr-FR'),
      trend: `${statistics.ordersTrend >= 0 ? '+' : ''}${statistics.ordersTrend}%`
    },
    {
      metric: 'Produit le plus vendu',
      value: statistics.topProduct,
      trend: 'N/A'
    },
    {
      metric: 'Valeur moyenne des commandes',
      value: `${statistics.avgOrderValue?.toLocaleString('fr-FR')} HTG`,
      trend: `${statistics.avgTrend >= 0 ? '+' : ''}${statistics.avgTrend}%`
    }
  ];

  return exportData;
};

// Fonction pour exporter les données de graphique
export const exportChartData = (chartData: any, chartType: 'bar' | 'line' | 'pie', title: string, subtitle?: string): ChartExportData => {
  return {
    title,
    subtitle,
    chartType,
    data: chartData
  };
};
