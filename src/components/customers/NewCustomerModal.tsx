
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { validateCustomer, sanitizeInput, formatPhone } from "@/utils/validation";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomerData {
  name: string;
  type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface NewCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: CustomerData) => void;
}

const NewCustomerModal = ({ open, onOpenChange, onCustomerCreated }: NewCustomerModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    type: "Restaurant",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // Nettoyer et formater les données
      const cleanedData = {
        ...formData,
        name: sanitizeInput(formData.name),
        contact_person: sanitizeInput(formData.contact_person),
        phone: formatPhone(formData.phone),
        email: sanitizeInput(formData.email),
        address: sanitizeInput(formData.address),
        notes: sanitizeInput(formData.notes)
      };
      
      // Valider les données
      const validation = validateCustomer(cleanedData);
      if (!validation.isValid) {
        const errors: Record<string, string[]> = {};
        validation.errors.forEach(error => {
          // Le format est maintenant "fieldName:errorMessage"
          const [fieldName, errorMessage] = error.split(':');
          if (fieldName && errorMessage) {
            if (!errors[fieldName]) errors[fieldName] = [];
            errors[fieldName].push(errorMessage);
          }
        });
        setValidationErrors(errors);
        toast.error('Veuillez corriger les erreurs dans le formulaire');
        return;
      }

      await onCustomerCreated(cleanedData);
      toast.success(t('customers.customerCreated'));
      onOpenChange(false);
      // Réinitialiser le formulaire
      setFormData({
        name: "",
        type: "Restaurant",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        notes: ""
      });
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('customers.newCustomer')}</DialogTitle>
          <DialogDescription>
            {t('customers.addNewCustomerDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('customers.customerName')}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t('customers.customerNamePlaceholder')}
                value={formData.name}
                onChange={handleChange}
                className={validationErrors.name ? 'border-red-500' : ''}
                required
              />
              {validationErrors.name && (
                <div className="text-sm text-red-500">
                  {validationErrors.name.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">{t('customers.customerType')}</Label>
              <select
                id="type"
                name="type"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="Hôtel">{t('customers.types.hotel')}</option>
                <option value="Restaurant">{t('customers.types.restaurant')}</option>
                <option value="Café">{t('customers.types.cafe')}</option>
                <option value="Bar">{t('customers.types.bar')}</option>
                <option value="Épicerie">{t('customers.types.grocery')}</option>
                <option value="Marché">{t('customers.types.market')}</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_person">{t('customers.contactPerson')}</Label>
              <Input
                id="contact_person"
                name="contact_person"
                placeholder={t('customers.contactPersonPlaceholder')}
                value={formData.contact_person}
                onChange={handleChange}
                className={validationErrors.contact_person ? 'border-red-500' : ''}
                required
              />
              {validationErrors.contact_person && (
                <div className="text-sm text-red-500">
                  {validationErrors.contact_person.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">{t('customers.phone')}</Label>
              <Input
                id="phone"
                name="phone"
                placeholder={t('customers.phonePlaceholder')}
                value={formData.phone}
                onChange={handleChange}
                className={validationErrors.phone ? 'border-red-500' : ''}
                required
              />
              {validationErrors.phone && (
                <div className="text-sm text-red-500">
                  {validationErrors.phone.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">{t('customers.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('customers.emailPlaceholder')}
                className={validationErrors.email ? 'border-red-500' : ''}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">{t('customers.address')}</Label>
              <Input
                id="address"
                name="address"
                placeholder={t('customers.addressPlaceholder')}
                value={formData.address}
                onChange={handleChange}
                className={validationErrors.address ? 'border-red-500' : ''}
                required
              />
              {validationErrors.address && (
                <div className="text-sm text-red-500">
                  {validationErrors.address.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">{t('customers.notes')}</Label>
              <Input
                id="notes"
                name="notes"
                placeholder={t('customers.notesPlaceholder')}
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('customers.createCustomer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewCustomerModal;
