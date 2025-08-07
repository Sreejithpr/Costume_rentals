import { Customer } from './customer.model';
import { Costume } from './costume.model';

export interface Rental {
  id?: number;
  customer: Customer;
  costume: Costume;
  rentalDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: RentalStatus;
  notes?: string;
  bill?: any;
}

export enum RentalStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface CreateRentalRequest {
  customerId: number;
  costumeId: number;
  rentalDate: string;
  expectedReturnDate: string;
  notes?: string;
}

export interface ReturnCostumeRequest {
  actualReturnDate: string;
}