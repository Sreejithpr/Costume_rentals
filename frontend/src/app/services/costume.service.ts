import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Costume } from '../models/costume.model';

@Injectable({
  providedIn: 'root'
})
export class CostumeService {
  private apiUrl = 'http://localhost:8080/api/costumes';

  constructor(private http: HttpClient) {}

  getAllCostumes(): Observable<Costume[]> {
    return this.http.get<Costume[]>(this.apiUrl);
  }

  getAvailableCostumes(): Observable<Costume[]> {
    return this.http.get<Costume[]>(`${this.apiUrl}/available`);
  }

  getCostumeById(id: number): Observable<Costume> {
    return this.http.get<Costume>(`${this.apiUrl}/${id}`);
  }

  createCostume(costume: Costume): Observable<Costume> {
    return this.http.post<Costume>(this.apiUrl, costume);
  }

  updateCostume(id: number, costume: Costume): Observable<Costume> {
    return this.http.put<Costume>(`${this.apiUrl}/${id}`, costume);
  }

  deleteCostume(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchCostumes(term: string): Observable<Costume[]> {
    return this.http.get<Costume[]>(`${this.apiUrl}/search?term=${term}`);
  }

  getAllCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  getAllSizes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sizes`);
  }

  getCostumesByCategory(category: string): Observable<Costume[]> {
    return this.http.get<Costume[]>(`${this.apiUrl}/category/${category}`);
  }

  getCostumesBySize(size: string): Observable<Costume[]> {
    return this.http.get<Costume[]>(`${this.apiUrl}/size/${size}`);
  }
}