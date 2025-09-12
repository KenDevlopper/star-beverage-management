
export interface Product {
  id: string;
  name: string;
  category_id?: number;
  category_name?: string;
  price: number;
  inventory: number;
  unit?: string;
  status: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderStatus {
  value: string;
  label: string;
  variant: "warning" | "default" | "success" | "destructive";
}
