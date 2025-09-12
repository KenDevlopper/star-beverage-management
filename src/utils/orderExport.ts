
import { Order, OrderStatus } from "@/components/dashboard/RecentOrdersList";

const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case "pending":
      return "En attente";
    case "processing":
      return "En préparation";
    case "completed":
      return "Livrée";
    case "cancelled":
      return "Annulée";
  }
};

export const exportOrdersToCSV = (orders: Order[]): void => {
  // Créer un CSV à partir des données de commandes
  const headers = ["Commande #", "Client", "Date", "Montant", "Statut"];
  
  const csvData = orders.map(order => {
    return [
      order.id,
      order.client,
      order.date,
      order.amount,
      getStatusLabel(order.status)
    ].join(",");
  });
  
  const csvContent = [
    headers.join(","),
    ...csvData
  ].join("\n");
  
  // Créer un fichier de téléchargement
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  // Configurer le lien de téléchargement
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `commandes_${date}.csv`);
  link.style.visibility = "hidden";
  
  // Ajouter à la page, cliquer et supprimer
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// API pour mettre à jour le statut d'une commande
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
  try {
    // Simulation d'un appel API pour mettre à jour le statut
    // Dans un environnement de production, remplacez ceci par un vrai appel API
    // const response = await fetch(`/api/orders/${orderId}`, {
    //   method: 'PATCH',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ status: newStatus }),
    // });
    
    // return response.ok;
    
    // Simulation d'un délai réseau et d'une réponse positive
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Statut de la commande ${orderId} mis à jour vers: ${newStatus}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return false;
  }
};
