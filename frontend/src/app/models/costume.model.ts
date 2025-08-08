export interface Costume {
  id?: number;
  name: string;
  description?: string;
  size: string;
  category: string;
  sellPrice: number;
  originalPrice: number;
  available?: boolean;
  stockQuantity?: number;
  availableStock?: number;
  rentals?: any[];
}

export interface CostumeSearchRequest {
  term: string;
}