import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, UpdateBillFeesRequest, PayBillRequest, PaymentMethod } from '../models/bill.model';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private apiUrl = 'http://localhost:8080/api/bills';

  constructor(private http: HttpClient) {}

  getAllBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(this.apiUrl);
  }

  getBillById(id: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/${id}`);
  }

  getPendingBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/pending`);
  }

  getOverdueBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/overdue`);
  }

  getBillsByCustomer(customerId: number): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  getTotalRevenue(startDate: string, endDate: string): Observable<number> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<number>(`${this.apiUrl}/revenue`, { params });
  }

  updateBillWithFees(billId: number, request: UpdateBillFeesRequest): Observable<Bill> {
    let params = new HttpParams();
    
    if (request.damageFee !== undefined) {
      params = params.set('damageFee', request.damageFee.toString());
    }
    if (request.discount !== undefined) {
      params = params.set('discount', request.discount.toString());
    }
    if (request.notes !== undefined) {
      params = params.set('notes', request.notes);
    }

    return this.http.put<Bill>(`${this.apiUrl}/${billId}/fees`, null, { params });
  }

  markBillAsPaid(billId: number, paymentMethod: PaymentMethod): Observable<Bill> {
    const params = new HttpParams()
      .set('paymentMethod', paymentMethod);

    return this.http.put<Bill>(`${this.apiUrl}/${billId}/pay`, null, { params });
  }
}