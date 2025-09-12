
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Phone, Mail, MapPin, Users, FileText, ShoppingBag, UserPlus } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer } from "@/hooks/useCustomers";
import { useTranslation } from "@/hooks/useTranslation";
import CustomerDetailsModal from "@/components/customers/CustomerDetailsModal";
import CustomerOrdersModal from "@/components/customers/CustomerOrdersModal";
import NewCustomerModal from "@/components/customers/NewCustomerModal";

const Customers = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Utiliser le hook pour les clients
  const { customers, loading, error, isDemo, createCustomer } = useCustomers();
  
  const filteredCustomers = customers.filter(
    (customer) => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.contact_person && customer.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === "" || customer.type === typeFilter;
      
      return matchesSearch && matchesType;
    }
  );

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsModalOpen(true);
  };

  const handleViewOrders = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOrdersModalOpen(true);
  };

  const handleAddCustomer = async (newCustomer: any) => {
    try {
      await createCustomer(newCustomer);
      // La liste des clients sera automatiquement rafraîchie par le hook
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t('customers.title')}</h1>
          <p className="text-muted-foreground">
            {t('customers.subtitle')}
          </p>
        </div>

        <Button className="mt-4 md:mt-0" onClick={() => setNewCustomerModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> {t('customers.newCustomer')}
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('customers.customerList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
                <span className="sr-only">{t('common.search')}</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">{t('common.all')} {t('common.type')}</option>
                <option value="Hôtel">{t('customers.types.hotel')}</option>
                <option value="Restaurant">{t('customers.types.restaurant')}</option>
                <option value="Café">{t('customers.types.cafe')}</option>
                <option value="Bar">{t('customers.types.bar')}</option>
                <option value="Épicerie">{t('customers.types.grocery')}</option>
                <option value="Marché">{t('customers.types.market')}</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customers.customerName')}</TableHead>
                  <TableHead>{t('customers.contactPerson')}</TableHead>
                  <TableHead>{t('customers.contactInfo')}</TableHead>
                  <TableHead>{t('customers.totalOrders')}</TableHead>
                  <TableHead>{t('customers.customerSince')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.type}</div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.contact_person || customer.contact}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-2 h-3 w-3" /> {customer.phone}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-2 h-3 w-3" /> {customer.email}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-2 h-3 w-3" /> {customer.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{customer.total_orders || 0}</TableCell>
                      <TableCell>{customer.created_at ? new Date(customer.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {t('customers.customerDetails')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrders(customer)}
                        >
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          {t('customers.customerOrders')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t('common.noData')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" disabled>
              Précédent
            </Button>
            <Button size="sm" className="px-4">
              1
            </Button>
            <Button variant="outline" size="sm">
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>

      <CustomerDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        customer={selectedCustomer}
      />

      <CustomerOrdersModal
        open={ordersModalOpen}
        onOpenChange={setOrdersModalOpen}
        customer={selectedCustomer}
      />

      <NewCustomerModal
        open={newCustomerModalOpen}
        onOpenChange={setNewCustomerModalOpen}
        onCustomerCreated={handleAddCustomer}
      />
    </div>
  );
};

export default Customers;
