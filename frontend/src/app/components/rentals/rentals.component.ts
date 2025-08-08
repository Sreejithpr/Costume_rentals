import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { CostumeService } from '../../services/costume.service';
import { Rental, RentalStatus, CreateRentalRequest } from '../../models/rental.model';
import { Customer } from '../../models/customer.model';
import { Costume } from '../../models/costume.model';

interface SelectedCostumeItem {
  costume: Costume;
  size: string;
  quantity: number;
}

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
    MatSnackBarModule,
    MatAutocompleteModule,
    MatBadgeModule
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
        <!-- Step 1: Search and Select Costumes -->
        <div class="rental-step">
          <h3>Step 1: Search and Select Costumes</h3>
          
          <!-- Search Field -->
          <div class="search-section">
            <mat-form-field class="search-field">
              <mat-label>Search Costumes</mat-label>
              <input 
                matInput 
                [formControl]="searchControl" 
                placeholder="Type to search costumes...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>

          <!-- Combined Available Costumes Table with Search -->
          <div class="costumes-section">
            <h4>Available Costumes</h4>
            <div class="table-wrapper">
              <table mat-table [dataSource]="filteredCostumes" class="costumes-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let costume">{{ costume.name }}</td>
                </ng-container>
                
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let costume">{{ costume.category }}</td>
                </ng-container>
                
                <ng-container matColumnDef="availableSizes">
                  <th mat-header-cell *matHeaderCellDef>Sizes</th>
                  <td mat-cell *matCellDef="let costume">
                    <div class="size-chips">
                      <mat-chip *ngFor="let size of getAvailableSizes(costume)" 
                               [class.selected]="selectedSize === size && selectedCostume?.id === costume.id"
                               (click)="selectSize(costume, size)">
                        {{ size }}
                      </mat-chip>
                    </div>
                  </td>
                </ng-container>
                
                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef>Qty</th>
                  <td mat-cell *matCellDef="let costume">
                    <mat-form-field appearance="outline" class="qty-field" *ngIf="selectedCostume?.id === costume.id && selectedSize">
                      <mat-select [(value)]="selectedQuantity" (selectionChange)="updateQuantity($event.value)">
                        <mat-option *ngFor="let qty of getAvailableQuantities(costume)" [value]="qty">
                          {{ qty }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    <span *ngIf="selectedCostume?.id !== costume.id || !selectedSize" class="stock-info">
                      Stock: {{ costume.availableStock || costume.stockQuantity || 0 }}
                    </span>
                  </td>
                </ng-container>
                
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Price</th>
                  <td mat-cell *matCellDef="let costume">₹{{ costume.dailyRentalPrice }}</td>
                </ng-container>
                
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Action</th>
                  <td mat-cell *matCellDef="let costume">
                    <button 
                      mat-mini-fab 
                      color="primary" 
                      [disabled]="!canAddCostume(costume)"
                      (click)="addCostumeToSelection(costume)"
                      matTooltip="Add to selection">
                      <mat-icon>add</mat-icon>
                    </button>
                  </td>
                </ng-container>
                
                <tr mat-header-row *matHeaderRowDef="availableCostumesColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: availableCostumesColumns;"></tr>
              </table>
              
              <div *ngIf="filteredCostumes.length === 0" class="no-data-small">
                <mat-icon>search_off</mat-icon>
                <p>No costumes found</p>
              </div>
            </div>
          </div>

          <!-- Selected Costumes Section -->
          <div class="selected-section" *ngIf="selectedCostumes.length > 0">
            <div class="section-header">
              <h4>Selected Costumes</h4>
              <mat-chip class="items-badge">{{ getTotalSelectedItems() }} items</mat-chip>
            </div>
            
            <div class="table-wrapper">
              <table mat-table [dataSource]="selectedCostumesDataSource" class="selected-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let item">{{ item.costume.name }}</td>
                </ng-container>
                
                <ng-container matColumnDef="size">
                  <th mat-header-cell *matHeaderCellDef>Size</th>
                  <td mat-cell *matCellDef="let item">{{ item.size }}</td>
                </ng-container>
                
                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef>Quantity</th>
                  <td mat-cell *matCellDef="let item; let i = index">
                    <mat-form-field appearance="outline" class="qty-edit-field">
                      <mat-select [(value)]="item.quantity" (selectionChange)="updateSelectedItemQuantity(i, $event.value)">
                        <mat-option *ngFor="let qty of getAvailableQuantities(item.costume)" [value]="qty">
                          {{ qty }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </td>
                </ng-container>
                
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let item">{{ item.costume.category }}</td>
                </ng-container>
                
                <ng-container matColumnDef="unitPrice">
                  <th mat-header-cell *matHeaderCellDef>Unit Price</th>
                  <td mat-cell *matCellDef="let item">₹{{ item.costume.dailyRentalPrice }}</td>
                </ng-container>
                
                <ng-container matColumnDef="totalPrice">
                  <th mat-header-cell *matHeaderCellDef>Total</th>
                  <td mat-cell *matCellDef="let item">
                    <strong>₹{{ item.costume.dailyRentalPrice * item.quantity }}</strong>
                  </td>
                </ng-container>
                
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Action</th>
                  <td mat-cell *matCellDef="let item; let i = index">
                    <button 
                      mat-mini-fab 
                      color="warn" 
                      (click)="removeSelectedCostume(i)"
                      matTooltip="Remove">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                
                <tr mat-header-row *matHeaderRowDef="selectedItemsColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: selectedItemsColumns;"></tr>
              </table>
            </div>
            
            <!-- Total Price -->
            <div class="total-summary">
              <div class="total-items">Total Items: {{ getTotalSelectedItems() }}</div>
              <div class="total-price">Total Daily Price: <strong>₹{{ getTotalPrice() }}</strong></div>
            </div>
          </div>
        </div>

        <!-- Step 2: Customer & Rental Details -->
        <div class="rental-step" *ngIf="selectedCostumes.length > 0">
          <h3>Step 2: Customer & Rental Details</h3>
          <form [formGroup]="rentalForm" (ngSubmit)="createMultipleRentals()">
            
            <!-- Customer Details Section -->
            <div class="customer-section">
              <h4>Customer Information</h4>
              <div class="form-row">
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" placeholder="Enter first name" required>
                  <mat-icon matSuffix>person</mat-icon>
                </mat-form-field>
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" placeholder="Enter last name" required>
                  <mat-icon matSuffix>person</mat-icon>
                </mat-form-field>
              </div>
              
              <div class="form-row">
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>Phone Number</mat-label>
                  <input matInput formControlName="phone" placeholder="Enter phone number" required>
                  <mat-icon matSuffix>phone</mat-icon>
                </mat-form-field>
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>Email (Optional)</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="Enter email address">
                  <mat-icon matSuffix>email</mat-icon>
                </mat-form-field>
              </div>
              
              <mat-form-field class="form-field full-width" appearance="outline">
                <mat-label>Address</mat-label>
                <textarea matInput formControlName="address" rows="2" placeholder="Enter address"></textarea>
                <mat-icon matSuffix>location_on</mat-icon>
              </mat-form-field>
            </div>

            <!-- Rental Details Section -->
            <div class="rental-section">
              <h4>Rental Information</h4>
              <div class="form-row">
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>Rental Date</mat-label>
                  <input matInput [matDatepicker]="rentalPicker" formControlName="rentalDate" required>
                  <mat-datepicker-toggle matSuffix [for]="rentalPicker"></mat-datepicker-toggle>
                  <mat-datepicker #rentalPicker></mat-datepicker>
                </mat-form-field>
                <mat-form-field class="form-field" appearance="outline">
                  <mat-label>Expected Return Date</mat-label>
                  <input matInput [matDatepicker]="returnPicker" formControlName="expectedReturnDate" required>
                  <mat-datepicker-toggle matSuffix [for]="returnPicker"></mat-datepicker-toggle>
                  <mat-datepicker #returnPicker></mat-datepicker>
                </mat-form-field>
              </div>
              
              <mat-form-field class="form-field full-width" appearance="outline">
                <mat-label>Additional Notes</mat-label>
                <textarea matInput formControlName="notes" rows="3" placeholder="Any special instructions or notes"></textarea>
                <mat-icon matSuffix>note</mat-icon>
              </mat-form-field>
            </div>
            
            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="!rentalForm.valid || selectedCostumes.length === 0">
                <mat-icon>add_shopping_cart</mat-icon>
                Create Rental ({{ getTotalSelectedItems() }} items)
              </button>
              <button mat-button type="button" (click)="cancelAdd()">
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>
            </div>
          </form>
        </div>
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
    .form-container {
      width: 100%;
      max-width: none;
      margin-bottom: 30px;
    }

    .form-container .mat-mdc-card {
      width: 100%;
      min-height: 85vh;
    }

    .form-container mat-card-content {
      padding: 25px 35px;
      min-height: 80vh;
    }

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
      color: var(--text-muted);
    }

    .rental-step {
      margin-bottom: 25px;
      padding: 20px 25px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--background-secondary);
      min-height: 200px;
    }

    .rental-step h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: var(--primary-color);
      font-size: 20px;
      font-weight: 600;
    }

    .search-section {
      margin-bottom: 15px;
    }

    .search-field {
      width: 100%;
      max-width: 600px;
      font-size: 16px;
    }

    .search-field .mat-mdc-form-field {
      font-size: 16px;
    }

    .costumes-section {
      margin-bottom: 20px;
    }

    .costumes-section h4,
    .selected-section h4 {
      margin: 0 0 10px 0;
      color: var(--text-primary);
      font-size: 16px;
    }

    .table-wrapper {
      max-height: 50vh;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }

    .costumes-table,
    .selected-table {
      width: 100%;
      background: var(--background-primary);
      font-size: 14px;
    }

    .costumes-table .mat-mdc-header-row,
    .selected-table .mat-mdc-header-row {
      background-color: var(--background-tertiary);
      height: 48px;
    }

    .costumes-table .mat-mdc-row,
    .selected-table .mat-mdc-row {
      height: 52px;
    }

    .costumes-table .mat-mdc-cell,
    .selected-table .mat-mdc-cell,
    .costumes-table .mat-mdc-header-cell,
    .selected-table .mat-mdc-header-cell {
      padding: 12px 16px;
      font-size: 14px;
    }

    .size-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .size-chips mat-chip {
      font-size: 12px;
      height: 24px;
      cursor: pointer;
    }

    mat-chip.selected {
      background-color: #3f51b5 !important;
      color: white !important;
    }

    .qty-field,
    .qty-edit-field {
      width: 60px;
    }

    .qty-field .mat-mdc-form-field-wrapper,
    .qty-edit-field .mat-mdc-form-field-wrapper {
      padding-bottom: 0;
    }

    .stock-info {
      font-size: 12px;
      color: var(--text-muted);
    }

    .selected-section {
      margin-top: 25px;
      padding: 20px 25px;
      background-color: var(--background-secondary);
      border-radius: 8px;
      border: 2px solid var(--primary-light);
      min-height: 300px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }

    .items-badge {
      background-color: var(--primary-color) !important;
      color: white !important;
      font-weight: bold;
    }

    .total-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
      padding: 10px 15px;
      background-color: var(--background-tertiary);
      border-radius: 4px;
      font-weight: 500;
      border: 1px solid var(--border-color);
    }

    .total-price {
      color: var(--primary-color);
      font-size: 16px;
    }

    .no-data-small {
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .no-data-small mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
      margin-bottom: 5px;
      color: var(--text-muted);
    }

    .customer-info {
      margin: 20px 0;
    }

    .customer-details-card {
      background-color: var(--background-tertiary);
      margin: 15px 0;
      border: 1px solid var(--border-color);
    }

    .customer-detail-row {
      margin: 8px 0;
      padding: 4px 0;
      color: var(--text-primary);
    }

    .customer-details {
      color: var(--text-secondary);
      font-size: 12px;
    }

    /* New customer and rental section styles */
    .customer-section,
    .rental-section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: var(--background-secondary);
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);
      border: 1px solid var(--border-color);
    }

    .customer-section h4,
    .rental-section h4 {
      margin: 0 0 15px 0;
      color: var(--primary-color);
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .customer-section h4::before {
      content: "👤";
      font-size: 18px;
    }

    .rental-section h4::before {
      content: "📅";
      font-size: 18px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    /* Ensure form fields in sections have proper text colors */
    .customer-section .mat-mdc-form-field,
    .rental-section .mat-mdc-form-field {
      --mdc-filled-text-field-label-text-color: var(--text-secondary);
      --mdc-filled-text-field-input-text-color: var(--text-primary);
      --mdc-outlined-text-field-label-text-color: var(--text-secondary);
      --mdc-outlined-text-field-input-text-color: var(--text-primary);
      --mdc-outlined-text-field-outline-color: var(--border-color);
    }

    .customer-section input,
    .customer-section textarea,
    .rental-section input,
    .rental-section textarea {
      color: var(--text-primary) !important;
    }

    .customer-section label,
    .rental-section label,
    .customer-section .mat-mdc-form-field-label,
    .rental-section .mat-mdc-form-field-label {
      color: var(--text-secondary) !important;
    }

    .form-actions {
      margin-top: 30px;
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      padding: 20px;
      background-color: var(--background-tertiary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .form-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-weight: 500;
      color: var(--text-primary);
    }

    /* Large Screen Optimization */
    @media (min-width: 1200px) {
      .form-container mat-card-content {
        padding: 30px 50px;
      }

      .rental-step {
        padding: 25px 35px;
      }

      .table-wrapper {
        max-height: 60vh;
      }

      .search-field {
        max-width: 800px;
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .form-container .mat-mdc-card {
        min-height: 90vh;
      }

      .form-container mat-card-content {
        padding: 15px 20px;
        min-height: 85vh;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
      
      .rental-step {
        padding: 15px;
        margin-bottom: 15px;
        min-height: 150px;
      }

      .table-wrapper {
        max-height: 40vh;
      }

      .size-chips mat-chip {
        height: 20px;
        font-size: 10px;
      }

      .qty-field,
      .qty-edit-field {
        width: 50px;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .total-summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }

      .selected-section {
        min-height: 200px;
      }
    }

    /* Table Column Widths */
    .mat-column-name { width: 25%; }
    .mat-column-category { width: 15%; }
    .mat-column-availableSizes { width: 20%; }
    .mat-column-quantity { width: 10%; }
    .mat-column-price { width: 15%; }
    .mat-column-actions { width: 15%; }
    .mat-column-size { width: 10%; }
    .mat-column-unitPrice { width: 15%; }
    .mat-column-totalPrice { width: 15%; }
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
  
  // New properties for search and selection
  searchControl = new FormControl('');
  filteredCostumes: Costume[] = [];
  selectedCostumes: SelectedCostumeItem[] = [];
  selectedCostumesDataSource = new MatTableDataSource<SelectedCostumeItem>([]);

  selectedItemsColumns: string[] = ['name', 'size', 'quantity', 'category', 'unitPrice', 'totalPrice', 'actions'];
  availableCostumesColumns: string[] = ['name', 'category', 'availableSizes', 'quantity', 'price', 'actions'];
  
  // Selection state
  selectedCostume: Costume | null = null;
  selectedSize: string = '';
  selectedQuantity: number = 1;

  constructor(
    private rentalService: RentalService,
    private customerService: CustomerService,
    private costumeService: CostumeService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.rentalForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
      address: [''],
      rentalDate: [new Date(), Validators.required],
      expectedReturnDate: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadData();
    this.setupSearchFunctionality();
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
        this.filteredCostumes = costumes.slice(0, 10); // Show first 10 by default
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

  setupSearchFunctionality() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.trim()) {
          // Filter available costumes based on search term
          const searchTerm = value.toLowerCase();
          this.filteredCostumes = this.availableCostumes.filter(costume =>
            costume.name.toLowerCase().includes(searchTerm) ||
            costume.category.toLowerCase().includes(searchTerm) ||
            costume.size.toLowerCase().includes(searchTerm)
          );
        } else {
          this.filteredCostumes = this.availableCostumes.slice(0, 10); // Show first 10 by default
        }
        return of(this.filteredCostumes);
      })
    ).subscribe();
  }



  // Size and quantity selection methods
  getAvailableSizes(costume: Costume): string[] {
    // For now, return common sizes - this could be expanded to be costume-specific
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'].filter(size => {
      // Include the costume's default size plus common sizes
      return size === costume.size || ['S', 'M', 'L', 'XL'].includes(size);
    });
  }

  getAvailableQuantities(costume: Costume): number[] {
    const maxStock = costume.availableStock || costume.stockQuantity || 10;
    return Array.from({ length: Math.min(maxStock, 10) }, (_, i) => i + 1);
  }

  selectSize(costume: Costume, size: string) {
    this.selectedCostume = costume;
    this.selectedSize = size;
    this.selectedQuantity = 1;
  }

  updateQuantity(quantity: number) {
    this.selectedQuantity = quantity;
  }

  canAddCostume(costume: Costume): boolean {
    return this.selectedCostume?.id === costume.id && 
           !!this.selectedSize && 
           this.selectedQuantity > 0;
  }

  addCostumeToSelection(costume: Costume) {
    if (this.canAddCostume(costume)) {
      // Check if same costume with same size is already selected
      const existingIndex = this.selectedCostumes.findIndex(
        item => item.costume.id === costume.id && item.size === this.selectedSize
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        this.selectedCostumes[existingIndex].quantity += this.selectedQuantity;
      } else {
        // Add new item
        this.selectedCostumes.push({
          costume: costume,
          size: this.selectedSize,
          quantity: this.selectedQuantity
        });
      }

      // Update the data source
      this.updateSelectedCostumesDataSource();

      // Reset selection state
      this.selectedCostume = null;
      this.selectedSize = '';
      this.selectedQuantity = 1;
      
      this.snackBar.open('Costume added to selection', 'Close', { duration: 2000 });
    }
  }

  removeSelectedCostume(index: number) {
    this.selectedCostumes.splice(index, 1);
    this.updateSelectedCostumesDataSource();
  }

  updateSelectedItemQuantity(index: number, quantity: number) {
    if (this.selectedCostumes[index]) {
      this.selectedCostumes[index].quantity = quantity;
      this.updateSelectedCostumesDataSource();
    }
  }

  updateSelectedCostumesDataSource() {
    this.selectedCostumesDataSource.data = [...this.selectedCostumes];
  }

  getTotalSelectedItems(): number {
    return this.selectedCostumes.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.selectedCostumes.reduce((total, item) => 
      total + (item.costume.dailyRentalPrice * item.quantity), 0
    );
  }

  createMultipleRentals() {
    if (this.rentalForm.valid && this.selectedCostumes.length > 0) {
      const formValue = this.rentalForm.value;
      
      // First create the customer
      const customerRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        email: formValue.email || '',
        address: formValue.address || ''
      };

      this.customerService.createCustomer(customerRequest).subscribe({
        next: (customer) => {
          // Now create rentals with the new customer ID
          const promises: Promise<Rental | undefined>[] = [];
          
          this.selectedCostumes.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
              const request: CreateRentalRequest = {
                customerId: customer.id!,
                costumeId: item.costume.id!,
                rentalDate: this.formatDate(formValue.rentalDate),
                expectedReturnDate: this.formatDate(formValue.expectedReturnDate),
                notes: `${formValue.notes || ''} - Size: ${item.size}`.trim()
              };
              promises.push(this.rentalService.createRental(request).toPromise());
            }
          });

          Promise.all(promises).then(
            (rentals) => {
              const successfulRentals = rentals.filter(rental => rental);
              successfulRentals.forEach(rental => {
                if (rental) {
                  this.rentals.push(rental);
                }
              });
              this.filterRentals(this.currentFilter);
              this.loadAvailableCostumes(); // Refresh available costumes
              this.loadCustomers(); // Refresh customers list
              this.resetForm();
              this.snackBar.open(`Customer created and ${successfulRentals.length} rentals created successfully`, 'Close', { duration: 4000 });
            }
          ).catch(
            (error) => {
              console.error('Error creating rentals:', error);
              this.snackBar.open('Customer created but error creating some rentals', 'Close', { duration: 4000 });
            }
          );
        },
        error: (error) => {
          console.error('Error creating customer:', error);
          this.snackBar.open('Error creating customer. Please try again.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  createRental() {
    // Keep the old method for backwards compatibility, but redirect to new method
    this.createMultipleRentals();
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

  resetForm() {
    this.selectedCostumes = [];
    this.updateSelectedCostumesDataSource();
    this.selectedCostume = null;
    this.selectedSize = '';
    this.selectedQuantity = 1;
    this.searchControl.setValue('');
    this.rentalForm.reset();
    this.rentalForm.patchValue({ rentalDate: new Date() });
    this.showAddForm = false;
  }

  cancelAdd() {
    this.resetForm();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}