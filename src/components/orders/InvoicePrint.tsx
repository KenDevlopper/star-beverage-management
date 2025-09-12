import React, { useRef } from 'react';
import { Order } from '@/components/dashboard/RecentOrdersList';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoicePrintProps {
  order: Order;
  onClose: () => void;
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({ order, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Données de démonstration pour les articles (en attendant l'intégration complète)
  const demoItems = [
    { name: "Shake Bongou", quantity: 3, price: 2000 },
    { name: "Shake Bongou", quantity: 2, price: 2000 }
  ];
  
  // Calculer les totaux
  const subtotal = demoItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxRate = 0.10; // 10% de taxe
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

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

  // Fonction de téléchargement PDF
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
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

      pdf.save(`facture-${order.id}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={invoiceRef} className="bg-white w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto invoice-print">
        {/* En-tête de la facture */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/image/Logo_Star copie.png" 
                alt="STAR BEVERAGE Logo" 
                className="h-16 w-16 object-contain bg-white rounded-lg p-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-3xl font-bold">STAR BEVERAGE</h1>
                <p className="text-blue-100 text-lg">L'étoile des saveurs</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-semibold mb-2">FACTURE</h2>
              <p className="text-blue-100">N° {order.id}</p>
            </div>
          </div>
          <div className="mt-6 text-blue-100">
            <p>Route nationale #2 Caracol, Haiti</p>
            <p>Tél: +509 4253-1503 / 36548124 | Email: info@starbeverage.ht</p>
          </div>
        </div>

        {/* Informations de la facture */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Informations client */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Facturé à :</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-800">
                  {order.client || 'Client non spécifié'}
                </p>
                <p className="text-gray-600">Route nationale #2 Caracol, Haiti</p>
              </div>
            </div>

            {/* Informations de la facture */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations de la facture :</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Date de facture :</span>
                  <span className="font-medium">{formatDate(order.date)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Date d'échéance :</span>
                  <span className="font-medium">{formatDate(order.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'completed' ? 'Livrée' :
                     order.status === 'processing' ? 'En préparation' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des articles */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Articles commandés :</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                      Produit
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                      Quantité
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-800">
                      Prix unitaire
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-800">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demoItems.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-3 text-gray-800">
                        {item.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-gray-800">
                        {formatAmount(item.price)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-800">
                        {formatAmount(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-full max-w-md">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Sous-total :</span>
                    <span>{formatAmount(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Taxe (10%) :</span>
                    <span>{formatAmount(tax)}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total :</span>
                    <span>{formatAmount(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes et remerciements */}
          <div className="mt-8 text-center text-gray-600">
            <p className="mb-2">Merci pour votre confiance !</p>
            <p className="text-sm">STAR BEVERAGE - L'étoile des saveurs</p>
            <p className="text-sm">Route nationale #2 Caracol, Haiti</p>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="bg-gray-100 p-6 flex justify-end space-x-4 no-print">
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
            <span>Télécharger PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimer</span>
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
          
          .no-print {
            display: none !important;
          }
          
          .invoice-print .bg-gradient-to-r {
            background: #1e40af !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          .invoice-print .text-white {
            color: white !important;
          }
          
          .invoice-print .text-blue-100 {
            color: #dbeafe !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePrint;
