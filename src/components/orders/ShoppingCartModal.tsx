import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash, MinusCircle, PlusCircle } from "lucide-react";
import { OrderFormData } from "./NewOrderModal";
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface ShoppingCartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: (items: CartItem[]) => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const ShoppingCartModal = ({
  open,
  onOpenChange,
  onCheckout,
  cartItems,
  setCartItems,
}: ShoppingCartModalProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const increaseQuantity = (productId: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (productId: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    toast.success("Produit retiré du panier");
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    setIsCheckingOut(true);
    onCheckout(cartItems);
    setCartItems([]);
    setIsCheckingOut(false);
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success("Panier vidé");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Panier
          </DialogTitle>
          <DialogDescription>
            Consultez les produits dans votre panier avant de finaliser la commande.
          </DialogDescription>
        </DialogHeader>

        {cartItems.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2 text-left">Produit</th>
                    <th className="px-4 py-2 text-center">Qté</th>
                    <th className="px-4 py-2 text-right">Prix unit.</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.productId} className="border-b">
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => decreaseQuantity(item.productId)}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => increaseQuantity(item.productId)}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.unitPrice.toFixed(0)} HTG
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(item.quantity * item.unitPrice).toFixed(0)} HTG
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={clearCart}>
                Vider le panier
              </Button>
              <div className="text-lg font-medium">
                Total: {calculateTotal().toFixed(0)} HTG
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Votre panier est vide
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continuer achat
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isCheckingOut}
          >
            Passer commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingCartModal;
