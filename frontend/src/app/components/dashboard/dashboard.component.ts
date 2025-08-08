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
    <div class="dashboard-container fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Welcome to your Costume Rental Command Center</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="/rentals">
            <mat-icon>add</mat-icon>
            New Rental
          </button>
        </div>
      </div>

      <div class="stats-grid slide-up" *ngIf="!loading">
        <div class="stat-card customers-card">
          <div class="stat-header">
            <div class="stat-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ totalCustomers }}</div>
              <div class="stat-label">Total Customers</div>
            </div>
          </div>
          <div class="stat-footer">
            <button mat-button routerLink="/customers" class="view-all-btn">
              View All
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>

        <div class="stat-card costumes-card">
          <div class="stat-header">
            <div class="stat-icon">
              <mat-icon>checkroom</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ totalCostumes }}</div>
              <div class="stat-label">Available Costumes</div>
            </div>
          </div>
          <div class="stat-footer">
            <button mat-button routerLink="/costumes" class="view-all-btn">
              Manage
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>

        <div class="stat-card rentals-card">
          <div class="stat-header">
            <div class="stat-icon">
              <mat-icon>assignment</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ activeRentals.length }}</div>
              <div class="stat-label">Active Rentals</div>
            </div>
          </div>
          <div class="stat-footer">
            <button mat-button routerLink="/rentals" class="view-all-btn">
              Track All
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>

        <div class="stat-card bills-card">
          <div class="stat-header">
            <div class="stat-icon">
              <mat-icon>receipt</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ pendingBills.length }}</div>
              <div class="stat-label">Pending Bills</div>
            </div>
          </div>
          <div class="stat-footer">
            <button mat-button routerLink="/bills" class="view-all-btn">
              Review
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="activity-grid">
        <div class="activity-card modern-card">
          <div class="card-header">
            <h3 class="card-title">
              <mat-icon>schedule</mat-icon>
              Recent Activity
            </h3>
            <span class="activity-count">{{ activeRentals.length }} active</span>
          </div>
          <div class="card-content">
            <div *ngIf="activeRentals.length === 0" class="empty-state">
              <mat-icon>assignment_late</mat-icon>
              <p>No active rentals</p>
              <button mat-raised-button color="primary" routerLink="/rentals">Create First Rental</button>
            </div>
            <div *ngFor="let rental of activeRentals.slice(0, 5)" class="activity-item">
              <div class="activity-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="activity-details">
                <div class="activity-title">{{ rental.customer.firstName }}</div>
                <div class="activity-subtitle">rented {{ rental.costume.name }}</div>
                <div class="activity-time">{{ rental.rentalDate | date:'MMM dd, yyyy' }}</div>
              </div>
              <div class="activity-status">
                <span class="status-chip status-active">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div class="activity-card modern-card">
          <div class="card-header">
            <h3 class="card-title">
              <mat-icon>payment</mat-icon>
              Billing Overview
            </h3>
            <span class="billing-total currency">₹{{ getTotalPendingAmount() | number:'1.2-2' }}</span>
          </div>
          <div class="card-content">
            <div *ngIf="pendingBills.length === 0" class="empty-state">
              <mat-icon>paid</mat-icon>
              <p>No pending bills</p>
              <button mat-stroked-button routerLink="/bills">View All Bills</button>
            </div>
            <div *ngFor="let bill of pendingBills.slice(0, 5)" class="activity-item">
              <div class="activity-avatar billing-avatar">
                <mat-icon>receipt</mat-icon>
              </div>
              <div class="activity-details">
                <div class="activity-title">{{ bill.rental.customer.firstName }}</div>
                <div class="activity-subtitle">{{ bill.rental.costume.name }}</div>
                <div class="activity-time">Due: {{ bill.dueDate | date:'MMM dd' }}</div>
              </div>
              <div class="activity-amount">
                <span class="currency">₹{{ bill.totalAmount | number:'1.2-2' }}</span>
                <span class="status-chip status-pending">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner></mat-spinner>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: var(--space-6);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: linear-gradient(135deg, white, #fafafa);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--gray-200);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl);
    }

    .customers-card::before { background: linear-gradient(90deg, var(--primary-color), var(--primary-dark)); }
    .costumes-card::before { background: linear-gradient(90deg, var(--success-color), var(--primary-light)); }
    .rentals-card::before { background: linear-gradient(90deg, var(--warning-color), var(--accent-gold)); }
    .bills-card::before { background: linear-gradient(90deg, var(--accent-purple), var(--secondary-color)); }

    .stat-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      box-shadow: var(--shadow-md);
    }

    .stat-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .stat-number {
      font-size: var(--font-size-4xl);
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-footer {
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .view-all-btn {
      color: var(--primary-color) !important;
      font-weight: 500 !important;
      display: flex !important;
      align-items: center !important;
      gap: var(--space-2) !important;
    }

    .activity-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
    }

    .activity-card {
      min-height: 400px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 2px solid var(--border-color);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .activity-count {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-xl);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .billing-total {
      font-size: var(--font-size-xl);
      font-weight: 700;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-base);
      transition: all 0.2s ease;
      border-bottom: 1px solid var(--border-color);
    }

    .activity-item:hover {
      background: var(--background-tertiary);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-base);
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }

    .billing-avatar {
      background: linear-gradient(135deg, var(--secondary-color), var(--secondary-light));
    }

    .activity-details {
      flex: 1;
    }

    .activity-title {
      font-weight: 600;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }

    .activity-subtitle {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-top: var(--space-1);
    }

    .activity-time {
      color: var(--text-muted);
      font-size: var(--font-size-xs);
      margin-top: var(--space-1);
    }

    .activity-amount {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      align-items: flex-end;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12);
      color: var(--text-muted);
    }

    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: var(--space-4);
      color: var(--text-muted);
    }

    .empty-state p {
      margin-bottom: var(--space-6);
      font-size: var(--font-size-lg);
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: var(--space-4);
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }
      
      .activity-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }
      
      .stat-card {
        padding: var(--space-4);
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

  getTotalPendingAmount(): number {
    return this.pendingBills.reduce((total, bill) => total + Number(bill.totalAmount), 0);
  }
}