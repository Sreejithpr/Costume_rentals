import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

import { RentalService } from '../../services/rental.service';
import { BillService } from '../../services/bill.service';
import { CustomerService } from '../../services/customer.service';
import { CostumeService } from '../../services/costume.service';
import { Rental } from '../../models/rental.model';
import { Bill } from '../../models/bill.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p>Welcome to the Costume Rental Billing System</p>
    </div>

    <div class="stats-grid" *ngIf="!loading">
      <mat-card class="stat-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>people</mat-icon>
          <mat-card-title>{{ totalCustomers }}</mat-card-title>
          <mat-card-subtitle>Total Customers</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-button routerLink="/customers">View All</button>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>checkroom</mat-icon>
          <mat-card-title>{{ totalCostumes }}</mat-card-title>
          <mat-card-subtitle>Total Costumes</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-button routerLink="/costumes">View All</button>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>assignment</mat-icon>
          <mat-card-title>{{ activeRentals.length }}</mat-card-title>
          <mat-card-subtitle>Active Rentals</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-button routerLink="/rentals">View All</button>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>receipt</mat-icon>
          <mat-card-title>{{ pendingBills.length }}</mat-card-title>
          <mat-card-subtitle>Pending Bills</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-button routerLink="/bills">View All</button>
        </mat-card-actions>
      </mat-card>
    </div>

    <div class="recent-activity" *ngIf="!loading">
      <div class="activity-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Rentals</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="activeRentals.length === 0" class="no-data">
              No active rentals
            </div>
            <div *ngFor="let rental of activeRentals.slice(0, 5)" class="rental-item">
              <strong>{{ rental.customer.firstName }} {{ rental.customer.lastName }}</strong>
              rented {{ rental.costume.name }}
              <span class="date">{{ rental.rentalDate | date:'short' }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="activity-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Pending Bills</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="pendingBills.length === 0" class="no-data">
              No pending bills
            </div>
            <div *ngFor="let bill of pendingBills.slice(0, 5)" class="bill-item">
              <strong>{{ bill.rental.customer.firstName }} {{ bill.rental.customer.lastName }}</strong>
              <span class="amount">\${{ bill.totalAmount | number:'1.2-2' }}</span>
              <span class="date">Due: {{ bill.dueDate | date:'short' }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner></mat-spinner>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      text-align: center;
    }

    .stat-card mat-card-title {
      font-size: 2em;
      font-weight: bold;
      color: #3f51b5;
    }

    .recent-activity {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .activity-section {
      min-height: 300px;
    }

    .rental-item,
    .bill-item {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .rental-item:last-child,
    .bill-item:last-child {
      border-bottom: none;
    }

    .date {
      color: #666;
      font-size: 0.9em;
    }

    .amount {
      color: #4caf50;
      font-weight: bold;
    }

    .no-data {
      text-align: center;
      color: #666;
      padding: 20px;
    }

    @media (max-width: 768px) {
      .recent-activity {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  loading = true;
  totalCustomers = 0;
  totalCostumes = 0;
  activeRentals: Rental[] = [];
  pendingBills: Bill[] = [];

  constructor(
    private rentalService: RentalService,
    private billService: BillService,
    private customerService: CustomerService,
    private costumeService: CostumeService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;

    // Load all data in parallel
    Promise.all([
      this.customerService.getAllCustomers().toPromise(),
      this.costumeService.getAllCostumes().toPromise(),
      this.rentalService.getActiveRentals().toPromise(),
      this.billService.getPendingBills().toPromise()
    ]).then(([customers, costumes, rentals, bills]) => {
      this.totalCustomers = customers?.length || 0;
      this.totalCostumes = costumes?.length || 0;
      this.activeRentals = rentals || [];
      this.pendingBills = bills || [];
      this.loading = false;
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
    });
  }
}