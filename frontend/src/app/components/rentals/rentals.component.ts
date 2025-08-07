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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { CostumeService } from '../../services/costume.service';
import { Rental, RentalStatus, CreateRentalRequest } from '../../models/rental.model';
import { Customer } from '../../models/customer.model';
import { Costume } from '../../models/costume.model';

@Component({
  selector: 'app-rentals',
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
    MatDatepickerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Rentals</h1>
      <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm">
        <mat-icon>add</mat-icon>
        New Rental
      </button>
    </div>

    <!-- Filter Buttons -->
    <div class="action-buttons">
      <button mat-button (click)="filterRentals('all')" 
              [class.active]="currentFilter === 'all'">
        All Rentals
      </button>
      <button mat-button (click)="filterRentals('active')"
              [class.active]="currentFilter === 'active'">
        Active
      </button>
      <button mat-button (click)="filterRentals('overdue')"
              [class.active]="currentFilter === 'overdue'">
        Overdue
      </button>
      <button mat-button (click)="filterRentals('returned')"
              [class.active]="currentFilter === 'returned'">
        Returned
      </button>
    </div>

    <!-- Add Rental Form -->
    <mat-card *ngIf="showAddForm" class="form-container">
      <mat-card-header>
        <mat-card-title>New Rental</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="rentalForm" (ngSubmit)="createRental()">
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>Customer</mat-label>
              <mat-select formControlName="customerId" required>
                <mat-option *ngFor="let customer of customers" [value]="customer.id">
                  {{ customer.firstName }} {{ customer.lastName }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Costume</mat-label>
              <mat-select formControlName="costumeId" required>
                <mat-option *ngFor="let costume of availableCostumes" [value]="costume.id">
                  {{ costume.name }} ({{ costume.size }}) - \${{ costume.dailyRentalPrice }}/day
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>Rental Date</mat-label>
              <input matInput [matDatepicker]="rentalPicker" formControlName="rentalDate" required>
              <mat-datepicker-toggle matSuffix [for]="rentalPicker"></mat-datepicker-toggle>
              <mat-datepicker #rentalPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Expected Return Date</mat-label>
              <input matInput [matDatepicker]="returnPicker" formControlName="expectedReturnDate" required>
              <mat-datepicker-toggle matSuffix [for]="returnPicker"></mat-datepicker-toggle>
              <mat-datepicker #returnPicker></mat-datepicker>
            </mat-form-field>
          </div>
          <mat-form-field class="form-field">
            <mat-label>Notes</mat-label>
            <textarea matInput formControlName="notes" rows="3"></textarea>
          </mat-form-field>
          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="!rentalForm.valid">
              Create Rental
            </button>
            <button mat-button type="button" (click)="cancelAdd()">Cancel</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Rentals Table -->
    <div class="table-container">
      <mat-card>
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
          
          <table mat-table [dataSource]="filteredRentals" *ngIf="!loading">
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let rental">
                {{ rental.customer.firstName }} {{ rental.customer.lastName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="costume">
              <th mat-header-cell *matHeaderCellDef>Costume</th>
              <td mat-cell *matCellDef="let rental">{{ rental.costume.name }}</td>
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
                <mat-chip-set>
                  <mat-chip [class]="getStatusClass(rental.status)">
                    {{ rental.status }}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let rental">
                <button mat-icon-button 
                        *ngIf="rental.status === 'ACTIVE'" 
                        (click)="returnCostume(rental)"
                        matTooltip="Return Costume">
                  <mat-icon>assignment_return</mat-icon>
                </button>
                <button mat-icon-button 
                        *ngIf="rental.status === 'ACTIVE'" 
                        (click)="cancelRental(rental)"
                        matTooltip="Cancel Rental"
                        color="warn">
                  <mat-icon>cancel</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="filteredRentals.length === 0 && !loading" class="no-data">
            No rentals found
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .action-buttons button.active {
      background-color: #3f51b5;
      color: white;
    }

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
export class RentalsComponent implements OnInit {
  rentals: Rental[] = [];
  filteredRentals: Rental[] = [];
  customers: Customer[] = [];
  availableCostumes: Costume[] = [];
  loading = false;
  showAddForm = false;
  currentFilter = 'all';
  displayedColumns: string[] = ['customer', 'costume', 'rentalDate', 'expectedReturn', 'actualReturn', 'status', 'actions'];
  rentalForm: FormGroup;

  constructor(
    private rentalService: RentalService,
    private customerService: CustomerService,
    private costumeService: CostumeService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.rentalForm = this.fb.group({
      customerId: ['', Validators.required],
      costumeId: ['', Validators.required],
      rentalDate: [new Date(), Validators.required],
      expectedReturnDate: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadRentals();
    this.loadCustomers();
    this.loadAvailableCostumes();
  }

  loadRentals() {
    this.loading = true;
    this.rentalService.getAllRentals().subscribe({
      next: (rentals) => {
        this.rentals = rentals;
        this.filterRentals(this.currentFilter);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rentals:', error);
        this.loading = false;
        this.snackBar.open('Error loading rentals', 'Close', { duration: 3000 });
      }
    });
  }

  loadCustomers() {
    this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  loadAvailableCostumes() {
    this.costumeService.getAvailableCostumes().subscribe({
      next: (costumes) => {
        this.availableCostumes = costumes;
      },
      error: (error) => {
        console.error('Error loading available costumes:', error);
      }
    });
  }

  filterRentals(filter: string) {
    this.currentFilter = filter;
    
    switch (filter) {
      case 'active':
        this.filteredRentals = this.rentals.filter(r => r.status === RentalStatus.ACTIVE);
        break;
      case 'overdue':
        this.filteredRentals = this.rentals.filter(r => r.status === RentalStatus.OVERDUE);
        break;
      case 'returned':
        this.filteredRentals = this.rentals.filter(r => r.status === RentalStatus.RETURNED);
        break;
      default:
        this.filteredRentals = this.rentals;
    }
  }

  createRental() {
    if (this.rentalForm.valid) {
      const formValue = this.rentalForm.value;
      const request: CreateRentalRequest = {
        customerId: formValue.customerId,
        costumeId: formValue.costumeId,
        rentalDate: this.formatDate(formValue.rentalDate),
        expectedReturnDate: this.formatDate(formValue.expectedReturnDate),
        notes: formValue.notes
      };
      
      this.rentalService.createRental(request).subscribe({
        next: (rental) => {
          this.rentals.push(rental);
          this.filterRentals(this.currentFilter);
          this.loadAvailableCostumes(); // Refresh available costumes
          this.rentalForm.reset();
          this.rentalForm.patchValue({ rentalDate: new Date() });
          this.showAddForm = false;
          this.snackBar.open('Rental created successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error creating rental:', error);
          this.snackBar.open('Error creating rental', 'Close', { duration: 3000 });
        }
      });
    }
  }

  returnCostume(rental: Rental) {
    const actualReturnDate = new Date();
    const request = {
      actualReturnDate: this.formatDate(actualReturnDate)
    };
    
    this.rentalService.returnCostume(rental.id!, request).subscribe({
      next: (updatedRental) => {
        const index = this.rentals.findIndex(r => r.id === rental.id);
        if (index !== -1) {
          this.rentals[index] = updatedRental;
          this.filterRentals(this.currentFilter);
          this.loadAvailableCostumes(); // Refresh available costumes
        }
        this.snackBar.open('Costume returned successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error returning costume:', error);
        this.snackBar.open('Error returning costume', 'Close', { duration: 3000 });
      }
    });
  }

  cancelRental(rental: Rental) {
    if (confirm('Are you sure you want to cancel this rental?')) {
      this.rentalService.cancelRental(rental.id!).subscribe({
        next: (updatedRental) => {
          const index = this.rentals.findIndex(r => r.id === rental.id);
          if (index !== -1) {
            this.rentals[index] = updatedRental;
            this.filterRentals(this.currentFilter);
            this.loadAvailableCostumes(); // Refresh available costumes
          }
          this.snackBar.open('Rental cancelled successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error cancelling rental:', error);
          this.snackBar.open('Error cancelling rental', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'RETURNED': return 'status-returned';
      case 'OVERDUE': return 'status-overdue';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  cancelAdd() {
    this.showAddForm = false;
    this.rentalForm.reset();
    this.rentalForm.patchValue({ rentalDate: new Date() });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}