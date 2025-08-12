import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { BillService } from '../../services/bill.service';
import { Bill, BillStatus, PaymentMethod } from '../../models/bill.model';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="billing-header">
      <div class="header-content">
        <h1 class="billing-title">
          <mat-icon>receipt_long</mat-icon>
          Billing Management
        </h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="printAllBills()" class="print-all-btn">
            <mat-icon>print</mat-icon>
            Print Summary
          </button>
          <button mat-stroked-button (click)="exportBills()" class="export-btn">
            <mat-icon>download</mat-icon>
            Export
          </button>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">Total Bills</span>
          <span class="stat-value">{{ filteredBills.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Amount</span>
          <span class="stat-value">₹{{ getTotalFilteredAmount() | number:'1.2-2' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Pending</span>
          <span class="stat-value pending">{{ getPendingCount() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Overdue</span>
          <span class="stat-value overdue">{{ getOverdueCount() }}</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-buttons">
        <button mat-button 
                (click)="filterBills('all')" 
                [class.active]="currentFilter === 'all'"
                class="filter-btn">
          All Bills
        </button>
        <button mat-button 
                (click)="filterBills('pending')"
                [class.active]="currentFilter === 'pending'"
                class="filter-btn">
          Pending
        </button>
        <button mat-button 
                (click)="filterBills('overdue')"
                [class.active]="currentFilter === 'overdue'"
                class="filter-btn">
          Overdue
        </button>
        <button mat-button 
                (click)="filterBills('paid')"
                [class.active]="currentFilter === 'paid'"
                class="filter-btn">
          Paid
        </button>
      </div>
      
      <div class="search-box">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search bills...</mat-label>
          <input matInput (keyup)="applyFilter($event)" placeholder="Customer name or bill ID">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>
    </div>

    <!-- Bills Table -->
    <div class="billing-table-container">
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading bills...</p>
      </div>
      
      <table mat-table [dataSource]="filteredBills" *ngIf="!loading" class="billing-table">
        <!-- Bill ID Column -->
        <ng-container matColumnDef="billId">
          <th mat-header-cell *matHeaderCellDef>Bill #</th>
          <td mat-cell *matCellDef="let bill">
            <div class="bill-id">
              <strong>#{{ bill.id || 'N/A' }}</strong>
              <small>{{ bill.billDate | date:'MMM dd, y' }}</small>
            </div>
          </td>
        </ng-container>

        <!-- Customer Column -->
        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef>Customer</th>
          <td mat-cell *matCellDef="let bill">
            <div class="customer-cell">
              <div class="customer-name">{{ bill.rental.customer.firstName }} {{ bill.rental.customer.lastName }}</div>
              <div class="customer-phone">{{ bill.rental.customer.phone }}</div>
            </div>
          </td>
        </ng-container>

        <!-- Item Details Column -->
        <ng-container matColumnDef="itemDetails">
          <th mat-header-cell *matHeaderCellDef>Item Details</th>
          <td mat-cell *matCellDef="let bill">
            <div class="item-details">
              <div class="item-name">{{ bill.rental.costume.name }}</div>
              <div class="item-meta">
                <span class="category">{{ bill.rental.costume.category }}</span>
                <span class="size">{{ bill.rental.costume.size }}</span>
              </div>
            </div>
          </td>
        </ng-container>

        <!-- Rental Period Column -->
        <ng-container matColumnDef="period">
          <th mat-header-cell *matHeaderCellDef>Rental Period</th>
          <td mat-cell *matCellDef="let bill">
            <div class="rental-period">
              <div class="period-dates">
                <small>{{ bill.rental.rentalDate | date:'MMM dd' }} - {{ bill.rental.expectedReturnDate | date:'MMM dd, y' }}</small>
              </div>
              <div *ngIf="bill.rental.actualReturnDate" class="return-status returned">
                <mat-icon>check_circle</mat-icon>
                Returned {{ bill.rental.actualReturnDate | date:'MMM dd' }}
              </div>
              <div *ngIf="!bill.rental.actualReturnDate && bill.rental.status === 'OVERDUE'" class="return-status overdue">
                <mat-icon>warning</mat-icon>
                Overdue
              </div>
            </div>
          </td>
        </ng-container>

        <!-- Amount Column -->
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Amount</th>
          <td mat-cell *matCellDef="let bill">
            <div class="amount-cell">
              <div class="base-amount">₹{{ bill.rental.costume.sellPrice | number:'1.2-2' }}</div>
              <div *ngIf="bill.lateFee && bill.lateFee > 0" class="fee late">+₹{{ bill.lateFee | number:'1.2-2' }} Late</div>
              <div *ngIf="bill.damageFee && bill.damageFee > 0" class="fee damage">+₹{{ bill.damageFee | number:'1.2-2' }} Damage</div>
              <div *ngIf="bill.discount && bill.discount > 0" class="fee discount">-₹{{ bill.discount | number:'1.2-2' }} Discount</div>
              <div class="total-amount">₹{{ bill.totalAmount | number:'1.2-2' }}</div>
            </div>
          </td>
        </ng-container>

        <!-- Status Column -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let bill">
            <div class="status-cell">
              <span class="status-badge" [ngClass]="bill.status.toLowerCase()">
                {{ bill.status }}
              </span>
              <div *ngIf="bill.paymentMethod" class="payment-method">
                <small>{{ bill.paymentMethod }}</small>
              </div>
            </div>
          </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let bill">
            <div class="action-buttons">
              <button mat-icon-button 
                      *ngIf="bill.status === 'PENDING'" 
                      (click)="showPaymentDialog(bill)"
                      matTooltip="Mark as Paid"
                      class="pay-btn">
                <mat-icon>payment</mat-icon>
              </button>
              <button mat-icon-button 
                      (click)="showFeesDialog(bill)"
                      matTooltip="Edit Fees"
                      class="edit-btn">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button 
                      (click)="viewBillDetails(bill)"
                      matTooltip="View Details"
                      class="view-btn">
                <mat-icon>visibility</mat-icon>
              </button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
            [class.overdue-row]="row.status === 'OVERDUE'"
            [class.paid-row]="row.status === 'PAID'"
            [class.pending-row]="row.status === 'PENDING'"></tr>
      </table>

      <div *ngIf="filteredBills.length === 0 && !loading" class="no-data">
        <mat-icon>receipt</mat-icon>
        <h3>No bills found</h3>
        <p>No bills match your current filter criteria.</p>
      </div>
    </div>

    <!-- Print Template (Hidden) -->
    <div #printTemplate style="display: none;">
      <div class="print-content">
        <div class="print-header">
          <h1>CostumeRental Billing Report</h1>
          <p>Generated on: {{ getCurrentDate() | date:'full' }}</p>
        </div>
        
        <table class="print-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let bill of filteredBills">
              <td>#{{ bill.id || 'N/A' }}</td>
              <td>{{ bill.rental.customer.firstName }} {{ bill.rental.customer.lastName }}</td>
              <td>{{ bill.rental.costume.name }}</td>
              <td>{{ bill.rental.rentalDate | date:'MMM dd' }} - {{ bill.rental.expectedReturnDate | date:'MMM dd, y' }}</td>
              <td>₹{{ bill.totalAmount | number:'1.2-2' }}</td>
              <td>{{ bill.status }}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="print-footer">
          <p>Total Amount: ₹{{ getTotalFilteredAmount() | number:'1.2-2' }}</p>
          <p>Total Bills: {{ filteredBills.length }}</p>
        </div>
      </div>
    </div>

    <!-- Payment Dialog -->
    <div *ngIf="showPaymentForm" class="dialog-overlay" (click)="closePaymentDialog()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h3>Mark Bill as Paid</h3>
        <form [formGroup]="paymentForm" (ngSubmit)="markAsPaid()">
          <mat-form-field class="form-field">
            <mat-label>Payment Method</mat-label>
            <mat-select formControlName="paymentMethod" required>
              <mat-option value="CASH">Cash</mat-option>
              <mat-option value="CREDIT_CARD">Credit Card</mat-option>
              <mat-option value="DEBIT_CARD">Debit Card</mat-option>
              <mat-option value="BANK_TRANSFER">Bank Transfer</mat-option>
              <mat-option value="PAYPAL">PayPal</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="dialog-actions">
            <button mat-button type="button" (click)="closePaymentDialog()">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="!paymentForm.valid">
              Mark as Paid
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Fees Dialog -->
    <div *ngIf="showFeesForm" class="dialog-overlay" (click)="closeFeesDialog()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h3>Edit Additional Fees</h3>
        <form [formGroup]="feesForm" (ngSubmit)="updateFees()">
          <mat-form-field class="form-field">
            <mat-label>Damage Fee</mat-label>
            <input matInput type="number" step="0.01" formControlName="damageFee">
            <span matPrefix>$</span>
          </mat-form-field>
          <mat-form-field class="form-field">
            <mat-label>Discount</mat-label>
            <input matInput type="number" step="0.01" formControlName="discount">
            <span matPrefix>$</span>
          </mat-form-field>
          <mat-form-field class="form-field">
            <mat-label>Notes</mat-label>
            <textarea matInput formControlName="notes" rows="3"></textarea>
          </mat-form-field>
          <div class="dialog-actions">
            <button mat-button type="button" (click)="closeFeesDialog()">Cancel</button>
            <button mat-raised-button color="primary" type="submit">
              Update Fees
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Billing Header Styles */
    .billing-header {
      background: linear-gradient(135deg, #007A8E 0%, #016BD1 100%);
      color: white;
      padding: 24px;
      margin: -24px -24px 30px -24px;
      border-radius: 8px 8px 0 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .billing-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.8em;
      font-weight: 600;
    }

    .billing-title mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .print-all-btn,
    .export-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Summary Stats */
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 8px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 0.9em;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .stat-value {
      display: block;
      font-size: 1.8em;
      font-weight: 700;
    }

    .stat-value.pending {
      color: #FDF958;
    }

    .stat-value.overdue {
      color: #ffcdd2;
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px 24px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .filter-buttons {
      display: flex;
      gap: 8px;
    }

    .filter-btn {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 500;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .filter-btn.active {
      background-color: #007A8E;
      color: white;
    }

    .filter-btn:not(.active) {
      color: #007A8E;
      border-color: #007A8E;
    }

    .filter-btn:hover:not(.active) {
      background-color: rgba(0, 122, 142, 0.1);
    }

    .search-box {
      width: 300px;
    }

    .search-field {
      width: 100%;
    }

    /* Bills Table Container */
    .billing-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .billing-table {
      width: 100%;
    }

    .mat-mdc-header-row {
      background: #f8f9fa;
      border-bottom: 2px solid #007A8E;
    }

    .mat-mdc-header-cell {
      color: #007A8E !important;
      font-weight: 600;
      font-size: 0.95em;
      padding: 16px 12px;
      border-bottom: none;
    }

    .mat-mdc-cell {
      padding: 16px 12px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }

    .mat-mdc-row {
      transition: background-color 0.2s ease;
    }

    .mat-mdc-row:hover {
      background-color: #f8f9fa;
    }

    /* Row Status Colors */
    .pending-row {
      border-left: 4px solid #FDF958;
    }

    .overdue-row {
      background-color: rgba(244, 67, 54, 0.03);
      border-left: 4px solid #f44336;
    }

    .paid-row {
      background-color: rgba(76, 175, 80, 0.03);
      border-left: 4px solid #4caf50;
    }

    /* Cell Styles */
    .bill-id {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bill-id strong {
      color: #007A8E;
      font-weight: 600;
    }

    .bill-id small {
      color: #666;
      font-size: 0.85em;
    }

    .customer-cell {
      min-width: 160px;
    }

    .customer-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .customer-phone {
      color: #666;
      font-size: 0.9em;
    }

    .item-details {
      min-width: 180px;
    }

    .item-name {
      font-weight: 600;
      color: #016BD1;
      margin-bottom: 6px;
    }

    .item-meta {
      display: flex;
      gap: 12px;
      font-size: 0.9em;
    }

    .category {
      background: #00B2A9;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
    }

    .size {
      color: #666;
      font-weight: 500;
    }

    .rental-period {
      min-width: 140px;
    }

    .period-dates {
      margin-bottom: 6px;
      color: #666;
    }

    .return-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85em;
      font-weight: 500;
    }

    .return-status.returned {
      color: #4caf50;
    }

    .return-status.overdue {
      color: #f44336;
    }

    .return-status mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .amount-cell {
      min-width: 120px;
      text-align: right;
    }

    .base-amount {
      color: #666;
      margin-bottom: 4px;
    }

    .fee {
      font-size: 0.85em;
      margin-bottom: 2px;
    }

    .fee.late,
    .fee.damage {
      color: #f44336;
    }

    .fee.discount {
      color: #4caf50;
    }

    .total-amount {
      font-weight: 700;
      font-size: 1.1em;
      color: #007A8E;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #eee;
    }

    .status-cell {
      min-width: 100px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.85em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.pending {
      background: #FDF958;
      color: #333;
    }

    .status-badge.paid {
      background: #4caf50;
      color: white;
    }

    .status-badge.overdue {
      background: #f44336;
      color: white;
    }

    .status-badge.cancelled {
      background: #9e9e9e;
      color: white;
    }

    .payment-method {
      margin-top: 4px;
      color: #666;
      font-style: italic;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .action-buttons .mat-mdc-icon-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }

    .pay-btn {
      color: #4caf50;
    }

    .edit-btn {
      color: #ff9800;
    }

    .view-btn {
      color: #2196f3;
    }

    /* Loading and No Data */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #666;
    }

    .loading-container p {
      margin-top: 16px;
      font-size: 1.1em;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #007A8E;
      margin-bottom: 16px;
    }

    .no-data h3 {
      color: #007A8E;
      margin: 0 0 8px 0;
      font-size: 1.5em;
    }

    .no-data p {
      margin: 0;
      font-size: 1.1em;
    }

    /* Dialog Styles */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .dialog-content {
      background: white;
      padding: 24px;
      border-radius: 12px;
      min-width: 400px;
      max-width: 90vw;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .dialog-content h3 {
      margin-top: 0;
      color: #007A8E;
      border-bottom: 2px solid #007A8E;
      padding-bottom: 12px;
    }

    .form-field {
      width: 100%;
      margin-bottom: 15px;
    }

    .dialog-actions {
      margin-top: 20px;
      text-align: right;
    }

    .dialog-actions button {
      margin-left: 10px;
    }

    /* Print Styles (Hidden) */
    .print-content {
      display: none;
    }

    @media print {
      .print-content {
        display: block !important;
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .billing-header {
        margin: -16px -16px 20px -16px;
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }

      .filter-bar {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .search-box {
        width: 100%;
      }

      .summary-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .mat-mdc-cell,
      .mat-mdc-header-cell {
        padding: 8px 6px;
        font-size: 0.85em;
      }
    }
  `]
})
export class BillsComponent implements OnInit {
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  loading = false;
  currentFilter = 'all';
  showPaymentForm = false;
  showFeesForm = false;
  selectedBill: Bill | null = null;
  displayedColumns: string[] = ['billId', 'customer', 'itemDetails', 'period', 'amount', 'status', 'actions'];
  
  paymentForm: FormGroup;
  feesForm: FormGroup;

  constructor(
    private billService: BillService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['', Validators.required]
    });

    this.feesForm = this.fb.group({
      damageFee: [0],
      discount: [0],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadBills();
  }

  loadBills() {
    this.loading = true;
    this.billService.getAllBills().subscribe({
      next: (bills) => {
        this.bills = bills;
        this.filterBills(this.currentFilter);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bills:', error);
        this.loading = false;
        this.snackBar.open('Error loading bills', 'Close', { duration: 3000 });
      }
    });
  }

  filterBills(filter: string) {
    this.currentFilter = filter;
    
    switch (filter) {
      case 'pending':
        this.filteredBills = this.bills.filter(b => b.status === BillStatus.PENDING);
        break;
      case 'overdue':
        this.filteredBills = this.bills.filter(b => b.status === BillStatus.OVERDUE);
        break;
      case 'paid':
        this.filteredBills = this.bills.filter(b => b.status === BillStatus.PAID);
        break;
      default:
        this.filteredBills = this.bills;
    }
  }

  getTotalAmount(status: string): number {
    return this.bills
      .filter(bill => bill.status === status)
      .reduce((total, bill) => total + bill.totalAmount, 0);
  }

  getTotalFilteredAmount(): number {
    return this.filteredBills.reduce((total, bill) => total + bill.totalAmount, 0);
  }

  getPendingCount(): number {
    return this.filteredBills.filter(bill => bill.status === 'PENDING').length;
  }

  getOverdueCount(): number {
    return this.filteredBills.filter(bill => bill.status === 'OVERDUE').length;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.trim()) {
      this.filteredBills = this.bills.filter(bill => 
        bill.rental.customer.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
        bill.rental.customer.lastName.toLowerCase().includes(filterValue.toLowerCase()) ||
        bill.rental.customer.phone.includes(filterValue) ||
        (bill.id && bill.id.toString().includes(filterValue))
      );
    } else {
      this.filterBills(this.currentFilter);
    }
  }

  getCurrentDate(): Date {
    return new Date();
  }

  printAllBills(): void {
    const printContent = this.generateAllBillsPrint();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  exportBills(): void {
    // TODO: Implement CSV/Excel export functionality
    this.snackBar.open('Export functionality coming soon', 'Close', { duration: 3000 });
  }

  private generateAllBillsPrint(): string {
    const totalAmount = this.getTotalFilteredAmount();
    const billsHtml = this.filteredBills.map(bill => `
      <tr>
        <td>#${bill.id || 'N/A'}</td>
        <td>${bill.rental.customer.firstName} ${bill.rental.customer.lastName}</td>
        <td>${bill.rental.costume.name}</td>
        <td>${new Date(bill.rental.rentalDate).toLocaleDateString()} - ${new Date(bill.rental.expectedReturnDate).toLocaleDateString()}</td>
        <td>₹${bill.totalAmount.toFixed(2)}</td>
        <td>${bill.status}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>All Bills Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007A8E; padding-bottom: 20px; }
          .report-header h1 { color: #007A8E; margin: 0; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 30px; background: #f5f5f5; padding: 20px; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 1.5em; font-weight: bold; color: #007A8E; }
          .bills-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .bills-table th, .bills-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .bills-table th { background-color: #007A8E; color: white; }
          .bills-table tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>CostumeRental - All Bills Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <div>Total Bills</div>
            <div class="summary-value">${this.filteredBills.length}</div>
          </div>
          <div class="summary-item">
            <div>Total Amount</div>
            <div class="summary-value">₹${totalAmount.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div>Pending</div>
            <div class="summary-value">${this.getPendingCount()}</div>
          </div>
          <div class="summary-item">
            <div>Overdue</div>
            <div class="summary-value">${this.getOverdueCount()}</div>
          </div>
        </div>
        
        <table class="bills-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Rental Period</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${billsHtml}
          </tbody>
        </table>
        
        <div class="footer">
          <p>CostumeRental Billing System</p>
        </div>
      </body>
      </html>
    `;
  }

  showPaymentDialog(bill: Bill) {
    this.selectedBill = bill;
    this.showPaymentForm = true;
  }

  closePaymentDialog() {
    this.showPaymentForm = false;
    this.selectedBill = null;
    this.paymentForm.reset();
  }

  markAsPaid() {
    if (this.paymentForm.valid && this.selectedBill) {
      const paymentMethod = this.paymentForm.value.paymentMethod as PaymentMethod;
      
      this.billService.markBillAsPaid(this.selectedBill.id!, paymentMethod).subscribe({
        next: (updatedBill) => {
          const index = this.bills.findIndex(b => b.id === this.selectedBill!.id);
          if (index !== -1) {
            this.bills[index] = updatedBill;
            this.filterBills(this.currentFilter);
          }
          this.closePaymentDialog();
          this.snackBar.open('Bill marked as paid successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error marking bill as paid:', error);
          this.snackBar.open('Error marking bill as paid', 'Close', { duration: 3000 });
        }
      });
    }
  }

  showFeesDialog(bill: Bill) {
    this.selectedBill = bill;
    this.feesForm.patchValue({
      damageFee: bill.damageFee || 0,
      discount: bill.discount || 0,
      notes: bill.notes || ''
    });
    this.showFeesForm = true;
  }

  closeFeesDialog() {
    this.showFeesForm = false;
    this.selectedBill = null;
    this.feesForm.reset();
  }

  updateFees() {
    if (this.selectedBill) {
      const request = this.feesForm.value;
      
      this.billService.updateBillWithFees(this.selectedBill.id!, request).subscribe({
        next: (updatedBill) => {
          const index = this.bills.findIndex(b => b.id === this.selectedBill!.id);
          if (index !== -1) {
            this.bills[index] = updatedBill;
            this.filterBills(this.currentFilter);
          }
          this.closeFeesDialog();
          this.snackBar.open('Bill fees updated successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error updating bill fees:', error);
          this.snackBar.open('Error updating bill fees', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewBillDetails(bill: Bill) {
    // TODO: Implement bill details view
    this.snackBar.open('Bill details view coming soon', 'Close', { duration: 3000 });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'PAID': return 'status-paid';
      case 'OVERDUE': return 'status-overdue';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  getRentalStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'rental-active';
      case 'RETURNED': return 'rental-returned';
      case 'OVERDUE': return 'rental-overdue';
      case 'CANCELLED': return 'rental-cancelled';
      default: return '';
    }
  }
}