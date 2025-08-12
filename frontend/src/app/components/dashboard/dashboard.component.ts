import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule, Router } from '@angular/router';

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
    MatDialogModule,
    MatTableModule,
    MatChipsModule,
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
              <div class="stat-amount">₹{{ getTotalPendingAmount() | number:'1.2-2' }}</div>
            </div>
          </div>
          <div class="stat-footer">
            <button mat-button (click)="showAllBills()" class="view-all-btn">
              View All Bills
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
              <button mat-stroked-button (click)="showAllBills()">View All Bills</button>
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

    <!-- Bills Dialog -->
    <div *ngIf="showBillsDialog" class="bills-dialog-overlay" (click)="closeBillsDialog()">
      <div class="bills-dialog-content" (click)="$event.stopPropagation()">
        <div class="bills-dialog-header">
          <h2>All Bills Overview</h2>
          <button mat-icon-button (click)="closeBillsDialog()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <div class="bills-summary">
          <div class="summary-item">
            <span class="summary-label">Total Bills:</span>
            <span class="summary-value">{{ allBills.length }}</span>
            <div class="summary-breakdown">
              <small>Active: {{ getPendingBillsCount() }} | Paid: {{ getPaidBillsCount() }} | Overdue: {{ getOverdueBillsCount() }}</small>
            </div>
          </div>
          <div class="summary-item">
            <span class="summary-label">Pending Amount:</span>
            <span class="summary-value currency">₹{{ getTotalPendingAmount() | number:'1.2-2' }}</span>
            <div class="summary-breakdown">
              <small>Avg: ₹{{ getAveragePendingAmount() | number:'1.2-2' }}</small>
            </div>
          </div>
          <div class="summary-item">
            <span class="summary-label">Paid Amount:</span>
            <span class="summary-value currency paid">₹{{ getTotalPaidAmount() | number:'1.2-2' }}</span>
            <div class="summary-breakdown">
              <small>This Month: ₹{{ getThisMonthPaidAmount() | number:'1.2-2' }}</small>
            </div>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Revenue:</span>
            <span class="summary-value currency total">₹{{ getTotalRevenue() | number:'1.2-2' }}</span>
            <div class="summary-breakdown">
              <small>{{ getCollectionRate() }}% Collection Rate</small>
            </div>
          </div>
          <div class="summary-item">
            <span class="summary-label">Late Fees:</span>
            <span class="summary-value currency late">₹{{ getTotalLateFees() | number:'1.2-2' }}</span>
            <div class="summary-breakdown">
              <small>From {{ getOverdueBillsCount() }} overdue bills</small>
            </div>
          </div>
          <div class="summary-item">
            <span class="summary-label">Outstanding:</span>
            <span class="summary-value currency outstanding">₹{{ getTotalOutstanding() | number:'1.2-2' }}</span>
            <div class="summary-breakdown">
              <small>Avg Days: {{ getAverageOutstandingDays() }}</small>
            </div>
          </div>
        </div>

        <div class="bills-content">
          <div *ngIf="billsLoading" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <table mat-table [dataSource]="allBills" *ngIf="!billsLoading" class="bills-table">
            <ng-container matColumnDef="billInfo">
              <th mat-header-cell *matHeaderCellDef>Bill Info</th>
              <td mat-cell *matCellDef="let bill">
                <div class="bill-info-cell">
                  <div class="bill-id"><strong>#{{ bill.id || 'N/A' }}</strong></div>
                  <div class="bill-date">{{ bill.billDate | date:'MMM dd, yyyy' }}</div>
                  <div class="bill-type">{{ getBillType(bill) }}</div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer Details</th>
              <td mat-cell *matCellDef="let bill">
                <div class="customer-detail-cell">
                  <div class="customer-name">{{ bill.rental.customer.firstName }} {{ bill.rental.customer.lastName }}</div>
                  <div class="customer-phone">📞 {{ bill.rental.customer.phone }}</div>
                  <div class="customer-email" *ngIf="bill.rental.customer.email">✉️ {{ bill.rental.customer.email }}</div>
                </div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="rentalInfo">
              <th mat-header-cell *matHeaderCellDef>Rental Details</th>
              <td mat-cell *matCellDef="let bill">
                <div class="rental-info-cell">
                  <div class="costume-name">{{ bill.rental.costume.name }}</div>
                  <div class="costume-category">{{ bill.rental.costume.category }} - {{ bill.rental.costume.size }}</div>
                  <div class="rental-period">
                    {{ bill.rental.rentalDate | date:'MMM dd' }} - {{ bill.rental.expectedReturnDate | date:'MMM dd' }}
                    <span class="rental-days">({{ getRentalDays(bill) }} days)</span>
                  </div>
                  <div class="return-status" *ngIf="bill.rental.actualReturnDate">
                    ✅ Returned: {{ bill.rental.actualReturnDate | date:'MMM dd' }}
                  </div>
                </div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="billing">
              <th mat-header-cell *matHeaderCellDef>Billing Breakdown</th>
              <td mat-cell *matCellDef="let bill">
                <div class="billing-breakdown-cell">
                  <div class="base-amount">Base: ₹{{ bill.rental.costume.sellPrice | number:'1.2-2' }}</div>
                  <div class="late-fee" *ngIf="bill.lateFee && bill.lateFee > 0">
                    Late Fee: ₹{{ bill.lateFee | number:'1.2-2' }}
                  </div>
                  <div class="damage-fee" *ngIf="bill.damageFee && bill.damageFee > 0">
                    Damage: ₹{{ bill.damageFee | number:'1.2-2' }}
                  </div>
                  <div class="discount" *ngIf="bill.discount && bill.discount > 0">
                    Discount: -₹{{ bill.discount | number:'1.2-2' }}
                  </div>
                  <div class="total-amount">
                    <strong>Total: ₹{{ bill.totalAmount | number:'1.2-2' }}</strong>
                  </div>
                </div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Payment Status</th>
              <td mat-cell *matCellDef="let bill">
                <div class="status-info-cell">
                <mat-chip [class]="'status-' + bill.status.toLowerCase()">{{ bill.status }}</mat-chip>
                  <div class="payment-method" *ngIf="bill.paymentMethod">
                    💳 {{ bill.paymentMethod }}
                  </div>
                  <div class="payment-date" *ngIf="bill.paidDate">
                    Paid: {{ bill.paidDate | date:'MMM dd, yyyy' }}
                  </div>
                  <div class="due-info" *ngIf="bill.status === 'PENDING' && bill.dueDate">
                    Due: {{ bill.dueDate | date:'MMM dd' }}
                    <span class="days-remaining" [class.overdue]="getDaysUntilDue(bill) < 0">
                      ({{ getDaysUntilDue(bill) }} days)
                    </span>
                  </div>
                </div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let bill">
                <div class="action-buttons-cell">
                  <button mat-icon-button (click)="printBillFromDashboard(bill)" title="Print Bill" class="action-btn print">
                  <mat-icon>print</mat-icon>
                </button>
                  <button mat-icon-button (click)="viewBillDetails(bill)" title="View Details" class="action-btn view">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button *ngIf="bill.status === 'PENDING'" (click)="markAsPaidFromDashboard(bill)" title="Mark as Paid" class="action-btn pay">
                    <mat-icon>payment</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="billsDisplayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: billsDisplayedColumns;" [class.overdue-row]="row.status === 'OVERDUE'" [class.paid-row]="row.status === 'PAID'"></tr>
          </table>

          <div *ngIf="allBills.length === 0 && !billsLoading" class="no-bills">
            <mat-icon>receipt_long</mat-icon>
            <p>No bills found</p>
          </div>
        </div>
      </div>
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

    .stat-amount {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--primary-color);
      margin-top: var(--space-1);
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

      /* Mobile Bills Dialog Styles */
      .bills-dialog-overlay {
        padding: var(--space-2);
        align-items: flex-start;
        padding-top: var(--space-4);
      }

      .bills-dialog-content {
        width: 100%;
        max-width: 100vw;
        max-height: 95vh;
        margin: 0;
        border-radius: var(--radius-lg);
        border-width: 2px;
      }

      .bills-dialog-header {
        padding: var(--space-6) var(--space-4);
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .bills-dialog-header h2 {
        font-size: var(--font-size-h4);
        order: 1;
        width: 100%;
        text-align: center;
        margin-bottom: var(--space-2);
      }

      .bills-dialog-header button {
        order: 2;
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        width: 40px;
        height: 40px;
      }

      .bills-summary {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        padding: var(--space-6) var(--space-4);
      }

      .summary-item {
        padding: var(--space-4);
        min-height: auto;
      }

      .summary-label {
        font-size: var(--font-size-xs);
        margin-bottom: var(--space-2);
      }

      .summary-value {
        font-size: var(--font-size-xl);
      }

      .bills-content {
        padding: var(--space-4);
        overflow-x: auto;
      }

      .bills-table {
        min-width: 900px;
        font-size: var(--font-size-xs);
      }

      .bills-table th,
      .bills-table td {
        padding: var(--space-2);
        font-size: var(--font-size-xs);
      }

      /* Mobile cell adjustments */
      .bill-info-cell,
      .customer-detail-cell,
      .rental-info-cell,
      .billing-breakdown-cell,
      .status-info-cell {
        min-width: auto;
        font-size: var(--font-size-xs);
      }

      .customer-phone,
      .customer-email,
      .costume-category,
      .rental-period,
      .payment-method,
      .payment-date,
      .due-info {
        font-size: 10px;
      }

      .action-buttons-cell {
        flex-direction: column;
        gap: var(--space-1);
      }

      .action-btn {
        width: 32px;
        height: 32px;
      }

      .summary-breakdown {
        font-size: 10px;
      }

      .bills-table th {
        font-size: var(--font-size-xs);
        letter-spacing: 0.025em;
      }

      .no-bills {
        padding: var(--space-8);
        margin: var(--space-2);
      }

      .no-bills mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        margin-bottom: var(--space-4);
      }

      .no-bills h3 {
        font-size: var(--font-size-h5);
        margin-bottom: var(--space-3);
      }

      .no-bills p {
        font-size: var(--font-size-sm);
      }
    }

    @media (max-width: 480px) {
      .bills-dialog-content {
        border-radius: var(--radius-base);
        max-height: 98vh;
      }

      .bills-dialog-header h2 {
        font-size: var(--font-size-h5);
      }

      .bills-summary {
        padding: var(--space-4) var(--space-3);
        gap: var(--space-3);
      }

      .summary-item {
        padding: var(--space-3);
      }

      .summary-value {
        font-size: var(--font-size-lg);
      }

      .bills-content {
        padding: var(--space-3);
      }

      .bills-table {
        min-width: 500px;
      }
    }

    /* Bills Dialog Styles - Enhanced with theme colors */
    .bills-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: var(--space-4);
      animation: fadeInOverlay 0.3s ease-out;
    }

    @keyframes fadeInOverlay {
      from { opacity: 0; background: rgba(0, 0, 0, 0); }
      to { opacity: 1; background: rgba(0, 0, 0, 0.7); }
    }

    .bills-dialog-content {
      background: var(--background-primary);
      border-radius: var(--radius-xl);
      max-width: 95vw;
      max-height: 95vh;
      width: 900px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px rgba(0, 122, 142, 0.2), var(--shadow-xl);
      border: 3px solid var(--primary-color);
      overflow: hidden;
      animation: slideInDialog 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    @keyframes slideInDialog {
      from { opacity: 0; transform: translateY(-50px) scale(0.9); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .bills-dialog-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--primary-light), var(--accent-gold));
      animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .bills-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-8) var(--space-8) var(--space-6) var(--space-8);
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 50%, var(--primary-light) 100%);
      color: white;
      position: relative;
      overflow: hidden;
    }

    .bills-dialog-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .bills-dialog-header:hover::before {
      opacity: 1;
    }

    .bills-dialog-header h2 {
      margin: 0;
      color: white;
      font-family: var(--font-editorial);
      font-size: var(--font-size-h3);
      font-weight: 800;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .bills-dialog-header h2::before {
      content: '📊';
      font-size: var(--font-size-h4);
    }

    .bills-dialog-header button {
      color: white !important;
      background: rgba(255, 255, 255, 0.2) !important;
      border-radius: var(--radius-base) !important;
      transition: all 0.3s ease !important;
      backdrop-filter: blur(10px) !important;
    }

    .bills-dialog-header button:hover {
      background: rgba(255, 255, 255, 0.3) !important;
      transform: scale(1.1) !important;
    }

    .bills-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      padding: var(--space-8);
      background: linear-gradient(135deg, var(--background-secondary) 0%, var(--accent-cream) 50%, var(--background-secondary) 100%);
      border-bottom: 2px solid var(--border-color);
      position: relative;
    }

    @media (min-width: 1200px) {
      .bills-summary {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (min-width: 1400px) {
      .bills-summary {
        grid-template-columns: repeat(6, 1fr);
        gap: var(--space-6);
      }
    }

    .bills-summary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-gold), var(--primary-color), var(--accent-purple));
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      text-align: center;
      padding: var(--space-6);
      background: var(--background-primary);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0, 122, 142, 0.1), var(--shadow-md);
      border: 2px solid var(--border-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .summary-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .summary-item:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 16px 32px rgba(0, 122, 142, 0.15), var(--shadow-lg);
      border-color: var(--primary-color);
    }

    .summary-item:hover::before {
      opacity: 1;
    }

    .summary-item:nth-child(1)::before {
      background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
    }

    .summary-item:nth-child(2)::before {
      background: linear-gradient(90deg, var(--accent-gold), var(--warning-color));
    }

    .summary-item:nth-child(3)::before {
      background: linear-gradient(90deg, var(--success-color), var(--primary-light));
    }

    .summary-item:nth-child(4)::before {
      background: linear-gradient(90deg, var(--accent-purple), var(--secondary-color));
    }

    .summary-item:nth-child(5)::before {
      background: linear-gradient(90deg, var(--error-color), var(--warning-color));
    }

    .summary-item:nth-child(6)::before {
      background: linear-gradient(90deg, var(--accent-gold), var(--primary-color));
    }

    .summary-breakdown {
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--border-color);
      opacity: 0.8;
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      font-weight: 500;
    }

    .summary-value.total {
      color: var(--accent-purple);
      text-shadow: 0 1px 2px rgba(106, 76, 147, 0.2);
    }

    .summary-value.late {
      color: var(--error-color);
      text-shadow: 0 1px 2px rgba(160, 82, 45, 0.2);
    }

    .summary-value.outstanding {
      color: var(--warning-color);
      text-shadow: 0 1px 2px rgba(184, 134, 11, 0.2);
    }

    .summary-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--space-3);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      font-family: var(--font-body);
    }

    .summary-value {
      font-size: var(--font-size-2xl);
      font-weight: 800;
      color: var(--primary-color);
      font-family: var(--font-editorial);
      text-shadow: 0 1px 2px rgba(0, 122, 142, 0.2);
      margin-bottom: var(--space-2);
    }

    .summary-value.paid {
      color: var(--success-color);
      text-shadow: 0 1px 2px rgba(45, 90, 39, 0.2);
    }

    .bills-content {
      padding: var(--space-8);
      flex: 1;
      overflow: auto;
      background: var(--background-primary);
    }

    .bills-table {
      width: 100%;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      border: 2px solid var(--border-color);
    }

    .bills-table th {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white !important;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
      padding: var(--space-4) var(--space-3);
      font-size: var(--font-size-sm);
      border-bottom: 2px solid var(--accent-gold);
    }

    .bills-table td {
      padding: var(--space-4) var(--space-3);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      transition: all 0.2s ease;
    }

    .bills-table tr:hover td {
      background: var(--background-tertiary);
      color: var(--text-primary);
    }

    .bills-table .status-pending {
      background: linear-gradient(135deg, var(--accent-gold), #FDF958);
      color: #333;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-base);
      font-weight: 600;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .bills-table .status-paid {
      background: linear-gradient(135deg, var(--success-color), #4ade80);
      color: white;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-base);
      font-weight: 600;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    .bills-table .status-overdue {
      background: linear-gradient(135deg, var(--error-color), #f87171);
      color: white;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-base);
      font-weight: 600;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    /* Detailed Cell Styling */
    .bill-info-cell {
      min-width: 120px;
    }

    .bill-id {
      color: var(--primary-color);
      font-weight: 700;
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-1);
    }

    .bill-date {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-1);
    }

    .bill-type {
      background: var(--accent-gold);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: 600;
      display: inline-block;
    }

    .customer-detail-cell {
      min-width: 180px;
    }

    .customer-name {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .customer-phone, .customer-email {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-1);
    }

    .rental-info-cell {
      min-width: 200px;
    }

    .costume-name {
      font-weight: 600;
      color: var(--secondary-color);
      margin-bottom: var(--space-1);
    }

    .costume-category {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-2);
    }

    .rental-period {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-bottom: var(--space-1);
    }

    .rental-days {
      color: var(--primary-color);
      font-weight: 600;
    }

    .return-status {
      color: var(--success-color);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .billing-breakdown-cell {
      min-width: 150px;
      text-align: right;
    }

    .base-amount {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-1);
    }

    .late-fee, .damage-fee {
      color: var(--error-color);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-1);
      font-weight: 600;
    }

    .discount {
      color: var(--success-color);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-1);
      font-weight: 600;
    }

    .total-amount {
      color: var(--primary-color);
      font-weight: 700;
      font-size: var(--font-size-sm);
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--border-color);
    }

    .status-info-cell {
      min-width: 140px;
    }

    .payment-method, .payment-date {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-top: var(--space-1);
    }

    .due-info {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-top: var(--space-1);
    }

    .days-remaining {
      color: var(--primary-color);
      font-weight: 600;
    }

    .days-remaining.overdue {
      color: var(--error-color);
    }

    .action-buttons-cell {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-base);
      transition: all 0.3s ease;
    }

    .action-btn.print {
      color: var(--text-secondary);
    }

    .action-btn.print:hover {
      color: var(--primary-color);
      background: rgba(0, 122, 142, 0.1);
    }

    .action-btn.view {
      color: var(--secondary-color);
    }

    .action-btn.view:hover {
      color: var(--secondary-color);
      background: rgba(1, 107, 209, 0.1);
    }

    .action-btn.pay {
      color: var(--success-color);
    }

    .action-btn.pay:hover {
      color: var(--success-color);
      background: rgba(45, 90, 39, 0.1);
    }

    .no-bills {
      text-align: center;
      padding: var(--space-16);
      color: var(--text-muted);
      background: linear-gradient(135deg, var(--background-secondary), var(--accent-cream));
      border-radius: var(--radius-lg);
      border: 2px dashed var(--border-color);
      margin: var(--space-4);
    }

    .no-bills mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: var(--space-6);
      color: var(--accent-gold);
      opacity: 0.6;
    }

    .no-bills h3 {
      font-family: var(--font-editorial);
      font-size: var(--font-size-h4);
      margin-bottom: var(--space-4);
      color: var(--text-primary);
    }

          .no-bills p {
        font-family: var(--font-accent);
        font-style: italic;
        color: var(--text-secondary);
      }

    /* Dark Mode Support for Bills Dialog */
    [data-theme="dark"] .bills-dialog-content {
      background: var(--background-primary);
      border-color: var(--primary-light);
      box-shadow: 0 25px 50px rgba(0, 178, 169, 0.3), var(--shadow-xl);
    }

    [data-theme="dark"] .bills-summary {
      background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-tertiary) 50%, var(--background-secondary) 100%);
      border-bottom-color: var(--border-color);
    }

    [data-theme="dark"] .summary-item {
      background: var(--background-primary);
      border-color: var(--border-color);
      box-shadow: 0 8px 24px rgba(0, 178, 169, 0.2), var(--shadow-md);
    }

    [data-theme="dark"] .summary-item:hover {
      border-color: var(--primary-light);
      box-shadow: 0 16px 32px rgba(0, 178, 169, 0.25), var(--shadow-lg);
    }

    [data-theme="dark"] .bills-table {
      border-color: var(--border-color);
      background: var(--background-primary);
    }

    [data-theme="dark"] .bills-table th {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border-bottom-color: var(--accent-gold);
    }

    [data-theme="dark"] .bills-table td {
      border-bottom-color: var(--border-color);
      color: var(--text-primary);
    }

    [data-theme="dark"] .bills-table tr:hover td {
      background: var(--background-tertiary);
    }

    [data-theme="dark"] .no-bills {
      background: linear-gradient(135deg, var(--background-secondary), var(--background-tertiary));
      border-color: var(--border-color);
    }
  `]
})
export class DashboardComponent implements OnInit {
  loading = true;
  totalCustomers = 0;
  totalCostumes = 0;
  activeRentals: Rental[] = [];
  pendingBills: Bill[] = [];
  
  // Bills dialog properties
  showBillsDialog = false;
  billsLoading = false;
  allBills: Bill[] = [];
  billsDisplayedColumns: string[] = ['billInfo', 'customer', 'rentalInfo', 'billing', 'status', 'actions'];

  constructor(
    private rentalService: RentalService,
    private billService: BillService,
    private customerService: CustomerService,
    private costumeService: CostumeService,
    private router: Router
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

  getTotalPaidAmount(): number {
    return this.allBills
      .filter(bill => bill.status === 'PAID')
      .reduce((total, bill) => total + Number(bill.totalAmount), 0);
  }

  // New billing detail methods
  getPendingBillsCount(): number {
    return this.allBills.filter(bill => bill.status === 'PENDING').length;
  }

  getPaidBillsCount(): number {
    return this.allBills.filter(bill => bill.status === 'PAID').length;
  }

  getOverdueBillsCount(): number {
    return this.allBills.filter(bill => bill.status === 'OVERDUE').length;
  }

  getAveragePendingAmount(): number {
    const pendingBills = this.allBills.filter(bill => bill.status === 'PENDING');
    if (pendingBills.length === 0) return 0;
    return pendingBills.reduce((total, bill) => total + Number(bill.totalAmount), 0) / pendingBills.length;
  }

  getThisMonthPaidAmount(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.allBills
      .filter(bill => {
        if (bill.status !== 'PAID' || !bill.paidDate) return false;
        const paidDate = new Date(bill.paidDate);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((total, bill) => total + Number(bill.totalAmount), 0);
  }

  getTotalRevenue(): number {
    return this.allBills.reduce((total, bill) => total + Number(bill.totalAmount), 0);
  }

  getCollectionRate(): number {
    const totalRevenue = this.getTotalRevenue();
    const paidAmount = this.getTotalPaidAmount();
    if (totalRevenue === 0) return 0;
    return Math.round((paidAmount / totalRevenue) * 100);
  }

  getTotalLateFees(): number {
    return this.allBills.reduce((total, bill) => total + Number(bill.lateFee || 0), 0);
  }

  getTotalOutstanding(): number {
    return this.allBills
      .filter(bill => bill.status === 'PENDING' || bill.status === 'OVERDUE')
      .reduce((total, bill) => total + Number(bill.totalAmount), 0);
  }

  getAverageOutstandingDays(): number {
    const outstandingBills = this.allBills.filter(bill => bill.status === 'PENDING' || bill.status === 'OVERDUE');
    if (outstandingBills.length === 0) return 0;
    
    const now = new Date();
    const totalDays = outstandingBills.reduce((total, bill) => {
      if (!bill.dueDate) return total;
      const dueDate = new Date(bill.dueDate);
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return total + Math.max(0, daysDiff);
    }, 0);
    
    return Math.round(totalDays / outstandingBills.length);
  }

  getBillType(bill: Bill): string {
    if (bill.lateFee && Number(bill.lateFee) > 0) return 'With Late Fee';
    if (bill.damageFee && Number(bill.damageFee) > 0) return 'With Damage Fee';
    if (bill.discount && Number(bill.discount) > 0) return 'Discounted';
    return 'Standard';
  }

  getRentalDays(bill: Bill): number {
    const startDate = new Date(bill.rental.rentalDate);
    const endDate = bill.rental.actualReturnDate ? 
      new Date(bill.rental.actualReturnDate) : 
      new Date(bill.rental.expectedReturnDate);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDaysUntilDue(bill: Bill): number {
    if (!bill.dueDate) return 0;
    const now = new Date();
    const dueDate = new Date(bill.dueDate);
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  viewBillDetails(bill: Bill): void {
    // Implementation for viewing detailed bill information
    console.log('Viewing bill details:', bill);
  }

  markAsPaidFromDashboard(bill: Bill): void {
    // Implementation for marking bill as paid from dashboard
    console.log('Marking bill as paid:', bill);
  }

  showAllBills() {
    this.showBillsDialog = true;
    this.loadAllBills();
  }

  closeBillsDialog() {
    this.showBillsDialog = false;
  }

  loadAllBills() {
    this.billsLoading = true;
    this.billService.getAllBills().subscribe({
      next: (bills) => {
        this.allBills = bills;
        this.billsLoading = false;
      },
      error: (error) => {
        console.error('Error loading all bills:', error);
        this.billsLoading = false;
      }
    });
  }

  printBillFromDashboard(bill: Bill) {
    // Generate the same print content as in the rentals component
    const printContent = this.generateBillPrintContent(bill);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  generateBillPrintContent(bill: Bill): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${bill.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            background: white;
          }
          .bill-container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            border: 2px solid #007A8E;
            border-radius: 8px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 3px solid #007A8E;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #007A8E; 
            font-size: 28px;
            margin: 0;
          }
          .header h2 { 
            color: #016BD1; 
            font-size: 20px;
            margin: 5px 0;
          }
          .bill-info { 
            margin-bottom: 20px; 
            text-align: center;
          }
          .section { 
            margin-bottom: 25px; 
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }
          .section h3 { 
            color: #007A8E; 
            margin-top: 0;
            border-bottom: 1px solid #007A8E;
            padding-bottom: 5px;
          }
          .section p { 
            margin: 8px 0; 
            line-height: 1.4;
          }
          .total { 
            font-size: 18px; 
            font-weight: bold; 
            color: #016BD1;
            text-align: center;
            padding: 15px;
            background: #e8f4f8;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          @media print {
            body { margin: 0; }
            .bill-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <h1>Costume Rental Bill</h1>
            <h2>Bill #${bill.id}</h2>
          </div>
          
          <div class="bill-info">
            <p><strong>Bill Date:</strong> ${new Date(bill.billDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Due Date:</strong> ${bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : 'Not set'}</p>
          </div>

          <div class="section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${bill.rental.customer.firstName}</p>
            <p><strong>Phone:</strong> ${bill.rental.customer.phone}</p>
            ${bill.rental.customer.email ? `<p><strong>Email:</strong> ${bill.rental.customer.email}</p>` : ''}
            ${bill.rental.customer.address ? `<p><strong>Address:</strong> ${bill.rental.customer.address}</p>` : ''}
          </div>

          <div class="section">
            <h3>Rental Details</h3>
            <p><strong>Costume:</strong> ${bill.rental.costume.name}</p>
            <p><strong>Category:</strong> ${bill.rental.costume.category}</p>
            <p><strong>Rental Date:</strong> ${new Date(bill.rental.rentalDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Expected Return Date:</strong> ${new Date(bill.rental.expectedReturnDate).toLocaleDateString('en-IN')}</p>
            ${bill.rental.notes ? `<p><strong>Notes:</strong> ${bill.rental.notes}</p>` : ''}
          </div>

          <div class="section">
            <h3>Bill Summary</h3>
            ${bill.lateFee && bill.lateFee > 0 ? `<p><strong>Late Fee:</strong> ₹${bill.lateFee}</p>` : ''}
            ${bill.damageFee && bill.damageFee > 0 ? `<p><strong>Damage Fee:</strong> ₹${bill.damageFee}</p>` : ''}
            ${bill.discount && bill.discount > 0 ? `<p><strong>Discount:</strong> -₹${bill.discount}</p>` : ''}
            <p><strong>Status:</strong> ${bill.status}</p>
          </div>

          <div class="total">
            <strong>Total Amount: ₹${bill.totalAmount}</strong>
          </div>

          <div class="footer">
            <p>Thank you for choosing our costume rental service!</p>
            <p>Please pay by the due date to avoid late fees.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}