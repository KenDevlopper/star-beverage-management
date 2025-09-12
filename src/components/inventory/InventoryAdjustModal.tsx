
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

interface InventoryAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  onSave: (itemId: string, newQuantity: number, reason: string) => void;
}

interface AdjustFormData {
  quantity: number;
  reason: string;
}

const InventoryAdjustModal = ({
  open,
  onOpenChange,
  item,
  onSave,
}: InventoryAdjustModalProps) => {
  const form = useForm<AdjustFormData>({
    defaultValues: {
      quantity: 0,
      reason: "",
    },
  });

  useEffect(() => {
    if (item && open) {
      form.reset({
        quantity: item.inventory,
        reason: "",
      });
    }
  }, [item, open, form]);

  const handleSubmit = (data: AdjustFormData) => {
    if (item) {
      onSave(item.id, Number(data.quantity), data.reason);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajuster le stock</DialogTitle>
          <DialogDescription>
            Modifiez la quantité en stock pour {item?.name} (actuellement {item?.inventory} {item?.unit})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité en stock (Caisses)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison de l'ajustement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Expliquez la raison de cet ajustement..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryAdjustModal;
