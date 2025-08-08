import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { CustomerService } from '../../services/customer.service';
import { RentalService } from '../../services/rental.service';
import { Customer } from '../../models/customer.model';
import { Rental } from '../../models/rental.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="customers-container fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Customers</h1>
          <p class="page-subtitle">Manage your customer database</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm" class="add-btn">
            <mat-icon>{{ showAddForm ? 'close' : 'person_add' }}</mat-icon>
            {{ showAddForm ? 'Cancel' : 'Add Customer' }}
          </button>
        </div>
      </div>

      <!-- Search Section -->
      <div class="search-form slide-up">
        <div class="search-input-container">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search customers</mat-label>
            <input matInput 
                   [(ngModel)]="searchTerm" 
                   (keyup.enter)="searchCustomers()"
                   placeholder="Enter name or email">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="searchCustomers()" class="search-btn">
            <mat-icon>search</mat-icon>
            Search
          </button>
          <button mat-stroked-button (click)="loadCustomers()" class="clear-btn">
            <mat-icon>clear</mat-icon>
            Clear
          </button>
        </div>
        <div class="search-stats" *ngIf="customers.length > 0">
          <span class="result-count">{{ customers.length }} customer{{ customers.length !== 1 ? 's' : '' }} found</span>
        </div>
      </div>

      <!-- Add Customer Form -->
      <div *ngIf="showAddForm" class="form-section slide-up">
        <div class="modern-card">
          <div class="card-header">
            <h3 class="card-title">
              <mat-icon>person_add</mat-icon>
              Add New Customer
            </h3>
          </div>
          <div class="card-content">
            <form [formGroup]="customerForm" (ngSubmit)="addCustomer()" class="modern-form">
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" required>
                  <mat-icon matSuffix>person</mat-icon>
                </mat-form-field>

              </div>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Email Address</mat-label>
                  <input matInput type="email" formControlName="email">
                  <mat-icon matSuffix>email</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Phone Number</mat-label>
                  <input matInput formControlName="phone">
                  <mat-icon matSuffix>phone</mat-icon>
                </mat-form-field>
              </div>
              
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Address</mat-label>
                <textarea matInput formControlName="address" rows="3" placeholder="Enter full address"></textarea>
                <mat-icon matSuffix>home</mat-icon>
              </mat-form-field>
              
              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="!customerForm.valid || loading" class="submit-btn">
                  <mat-spinner diameter="16" *ngIf="loading"></mat-spinner>
                  <mat-icon *ngIf="!loading">add</mat-icon>
                  {{ loading ? 'Adding...' : 'Add Customer' }}
                </button>
                <button mat-stroked-button type="button" (click)="cancelAdd()" [disabled]="loading" class="cancel-btn">
                  <mat-icon>close</mat-icon>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- Customers Table -->
    <div class="table-container">
      <mat-card>
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
          
          <table mat-table [dataSource]="customers" *ngIf="!loading">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let customer">
                {{ customer.firstName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let customer">{{ customer.email }}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Phone</th>
              <td mat-cell *matCellDef="let customer">{{ customer.phone }}</td>
            </ng-container>

            <ng-container matColumnDef="address">
              <th mat-header-cell *matHeaderCellDef>Address</th>
              <td mat-cell *matCellDef="let customer">{{ customer.address }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let customer">
                <button mat-icon-button (click)="viewCustomerRentals(customer)" matTooltip="View Rental History" class="action-btn">
                  <mat-icon>history</mat-icon>
                </button>
                <button mat-icon-button (click)="editCustomer(customer)" matTooltip="Edit Customer" class="action-btn edit-btn">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteCustomer(customer.id)" matTooltip="Delete Customer" class="action-btn delete-btn">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="customers.length === 0 && !loading" class="no-data">
            No customers found
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Customer Rental History -->
    <div *ngIf="selectedCustomerForRentals" class="rental-history-container slide-up">
      <mat-card>
        <mat-card-header>
          <div class="customer-header">
            <div class="customer-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <div class="customer-info">
              <h2 class="customer-name">{{ selectedCustomerForRentals.firstName }}</h2>
              <p class="customer-details">{{ selectedCustomerForRentals.phone }} • {{ selectedCustomerForRentals.email }}</p>
            </div>
            <button mat-icon-button (click)="closeRentalHistory()" class="close-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="rental-stats" *ngIf="customerRentals.length > 0">
            <div class="stat-item">
              <span class="stat-number">{{ customerRentals.length }}</span>
              <span class="stat-label">Total Rentals</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ getActiveRentalsCount() }}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ getCompletedRentalsCount() }}</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">₹{{ getTotalSpent() }}</span>
              <span class="stat-label">Total Spent</span>
            </div>
          </div>

          <div *ngIf="loadingRentals" class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading rental history...</p>
          </div>

          <div *ngIf="customerRentals.length > 0 && !loadingRentals" class="rentals-table">
            <h3>Rental History</h3>
            <table mat-table [dataSource]="customerRentals">
              <ng-container matColumnDef="costume">
                <th mat-header-cell *matHeaderCellDef>Costume</th>
                <td mat-cell *matCellDef="let rental">{{ rental.costume.name }}</td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let rental">{{ rental.costume.category }}</td>
              </ng-container>

              <ng-container matColumnDef="rentalDate">
                <th mat-header-cell *matHeaderCellDef>Rental Date</th>
                <td mat-cell *matCellDef="let rental">{{ rental.rentalDate | date }}</td>
              </ng-container>

              <ng-container matColumnDef="expectedReturn">
                <th mat-header-cell *matHeaderCellDef>Expected Return</th>
                <td mat-cell *matCellDef="let rental">{{ rental.expectedReturnDate | date }}</td>
              </ng-container>

              <ng-container matColumnDef="actualReturn">
                <th mat-header-cell *matHeaderCellDef>Actual Return</th>
                <td mat-cell *matCellDef="let rental">
                  {{ rental.actualReturnDate ? (rental.actualReturnDate | date) : '-' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let rental">
                  <span class="status-chip" [class]="'status-' + rental.status.toLowerCase()">
                    {{ rental.status }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Sell Price</th>
                <td mat-cell *matCellDef="let rental">₹{{ rental.costume.sellPrice }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="rentalColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: rentalColumns;"></tr>
            </table>
          </div>

          <div *ngIf="customerRentals.length === 0 && !loadingRentals" class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <h3>No Rental History</h3>
            <p>This customer hasn't rented any costumes yet.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .customers-container {
      padding: var(--space-6);
    }

    .search-form {
      margin-bottom: var(--space-8);
    }

    .search-input-container {
      display: flex;
      gap: var(--space-4);
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .search-field {
      flex: 1;
      max-width: 400px;
    }

    .search-btn,
    .clear-btn {
      height: 56px;
    }

    .search-stats {
      padding: var(--space-2) var(--space-4);
      background: linear-gradient(135deg, var(--info-color), var(--secondary-color));
      color: white;
      border-radius: var(--radius-base);
      font-size: var(--font-size-sm);
      display: inline-block;
    }

    .result-count {
      font-weight: 600;
    }

    .form-section {
      margin-bottom: var(--space-8);
    }

    .modern-form {
      margin-top: var(--space-6);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .form-field {
      width: 100%;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-actions {
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 1px solid var(--gray-200);
      display: flex;
      gap: var(--space-4);
      justify-content: flex-end;
    }

    .submit-btn {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
      color: white !important;
      box-shadow: var(--shadow-md) !important;
      transition: all 0.2s ease !important;
    }

    .submit-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: var(--shadow-lg) !important;
    }

    .cancel-btn {
      border-color: var(--border-color) !important;
      color: var(--text-secondary) !important;
    }

    .add-btn {
      background: linear-gradient(135deg, var(--accent-purple), var(--secondary-color)) !important;
      color: white !important;
      box-shadow: var(--shadow-md) !important;
      transition: all 0.2s ease !important;
    }

    .add-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: var(--shadow-lg) !important;
    }

    .customers-table {
      background: var(--background-primary) !important;
      border-radius: var(--radius-lg) !important;
      overflow: hidden !important;
      box-shadow: var(--shadow-base) !important;
      border: 1px solid var(--border-color) !important;
    }

    .table-header {
      background: var(--background-tertiary) !important;
      font-weight: 600 !important;
      color: var(--text-secondary) !important;
      text-transform: uppercase !important;
      font-size: var(--font-size-xs) !important;
      letter-spacing: 0.05em !important;
    }

    .table-row {
      transition: all 0.2s ease !important;
      border-bottom: 1px solid var(--border-color) !important;
      color: var(--text-primary) !important;
    }

    .table-row:hover {
      background: var(--background-tertiary) !important;
    }

    .action-btn {
      margin-right: var(--space-2) !important;
    }

    .edit-btn {
      color: var(--primary-color) !important;
    }

    .delete-btn {
      color: var(--error-color) !important;
    }

    .customer-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-base);
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      margin-right: var(--space-3);
    }

    .customer-info {
      display: flex;
      align-items: center;
    }

    .customer-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .customer-email {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-16);
      color: var(--text-muted);
    }

    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: var(--space-4);
      color: var(--text-muted);
    }

    .empty-state h3 {
      margin-bottom: var(--space-2);
      color: var(--text-secondary);
    }

    .empty-state p {
      margin-bottom: var(--space-6);
      font-size: var(--font-size-lg);
      color: var(--text-secondary);
    }

    /* Rental History Styles */
    .rental-history-container {
      margin-top: var(--space-6);
    }

    .customer-header {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
    }

    .customer-header .customer-avatar {
      width: 60px;
      height: 60px;
      font-size: 24px;
    }

    .customer-header .customer-info {
      flex: 1;
      margin-left: var(--space-4);
    }

    .customer-header .customer-name {
      margin: 0;
      font-size: var(--font-size-xl);
      color: var(--text-primary);
    }

    .customer-header .customer-details {
      margin: var(--space-1) 0 0 0;
      color: var(--text-secondary);
    }

    .close-btn {
      position: absolute;
      top: 0;
      right: 0;
    }

    .rental-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-item {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      text-align: center;
      box-shadow: var(--shadow-md);
    }

    .stat-number {
      display: block;
      font-size: var(--font-size-2xl);
      font-weight: 700;
      margin-bottom: var(--space-1);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rentals-table h3 {
      margin-bottom: var(--space-4);
      color: var(--text-primary);
      font-size: var(--font-size-lg);
    }

    .status-chip {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-xl);
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-active {
      background: linear-gradient(135deg, var(--success-color), #4ade80);
      color: white;
    }

    .status-returned {
      background: linear-gradient(135deg, var(--info-color), #60a5fa);
      color: white;
    }

    .status-overdue {
      background: linear-gradient(135deg, var(--warning-color), #fbbf24);
      color: white;
    }

    .status-cancelled {
      background: linear-gradient(135deg, var(--error-color), #f87171);
      color: white;
    }

    @media (max-width: 768px) {
      .customers-container {
        padding: var(--space-4);
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .search-input-container {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-field {
        max-width: none;
      }
      
      .form-actions {
        flex-direction: column;
      }

      .rental-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-3);
      }

      .customer-header .customer-avatar {
        width: 50px;
        height: 50px;
        font-size: 20px;
      }

      .customer-header .customer-name {
        font-size: var(--font-size-lg);
      }
    }
  `]
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  showAddForm = false;
  searchTerm = '';
  displayedColumns: string[] = ['name', 'email', 'phone', 'address', 'actions'];
  customerForm: FormGroup;
  
  // Rental history properties
  selectedCustomerForRentals: Customer | null = null;
  customerRentals: Rental[] = [];
  loadingRentals = false;
  rentalColumns: string[] = ['costume', 'category', 'rentalDate', 'expectedReturn', 'actualReturn', 'status', 'price'];

  constructor(
    private customerService: CustomerService,
    private rentalService: RentalService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: [''],
      address: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading = false;
        this.snackBar.open('Error loading customers', 'Close', { duration: 3000 });
      }
    });
  }

  searchCustomers() {
    if (!this.searchTerm.trim()) {
      this.loadCustomers();
      return;
    }

    this.loading = true;
    this.customerService.searchCustomers(this.searchTerm).subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching customers:', error);
        this.loading = false;
        this.snackBar.open('Error searching customers', 'Close', { duration: 3000 });
      }
    });
  }

  addCustomer() {
    if (this.customerForm.valid) {
      this.loading = true;
      const customer: Customer = this.customerForm.value;
      this.customerService.createCustomer(customer).subscribe({
        next: (newCustomer) => {
          this.customers.push(newCustomer);
          this.customerForm.reset();
          this.showAddForm = false;
          this.loading = false;
          this.snackBar.open('Customer added successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error adding customer:', error);
          this.loading = false;
          this.showAddForm = false; // Close form even on error
          this.snackBar.open('Error adding customer', 'Close', { duration: 3000 });
        }
      });
    }
  }

  editCustomer(customer: Customer) {
    // TODO: Implement edit functionality
    this.snackBar.open('Edit functionality coming soon', 'Close', { duration: 3000 });
  }

  deleteCustomer(customerId: number) {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(customerId).subscribe({
        next: () => {
          this.customers = this.customers.filter(c => c.id !== customerId);
          this.snackBar.open('Customer deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.snackBar.open('Error deleting customer', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelAdd() {
    this.showAddForm = false;
    this.customerForm.reset();
    this.loading = false; // Ensure loading state is reset
  }

  // Rental history methods
  viewCustomerRentals(customer: Customer) {
    this.selectedCustomerForRentals = customer;
    this.loadCustomerRentals(customer.id!);
  }

  loadCustomerRentals(customerId: number) {
    this.loadingRentals = true;
    this.customerRentals = [];
    
    this.rentalService.getRentalsByCustomer(customerId).subscribe({
      next: (rentals) => {
        this.customerRentals = rentals;
        this.loadingRentals = false;
      },
      error: (error) => {
        console.error('Error loading customer rentals:', error);
        this.loadingRentals = false;
        this.snackBar.open('Error loading rental history', 'Close', { duration: 3000 });
      }
    });
  }

  closeRentalHistory() {
    this.selectedCustomerForRentals = null;
    this.customerRentals = [];
  }

  getActiveRentalsCount(): number {
    return this.customerRentals.filter(rental => rental.status === 'ACTIVE').length;
  }

  getCompletedRentalsCount(): number {
    return this.customerRentals.filter(rental => rental.status === 'RETURNED').length;
  }

  getTotalSpent(): number {
    return this.customerRentals.reduce((total, rental) => {
      if (rental.actualReturnDate && rental.rentalDate) {
        const rentalDays = Math.ceil((new Date(rental.actualReturnDate).getTime() - new Date(rental.rentalDate).getTime()) / (1000 * 60 * 60 * 24));
        return total + (rental.costume.sellPrice * Math.max(1, rentalDays));
      } else if (!rental.actualReturnDate && rental.rentalDate && rental.expectedReturnDate) {
        const expectedDays = Math.ceil((new Date(rental.expectedReturnDate).getTime() - new Date(rental.rentalDate).getTime()) / (1000 * 60 * 60 * 24));
        return total + (rental.costume.sellPrice * Math.max(1, expectedDays));
      }
      return total + rental.costume.sellPrice; // Default to one day
    }, 0);
  }
}