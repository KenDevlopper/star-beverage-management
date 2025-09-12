
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Calendar, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { Customer } from "@/hooks/useCustomers";

interface CustomerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

const CustomerDetailsModal = ({ open, onOpenChange, customer }: CustomerDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
          <DialogDescription>
            Informations détaillées du client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Type de client</h3>
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {customer.type}
                  </span>
                </div>
                <Separator />
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">Personne à contacter</h4>
                    <p className="font-medium">{customer.contact_person || customer.contact}</p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" /> 
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> 
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" /> 
                      <span>{customer.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-medium">Statistiques du client</h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <ShoppingBag className="mr-2 h-4 w-4" /> Commandes
                    </div>
                    <p className="font-medium text-lg">{customer.total_orders || 0}</p>
                  </div>
                  <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <Calendar className="mr-2 h-4 w-4" /> Client depuis
                    </div>
                    <p className="font-medium text-lg">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsModal;
