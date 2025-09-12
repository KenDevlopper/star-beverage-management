import React, { useRef } from 'react';
import { Order } from '@/components/dashboard/RecentOrdersList';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BulkInvoicePrintProps {
  orders: Order[];
  onClose: () => void;
}

const BulkInvoicePrint: React.FC<BulkInvoicePrintProps> = ({ orders, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Données de démonstration pour les articles (en attendant l'intégration complète)
  const getDemoItems = (orderId: string) => [
    { name: "Shake Bongou", quantity: 3, price: 2000 },
    { name: "Shake Bongou", quantity: 2, price: 2000 }
  ];

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction pour formater le montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Fonction d'impression
  const handlePrint = () => {
    window.print();
  };

  // Fonction de téléchargement PDF en lot
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;

      for (const order of orders) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Créer un élément temporaire pour cette facture
        const tempDiv = document.createElement('div');
        tempDiv.className = 'invoice-print';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '210mm';
        tempDiv.style.backgroundColor = 'white';
        
        // Générer le contenu HTML pour cette facture
        const demoItems = getDemoItems(order.id);
        const subtotal = demoItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const taxRate = 0.10;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        tempDiv.innerHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <!-- En-tête -->
            <div style="background: linear-gradient(to right, #1e40af, #1e3a8a); color: white; padding: 30px; margin-bottom: 20px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="width: 60px; height: 60px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #1e40af; font-weight: bold; font-size: 24px;">SB</span>
                  </div>
                  <div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">STAR BEVERAGE</h1>
                    <p style="margin: 0; color: #dbeafe; font-size: 18px;">L'étoile des saveurs</p>
                  </div>
                </div>
                <div style="text-align: right;">
                  <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">FACTURE</h2>
                  <p style="margin: 0; color: #dbeafe;">N° ${order.id}</p>
                </div>
              </div>
              <div style="margin-top: 20px; color: #dbeafe;">
                <p style="margin: 0;">Route nationale #2 Caracol, Haiti</p>
                <p style="margin: 0;">Tél: +509 4253-1503 / 36548124 | Email: info@starbeverage.ht</p>
              </div>
            </div>

            <!-- Informations client et facture -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
              <div>
                <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 15px;">Facturé à :</h3>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                  <p style="font-weight: 500; color: #374151; margin: 0;">${order.client || 'Client non spécifié'}</p>
                  <p style="color: #6b7280; margin: 5px 0 0 0;">Route nationale #2 Caracol, Haiti</p>
                </div>
              </div>
              <div>
                <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 15px;">Informations de la facture :</h3>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Date de facture :</span>
                    <span style="font-weight: 500;">${formatDate(order.date)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Date d'échéance :</span>
                    <span style="font-weight: 500;">${formatDate(order.date)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280;">Statut :</span>
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 500; background: ${order.status === 'completed' ? '#dcfce7' : order.status === 'processing' ? '#dbeafe' : '#fef3c7'}; color: ${order.status === 'completed' ? '#166534' : order.status === 'processing' ? '#1e40af' : '#92400e'};">${order.status === 'completed' ? 'Livrée' : order.status === 'processing' ? 'En préparation' : 'En attente'}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tableau des articles -->
            <div style="margin-bottom: 30px;">
              <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 15px;">Articles commandés :</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Produit</th>
                    <th style="border: 1px solid #d1d5db; padding: 12px; text-align: center; font-weight: 600; color: #374151;">Quantité</th>
                    <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600; color: #374151;">Prix unitaire</th>
                    <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${demoItems.map((item, index) => `
                    <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
                      <td style="border: 1px solid #d1d5db; padding: 12px; color: #374151;">${item.name}</td>
                      <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: #374151;">${item.quantity}</td>
                      <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: #374151;">${formatAmount(item.price)}</td>
                      <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 500; color: #374151;">${formatAmount(item.quantity * item.price)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Totaux -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
              <div style="width: 100%; max-width: 400px;">
                <div style="background: #f9fafb; padding: 24px; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; color: #374151; margin-bottom: 12px;">
                    <span>Sous-total :</span>
                    <span>${formatAmount(subtotal)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #374151; margin-bottom: 12px;">
                    <span>Taxe (10%) :</span>
                    <span>${formatAmount(tax)}</span>
                  </div>
                  <hr style="border: none; border-top: 1px solid #d1d5db; margin: 12px 0;">
                  <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #374151;">
                    <span>Total :</span>
                    <span>${formatAmount(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div style="text-align: center; color: #6b7280;">
              <p style="margin: 0 0 8px 0;">Merci pour votre confiance !</p>
              <p style="margin: 0; font-size: 14px;">STAR BEVERAGE - L'étoile des saveurs</p>
              <p style="margin: 0; font-size: 14px;">Route nationale #2 Caracol, Haiti</p>
            </div>
          </div>
        `;

        document.body.appendChild(tempDiv);

        // Capturer cette facture
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, // A4 width in pixels at 96 DPI
          height: tempDiv.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Nettoyer l'élément temporaire
        document.body.removeChild(tempDiv);
      }

      pdf.save(`factures-${orders.length}-commandes.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Impression en Lot des Factures</h1>
              <p className="text-blue-100 mt-2">{orders.length} commande(s) sélectionnée(s)</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100">STAR BEVERAGE</p>
              <p className="text-blue-100 text-sm">L'étoile des saveurs</p>
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {orders.map((order) => {
              const demoItems = getDemoItems(order.id);
              const subtotal = demoItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
              const tax = subtotal * 0.10;
              const total = subtotal + tax;

              return (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">Commande #{order.id}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'completed' ? 'Livrée' :
                       order.status === 'processing' ? 'En préparation' : 'En attente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Client: {order.client}</p>
                  <p className="text-sm text-gray-600 mb-2">Date: {formatDate(order.date)}</p>
                  <p className="text-sm font-medium text-gray-800">Total: {formatAmount(total)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="bg-gray-100 p-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Télécharger PDF ({orders.length} factures)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimer ({orders.length} factures)</span>
          </button>
        </div>
      </div>

      {/* Styles pour l'impression */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          .invoice-print, .invoice-print * {
            visibility: visible !important;
          }
          
          .invoice-print {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 9999 !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BulkInvoicePrint;



