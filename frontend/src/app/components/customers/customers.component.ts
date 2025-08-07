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
import { Customer } from '../../models/customer.model';

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
    <div class="page-header">
      <h1 class="page-title">Customers</h1>
      <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm">
        <mat-icon>add</mat-icon>
        Add Customer
      </button>
    </div>

    <!-- Search Form -->
    <div class="search-form">
      <mat-form-field>
        <mat-label>Search customers</mat-label>
        <input matInput 
               [(ngModel)]="searchTerm" 
               (keyup.enter)="searchCustomers()"
               placeholder="Enter name or email">
      </mat-form-field>
      <button mat-button (click)="searchCustomers()">Search</button>
      <button mat-button (click)="loadCustomers()">Clear</button>
    </div>

    <!-- Add Customer Form -->
    <mat-card *ngIf="showAddForm" class="form-container">
      <mat-card-header>
        <mat-card-title>Add New Customer</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="customerForm" (ngSubmit)="addCustomer()">
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" required>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" required>
            </mat-form-field>
          </div>
          <mat-form-field class="form-field">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
          </mat-form-field>
          <mat-form-field class="form-field">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone">
          </mat-form-field>
          <mat-form-field class="form-field">
            <mat-label>Address</mat-label>
            <textarea matInput formControlName="address" rows="3"></textarea>
          </mat-form-field>
          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="!customerForm.valid">
              Add Customer
            </button>
            <button mat-button type="button" (click)="cancelAdd()">Cancel</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

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
                {{ customer.firstName }} {{ customer.lastName }}
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
                <button mat-icon-button (click)="editCustomer(customer)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteCustomer(customer.id)">
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
  `,
  styles: [`
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .form-field {
      width: 100%;
      margin-bottom: 15px;
    }

    .form-actions {
      margin-top: 20px;
    }

    .form-actions button {
      margin-right: 10px;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
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

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
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
      const customer: Customer = this.customerForm.value;
      this.customerService.createCustomer(customer).subscribe({
        next: (newCustomer) => {
          this.customers.push(newCustomer);
          this.customerForm.reset();
          this.showAddForm = false;
          this.snackBar.open('Customer added successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error adding customer:', error);
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
  }
}