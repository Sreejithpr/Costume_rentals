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
    <div class="page-header">
      <h1 class="page-title">Bills & Payments</h1>
    </div>

    <!-- Filter Buttons -->
    <div class="action-buttons">
      <button mat-button (click)="filterBills('all')" 
              [class.active]="currentFilter === 'all'">
        All Bills
      </button>
      <button mat-button (click)="filterBills('pending')"
              [class.active]="currentFilter === 'pending'">
        Pending
      </button>
      <button mat-button (click)="filterBills('overdue')"
              [class.active]="currentFilter === 'overdue'">
        Overdue
      </button>
      <button mat-button (click)="filterBills('paid')"
              [class.active]="currentFilter === 'paid'">
        Paid
      </button>
    </div>

    <!-- Bills Summary -->
    <div class="summary-cards" *ngIf="!loading">
      <mat-card class="summary-card">
        <mat-card-content>
          <h3>Total Pending</h3>
          <p class="amount">\${{ getTotalAmount('PENDING') | number:'1.2-2' }}</p>
        </mat-card-content>
      </mat-card>
      <mat-card class="summary-card">
        <mat-card-content>
          <h3>Total Overdue</h3>
          <p class="amount overdue">\${{ getTotalAmount('OVERDUE') | number:'1.2-2' }}</p>
        </mat-card-content>
      </mat-card>
      <mat-card class="summary-card">
        <mat-card-content>
          <h3>Total Paid</h3>
          <p class="amount paid">\${{ getTotalAmount('PAID') | number:'1.2-2' }}</p>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Bills Table -->
    <div class="table-container">
      <mat-card>
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
          
          <table mat-table [dataSource]="filteredBills" *ngIf="!loading">
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let bill">
                {{ bill.rental.customer.firstName }} {{ bill.rental.customer.lastName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="costume">
              <th mat-header-cell *matHeaderCellDef>Costume</th>
              <td mat-cell *matCellDef="let bill">{{ bill.rental.costume.name }}</td>
            </ng-container>

            <ng-container matColumnDef="billDate">
              <th mat-header-cell *matHeaderCellDef>Bill Date</th>
              <td mat-cell *matCellDef="let bill">{{ bill.billDate | date }}</td>
            </ng-container>

            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let bill">
                {{ bill.dueDate ? (bill.dueDate | date) : '-' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Total Amount</th>
              <td mat-cell *matCellDef="let bill">
                <span class="currency">\${{ bill.totalAmount | number:'1.2-2' }}</span>
                <div *ngIf="bill.lateFee && bill.lateFee > 0" class="fee-detail">
                  <small class="late-fee">Late Fee: \${{ bill.lateFee | number:'1.2-2' }}</small>
                </div>
                <div *ngIf="bill.damageFee && bill.damageFee > 0" class="fee-detail">
                  <small class="damage-fee">Damage Fee: \${{ bill.damageFee | number:'1.2-2' }}</small>
                </div>
                <div *ngIf="bill.discount && bill.discount > 0" class="fee-detail">
                  <small class="discount">Discount: -\${{ bill.discount | number:'1.2-2' }}</small>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let bill">
                <mat-chip-set>
                  <mat-chip [class]="getStatusClass(bill.status)">
                    {{ bill.status }}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="paymentMethod">
              <th mat-header-cell *matHeaderCellDef>Payment Method</th>
              <td mat-cell *matCellDef="let bill">
                {{ bill.paymentMethod || '-' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let bill">
                <button mat-icon-button 
                        *ngIf="bill.status === 'PENDING'" 
                        (click)="showPaymentDialog(bill)"
                        matTooltip="Mark as Paid">
                  <mat-icon>payment</mat-icon>
                </button>
                <button mat-icon-button 
                        (click)="showFeesDialog(bill)"
                        matTooltip="Edit Fees">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button 
                        (click)="viewBillDetails(bill)"
                        matTooltip="View Details">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="filteredBills.length === 0 && !loading" class="no-data">
            No bills found
          </div>
        </mat-card-content>
      </mat-card>
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
    .action-buttons button.active {
      background-color: #3f51b5;
      color: white;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      text-align: center;
    }

    .summary-card h3 {
      margin-bottom: 10px;
      color: #666;
    }

    .amount {
      font-size: 1.5em;
      font-weight: bold;
      color: #3f51b5;
      margin: 0;
    }

    .amount.overdue {
      color: #c62828;
    }

    .amount.paid {
      color: #2e7d32;
    }

    .fee-detail {
      margin-top: 2px;
    }

    .late-fee,
    .damage-fee {
      color: #c62828;
    }

    .discount {
      color: #2e7d32;
    }

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
      border-radius: 8px;
      min-width: 400px;
      max-width: 90vw;
    }

    .dialog-content h3 {
      margin-top: 0;
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

    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
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
  displayedColumns: string[] = ['customer', 'costume', 'billDate', 'dueDate', 'amount', 'status', 'paymentMethod', 'actions'];
  
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
}