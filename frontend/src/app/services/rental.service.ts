import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rental, CreateRentalRequest, ReturnCostumeRequest } from '../models/rental.model';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private apiUrl = 'http://localhost:8080/api/rentals';

  constructor(private http: HttpClient) {}

  getAllRentals(): Observable<Rental[]> {
    return this.http.get<Rental[]>(this.apiUrl);
  }

  getRentalById(id: number): Observable<Rental> {
    return this.http.get<Rental>(`${this.apiUrl}/${id}`);
  }

  getActiveRentals(): Observable<Rental[]> {
    return this.http.get<Rental[]>(`${this.apiUrl}/active`);
  }

  getOverdueRentals(): Observable<Rental[]> {
    return this.http.get<Rental[]>(`${this.apiUrl}/overdue`);
  }

  getRentalsByCustomer(customerId: number): Observable<Rental[]> {
    return this.http.get<Rental[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  createRental(request: CreateRentalRequest): Observable<Rental> {
    const params = new HttpParams()
      .set('customerId', request.customerId.toString())
      .set('costumeId', request.costumeId.toString())
      .set('rentalDate', request.rentalDate)
      .set('expectedReturnDate', request.expectedReturnDate)
      .set('notes', request.notes || '');

    return this.http.post<Rental>(this.apiUrl, null, { params });
  }

  returnCostume(rentalId: number, request: ReturnCostumeRequest): Observable<Rental> {
    const params = new HttpParams()
      .set('actualReturnDate', request.actualReturnDate);

    return this.http.put<Rental>(`${this.apiUrl}/${rentalId}/return`, null, { params });
  }

  cancelRental(rentalId: number): Observable<Rental> {
    return this.http.put<Rental>(`${this.apiUrl}/${rentalId}/cancel`, null);
  }

  updateRentalNotes(rentalId: number, notes: string): Observable<Rental> {
    return this.http.put<Rental>(`${this.apiUrl}/${rentalId}/notes`, notes);
  }
}