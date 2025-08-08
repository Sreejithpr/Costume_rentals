export interface Customer {
  id?: number;
  firstName: string;
  email?: string;
  phone?: string;
  address?: string;
  rentals?: any[];
}

export interface CustomerSearchRequest {
  term: string;
}