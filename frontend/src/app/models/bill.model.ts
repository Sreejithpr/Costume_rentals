import { Rental } from './rental.model';

export interface Bill {
  id?: number;
  rental: Rental;
  totalAmount: number;
  lateFee?: number;
  damageFee?: number;
  discount?: number;
  billDate: string;
  dueDate?: string;
  paidDate?: string;
  status: BillStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export enum BillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL'
}

export interface UpdateBillFeesRequest {
  damageFee?: number;
  discount?: number;
  notes?: string;
}

export interface PayBillRequest {
  paymentMethod: PaymentMethod;
}