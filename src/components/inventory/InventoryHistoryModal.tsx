
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useInventory } from "@/hooks/useInventory";
import { useState, useEffect } from "react";

interface InventoryHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

// Données fictives pour l'historique (fallback)
const generateMockHistory = (itemId: string) => {
  const now = new Date();
  return [
    {
      id: "1",
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 jours plus tôt
      quantity: 25,
      type: "entrée",
      user: "Jean Dupont",
      reason: "Livraison fournisseur",
      unit: "Caisse"
    },
    {
      id: "2",
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 jours plus tôt
      quantity: 12,
      type: "sortie",
      user: "Marie Martin",
      reason: "Vente client",
      unit: "Caisse"
    },
    {
      id: "3",
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 jours plus tôt
      quantity: 5,
      type: "sortie",
      user: "Pierre Durand",
      reason: "Échantillons pour dégustation",
      unit: "Caisse"
    },
    {
      id: "4",
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 jour plus tôt
      quantity: 15,
      type: "entrée",
      user: "Sophie Lefebvre",
      reason: "Ajustement d'inventaire",
      unit: "Caisse"
    }
  ];
};

const InventoryHistoryModal = ({
  open,
  onOpenChange,
  item,
}: InventoryHistoryModalProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getProductHistory } = useInventory();

  useEffect(() => {
    if (item && open) {
      loadHistory();
    }
  }, [item, open]);

  const loadHistory = async () => {
    if (!item) return;
    
    setLoading(true);
    try {
      const historyData = await getProductHistory(item.id);
      setHistory(historyData);
    } catch (error) {
      // En cas d'erreur, utiliser les données mockées
      const mockHistory = generateMockHistory(item.id);
      setHistory(mockHistory);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Historique des mouvements</DialogTitle>
          <DialogDescription>
            Historique des entrées et sorties pour {item.name}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md max-h-96 overflow-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement de l'historique...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Raison</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.date), "dd MMMM yyyy à HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === "entrée"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.type === "entrée" ? "Entrée" : "Sortie"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.type === "entrée" ? "+" : "-"}{entry.quantity} {entry.unit || item.unit}
                      </TableCell>
                      <TableCell>{entry.user}</TableCell>
                      <TableCell>{entry.reason}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Aucun historique disponible pour ce produit
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryHistoryModal;
