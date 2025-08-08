import { Component, OnInit, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
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

interface CustomerRentalGroup {
  customer: Customer;
  rentals: Rental[];
  activeCount: number;
  returnedCount: number;
  cancelledCount: number;
  totalAmount: number;
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
    MatProgressBarModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatBadgeModule,
    MatDialogModule,
    MatDividerModule
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Rentals</h1>
      <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm">
        <mat-icon>add</mat-icon>
        New Rental
      </button>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle-section">
      <button mat-stroked-button 
              [color]="!isGroupedView ? 'primary' : ''" 
              (click)="toggleView(false)"
              class="view-toggle-btn">
        <mat-icon>list</mat-icon>
        Individual View
      </button>
      <button mat-stroked-button 
              [color]="isGroupedView ? 'primary' : ''" 
              (click)="toggleView(true)"
              class="view-toggle-btn">
        <mat-icon>group</mat-icon>
        Grouped by Customer
      </button>
    </div>

    <!-- Filter Buttons -->
    <div class="action-buttons">
      <button mat-button (click)="filterRentals('all')" 
              [class.active]="currentFilter === 'all'">
        All Rentals ({{ rentals.length }})
      </button>
      <button mat-button (click)="filterRentals('active')"
              [class.active]="currentFilter === 'active'">
        Active ({{ getActiveCount() }})
      </button>
      <button mat-button (click)="filterRentals('overdue')"
              [class.active]="currentFilter === 'overdue'">
        Overdue ({{ getOverdueCount() }})
      </button>
      <button mat-button (click)="filterRentals('returned')"
              [class.active]="currentFilter === 'returned'">
        Returned ({{ getReturnedCount() }})
      </button>
      <button mat-button (click)="filterRentals('cancelled')"
              [class.active]="currentFilter === 'cancelled'">
        Cancelled ({{ getCancelledCount() }})
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
                  <th mat-header-cell *matHeaderCellDef>Sell Price</th>
                  <td mat-cell *matCellDef="let costume">₹{{ costume.sellPrice }}</td>
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
                  <td mat-cell *matCellDef="let item">₹{{ item.costume.sellPrice }}</td>
                </ng-container>
                
                <ng-container matColumnDef="totalPrice">
                  <th mat-header-cell *matHeaderCellDef>Total</th>
                  <td mat-cell *matCellDef="let item">
                    <strong>₹{{ item.costume.sellPrice * item.quantity }}</strong>
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
              <div class="total-price">Total Sell Price: <strong>₹{{ getTotalPrice() }}</strong></div>
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
                [disabled]="!rentalForm.valid || selectedCostumes.length === 0 || loading">
                <mat-spinner diameter="16" *ngIf="loading"></mat-spinner>
                <mat-icon *ngIf="!loading">add_shopping_cart</mat-icon>
                {{ loading ? 'Creating...' : 'Create Rental (' + getTotalSelectedItems() + ' items)' }}
              </button>
              <button mat-button type="button" (click)="cancelAdd()" [disabled]="loading">
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
          
                    <!-- Individual Rentals Table -->
          <table mat-table [dataSource]="dataSource" class="rentals-table" *ngIf="!loading && !isGroupedView">
            
            <!-- ID Column -->
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let rental">
                <strong>#{{ rental.id }}</strong>
              </td>
            </ng-container>

            <!-- Customer Column -->
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let rental">
                <div class="customer-name">{{ rental.customer?.firstName || 'Unknown' }}</div>
                <div class="customer-phone" *ngIf="rental.customer?.phone">{{ rental.customer.phone }}</div>
              </td>
            </ng-container>

            <!-- Costume Column -->
            <ng-container matColumnDef="costume">
              <th mat-header-cell *matHeaderCellDef>Costume</th>
              <td mat-cell *matCellDef="let rental">
                <div class="costume-name">{{ rental.costume?.name || 'Unknown' }}</div>
                <div class="costume-category" *ngIf="rental.costume?.category">{{ rental.costume.category }}</div>
              </td>
            </ng-container>

            <!-- Rental Date Column -->
            <ng-container matColumnDef="rentalDate">
              <th mat-header-cell *matHeaderCellDef>Start Date</th>
              <td mat-cell *matCellDef="let rental">
                {{ rental.rentalDate | date:'MMM dd, yyyy' }}
              </td>
            </ng-container>

            <!-- Expected Return Column -->
            <ng-container matColumnDef="expectedReturn">
              <th mat-header-cell *matHeaderCellDef>Expected Return</th>
              <td mat-cell *matCellDef="let rental">
                {{ rental.expectedReturnDate | date:'MMM dd, yyyy' }}
              </td>
            </ng-container>

            <!-- Actual Return Column -->
            <ng-container matColumnDef="actualReturn">
              <th mat-header-cell *matHeaderCellDef>Actual Return</th>
              <td mat-cell *matCellDef="let rental">
                {{ rental.actualReturnDate ? (rental.actualReturnDate | date:'MMM dd, yyyy') : '-' }}
              </td>
            </ng-container>

            <!-- Status Column -->
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

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let rental">
                <button mat-icon-button 
                        *ngIf="rental.status === 'ACTIVE'" 
                        (click)="returnCostume(rental)"
                        matTooltip="Return Costume"
                        color="primary">
                  <mat-icon>assignment_return</mat-icon>
                </button>
                <button mat-icon-button 
                        *ngIf="rental.status === 'ACTIVE'" 
                        (click)="cancelRental(rental)"
                        matTooltip="Cancel Rental"
                        color="warn">
                  <mat-icon>cancel</mat-icon>
                </button>
                <button mat-icon-button 
                        (click)="viewRentalDetails(rental)"
                        matTooltip="View Details">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <!-- Table Headers and Rows -->
            <tr mat-header-row *matHeaderRowDef="simpleDisplayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: simpleDisplayedColumns;" 
                [class.overdue-row]="isRentalOverdue(row)"
                [class.returned-row]="row.status === 'RETURNED'"
                [class.cancelled-row]="row.status === 'CANCELLED'"
                class="clickable-row"
                (click)="openRentalDetails(row)"></tr>
          </table>

          <!-- Grouped Rentals Table -->
          <table mat-table [dataSource]="groupedDataSource" class="rentals-table grouped-table" *ngIf="!loading && isGroupedView">
            
            <!-- Customer Column -->
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let group" class="customer-group-cell">
                <div class="customer-group-info">
                  <div class="customer-name">{{ group.customer?.firstName || 'Unknown Customer' }}</div>
                  <div class="customer-details">
                    <span *ngIf="group.customer?.phone">📞 {{ group.customer.phone }}</span>
                    <span *ngIf="group.customer?.email">✉️ {{ group.customer.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Rentals Summary Column -->
            <ng-container matColumnDef="rentals">
              <th mat-header-cell *matHeaderCellDef>Rental Summary</th>
              <td mat-cell *matCellDef="let group" class="rentals-summary-cell">
                <div class="rental-summary">
                  <div class="rental-counts">
                    <span class="count-badge active" *ngIf="group.activeCount > 0">
                      Active: {{ group.activeCount }}
                    </span>
                    <span class="count-badge returned" *ngIf="group.returnedCount > 0">
                      Returned: {{ group.returnedCount }}
                    </span>
                    <span class="count-badge cancelled" *ngIf="group.cancelledCount > 0">
                      Cancelled: {{ group.cancelledCount }}
                    </span>
                  </div>
                  <div class="total-rentals">Total: {{ group.rentals.length }} rentals</div>
                </div>
              </td>
            </ng-container>

            <!-- Total Amount Column -->
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>Total Amount</th>
              <td mat-cell *matCellDef="let group" class="amount-cell">
                <div class="total-amount">₹{{ group.totalAmount | number:'1.2-2' }}</div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let group" class="actions-cell">
                <button mat-raised-button 
                        color="primary" 
                        (click)="viewCustomerRentals(group)"
                        class="view-details-btn">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button mat-icon-button 
                        (click)="expandCustomerGroup(group)"
                        matTooltip="Expand/Collapse">
                  <mat-icon>expand_more</mat-icon>
                </button>
              </td>
            </ng-container>

            <!-- Table Headers and Rows -->
            <tr mat-header-row *matHeaderRowDef="groupedDisplayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: groupedDisplayedColumns;" 
                class="grouped-data-row clickable-row"
                (click)="viewCustomerRentals(row)"></tr>
          </table>

          <div *ngIf="(dataSource.data.length === 0 || groupedDataSource.data.length === 0) && !loading" class="no-data">
            No rentals found
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Rental Details Dialog Template -->
    <ng-template #rentalDetailsDialog let-data>
      <div class="rental-details-dialog">
        <div mat-dialog-title class="dialog-header">
          <div class="dialog-title-content">
            <mat-icon class="dialog-icon">receipt_long</mat-icon>
            <h2>Rental Details - #{{ data.rental.id }}</h2>
            <mat-chip [class]="getStatusClass(data.rental.status)" class="status-chip">
              {{ data.rental.status }}
            </mat-chip>
          </div>
          <button mat-icon-button mat-dialog-close class="close-button">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-dialog-content class="dialog-content">
          <div class="details-table-container">
            <table mat-table class="details-table">
              <!-- Customer Information Section -->
              <div class="section-divider">
                <mat-icon>person</mat-icon>
                <span>Customer Information</span>
              </div>
              
              <tr class="detail-row">
                <td class="label-cell">Customer Name</td>
                <td class="value-cell">{{ data.rental.customer?.firstName || 'Not Available' }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.customer?.phone">
                <td class="label-cell">Phone Number</td>
                <td class="value-cell">{{ data.rental.customer.phone }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.customer?.email">
                <td class="label-cell">Email Address</td>
                <td class="value-cell">{{ data.rental.customer.email }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.customer?.address">
                <td class="label-cell">Address</td>
                <td class="value-cell">{{ data.rental.customer.address }}</td>
              </tr>

              <!-- Costume Information Section -->
              <div class="section-divider">
                <mat-icon>checkroom</mat-icon>
                <span>Costume Information</span>
              </div>
              
              <tr class="detail-row">
                <td class="label-cell">Costume Name</td>
                <td class="value-cell">{{ data.rental.costume?.name || 'Not Available' }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.costume?.category">
                <td class="label-cell">Category</td>
                <td class="value-cell">{{ data.rental.costume.category }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.costume?.size">
                <td class="label-cell">Size</td>
                <td class="value-cell">{{ data.rental.costume.size }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.costume?.color">
                <td class="label-cell">Color</td>
                <td class="value-cell">{{ data.rental.costume.color }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.costume?.sellPrice">
                <td class="label-cell">Sell Price</td>
                <td class="value-cell price-cell">₹{{ data.rental.costume.sellPrice | number:'1.2-2' }}</td>
              </tr>

              <!-- Rental Information Section -->
              <div class="section-divider">
                <mat-icon>calendar_month</mat-icon>
                <span>Rental Information</span>
              </div>
              
              <tr class="detail-row">
                <td class="label-cell">Rental Start Date</td>
                <td class="value-cell">{{ data.rental.rentalDate | date:'fullDate' }}</td>
              </tr>
              
              <tr class="detail-row">
                <td class="label-cell">Expected Return Date</td>
                <td class="value-cell">{{ data.rental.expectedReturnDate | date:'fullDate' }}</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.actualReturnDate">
                <td class="label-cell">Actual Return Date</td>
                <td class="value-cell">{{ data.rental.actualReturnDate | date:'fullDate' }}</td>
              </tr>
              
              <tr class="detail-row">
                <td class="label-cell">Rental Duration</td>
                <td class="value-cell duration-cell">{{ getDurationInDays(data.rental) }} days</td>
              </tr>
              
              <tr class="detail-row" *ngIf="data.rental.notes">
                <td class="label-cell">Notes</td>
                <td class="value-cell notes-cell">{{ data.rental.notes }}</td>
              </tr>

              <!-- Bill Information Section -->
              <div class="section-divider" *ngIf="data.rental.bill">
                <mat-icon>receipt</mat-icon>
                <span>Bill Information</span>
              </div>
              
              <tr class="detail-row" *ngIf="data.rental.bill">
                <td class="label-cell">Bill Status</td>
                <td class="value-cell">
                  <mat-chip class="bill-generated-chip">
                    <mat-icon>check_circle</mat-icon>
                    Bill Generated
                  </mat-chip>
                </td>
              </tr>
            </table>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions class="dialog-actions">
          <button mat-stroked-button mat-dialog-close class="close-btn">
            <mat-icon>close</mat-icon>
            Close
          </button>
          <button mat-raised-button color="primary" 
                  *ngIf="data.rental.status === 'ACTIVE'" 
                  (click)="returnCostumeFromDialog(data.rental)"
                  class="action-btn">
            <mat-icon>assignment_return</mat-icon>
            Return Costume
          </button>
          <button mat-raised-button color="warn" 
                  *ngIf="data.rental.status === 'ACTIVE'" 
                  (click)="cancelRentalFromDialog(data.rental)"
                  class="action-btn">
            <mat-icon>cancel</mat-icon>
            Cancel Rental
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
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

    .form-actions button mat-spinner {
      margin-right: 8px;
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

    /* Simple Table Styles */
    .rentals-table {
      width: 100%;
      margin-top: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .mat-mdc-header-row {
      background-color: var(--primary-color);
      color: white;
    }

    .mat-mdc-header-cell {
      color: white !important;
      font-weight: 600;
      padding: 16px 12px;
    }

    .mat-mdc-row {
      border-bottom: 1px solid #e0e0e0;
    }

    .mat-mdc-row:hover {
      background-color: #f5f5f5;
    }

    .mat-mdc-cell {
      padding: 12px;
    }

    /* Status chip styles */
    .status-active {
      background-color: #4caf50;
      color: white;
    }

    .status-returned {
      background-color: #2196f3;
      color: white;
    }

    .status-cancelled {
      background-color: #757575;
      color: white;
    }

    .status-overdue {
      background-color: #f44336;
      color: white;
    }

    .status-default {
      background-color: #ffc107;
      color: black;
    }

    /* Row highlighting */
    .overdue-row {
      background-color: #ffebee !important;
      border-left: 4px solid #f44336;
    }

    .returned-row {
      background-color: #e8f5e8 !important;
    }

    .cancelled-row {
      background-color: #f5f5f5 !important;
      opacity: 0.8;
    }

    /* Customer and costume info */
    .customer-name {
      font-weight: 600;
      color: #333;
    }

    .customer-phone {
      font-size: 12px;
      color: #666;
    }

    .costume-name {
      font-weight: 600;
      color: #333;
    }

    .costume-category {
      font-size: 12px;
      color: #666;
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 2px;
    }

    /* Clickable Row Styles */
    .clickable-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .clickable-row:hover {
      background-color: #f0f8ff !important;
    }

    /* Dialog Styles */
    .rental-details-dialog {
      max-width: 100%;
      min-width: 700px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 16px 24px;
      margin-bottom: 0;
      border-bottom: 2px solid #f0f0f0;
      background: linear-gradient(135deg, #007A8E 0%, #016BD1 100%);
      color: white;
      border-radius: 8px 8px 0 0;
    }

    .dialog-title-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .dialog-icon {
      font-size: 24px;
      color: #FDF958;
    }

    .dialog-title-content h2 {
      margin: 0;
      color: white;
      font-weight: 600;
      font-size: 20px;
    }

    .status-chip {
      margin-left: 12px;
      font-weight: 500;
      font-size: 12px;
    }

    .close-button {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .dialog-content {
      padding: 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .details-table-container {
      width: 100%;
      background: white;
    }

    .details-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .section-divider {
      background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 16px 24px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 16px;
      color: #007A8E;
      border-bottom: 1px solid #dee2e6;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .section-divider mat-icon {
      font-size: 20px;
      color: #016BD1;
    }

    .detail-row {
      border-bottom: 1px solid #f1f3f4;
      transition: background-color 0.2s ease;
    }

    .detail-row:hover {
      background-color: #f8f9ff;
    }

    .label-cell {
      padding: 16px 24px;
      font-weight: 600;
      color: #495057;
      background-color: #fafafa;
      width: 35%;
      border-right: 1px solid #e9ecef;
      vertical-align: top;
      font-size: 14px;
    }

    .value-cell {
      padding: 16px 24px;
      color: #212529;
      vertical-align: top;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.5;
    }

    .price-cell {
      font-weight: 600;
      color: #28a745;
      font-size: 15px;
    }

    .duration-cell {
      font-weight: 500;
      color: #6c757d;
    }

    .notes-cell {
      font-style: italic;
      color: #6c757d;
      max-width: 300px;
      word-wrap: break-word;
    }

    .bill-generated-chip {
      background-color: #d4edda !important;
      color: #155724 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .bill-generated-chip mat-icon {
      font-size: 16px;
    }

    .dialog-actions {
      padding: 20px 24px;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #e9ecef;
      background-color: #f8f9fa;
    }

    .close-btn {
      border: 2px solid #6c757d;
      color: #6c757d;
      font-weight: 500;
    }

    .action-btn {
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Responsive dialog */
    @media (max-width: 768px) {
      .rental-details-dialog {
        min-width: 95vw;
      }

      .dialog-header {
        padding: 16px 20px;
      }

      .dialog-title-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .dialog-title-content h2 {
        font-size: 18px;
      }

      .details-table,
      .detail-row {
        display: block;
        width: 100%;
      }

      .label-cell,
      .value-cell {
        display: block;
        width: 100%;
        padding: 12px 20px;
        border-right: none;
      }

      .label-cell {
        background-color: #f0f3f7;
        font-weight: 600;
        font-size: 13px;
        padding-bottom: 8px;
        border-bottom: none;
      }

      .value-cell {
        padding-top: 0;
        padding-bottom: 16px;
        border-bottom: 1px solid #e9ecef;
      }

      .section-divider {
        padding: 12px 20px;
        font-size: 15px;
      }

      .dialog-actions {
        padding: 16px 20px;
        flex-direction: column;
        gap: 8px;
      }

      .action-btn,
      .close-btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* View Toggle Styles */
    .view-toggle-section {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      justify-content: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .view-toggle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-weight: 500;
    }

    /* Grouped Table Styles */
    .grouped-table {
      margin-top: 20px;
    }

    .customer-group-cell {
      padding: 16px 12px;
    }

    .customer-group-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .customer-name {
      font-weight: 600;
      font-size: 16px;
      color: var(--primary-color);
    }

    .customer-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: #666;
    }

    .customer-details span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .rentals-summary-cell {
      padding: 16px 12px;
    }

    .rental-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rental-counts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .count-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: white;
    }

    .count-badge.active {
      background-color: #4caf50;
    }

    .count-badge.returned {
      background-color: #2196f3;
    }

    .count-badge.cancelled {
      background-color: #757575;
    }

    .total-rentals {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .amount-cell {
      text-align: center;
      padding: 16px 12px;
    }

    .total-amount {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-color);
    }

    .view-details-btn {
      margin-right: 8px;
    }

    .grouped-data-row {
      min-height: 80px;
    }

    .grouped-data-row:hover {
      background-color: #f0f8ff !important;
    }
  `]
})
export class RentalsComponent implements OnInit {
  @ViewChild('rentalDetailsDialog') rentalDetailsDialog!: TemplateRef<any>;
  
  rentals: Rental[] = [];
  filteredRentals: Rental[] = [];
  customers: Customer[] = [];
  availableCostumes: Costume[] = [];
  loading = false;
  showAddForm = false;
  currentFilter = 'all';
  displayedColumns: string[] = ['customer', 'costume', 'rentalDate', 'expectedReturn', 'actualReturn', 'status', 'actions'];
  simpleDisplayedColumns: string[] = ['id', 'customer', 'costume', 'rentalDate', 'expectedReturn', 'actualReturn', 'status', 'actions'];
  groupedDisplayedColumns: string[] = ['customer', 'rentals', 'totalAmount', 'actions'];
  rentalForm: FormGroup;
  
  // Add MatTableDataSource for better table handling
  dataSource = new MatTableDataSource<Rental>([]);
  groupedDataSource = new MatTableDataSource<CustomerRentalGroup>([]);
  
  // View mode toggle
  isGroupedView = false;
  
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
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.rentalForm = this.fb.group({
      firstName: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
      address: [''],
      rentalDate: [new Date(), Validators.required],
      expectedReturnDate: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    console.log('RentalsComponent ngOnInit called');
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
        
        // Initialize dataSource
        this.dataSource.data = rentals;
        
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
    const today = new Date();
    
    // Debug logging
    console.log(`Filtering rentals with filter: ${filter}`);
    console.log(`Total rentals: ${this.rentals.length}`);
    
    switch (filter) {
      case 'active':
        // Show ALL active rentals (including overdue ones)
        this.filteredRentals = this.rentals.filter(r => {
          console.log(`Checking rental ${r.id}: status = "${r.status}"`);
          return r.status === 'ACTIVE';
        });
        break;
      case 'overdue':
        this.filteredRentals = this.rentals.filter(r => {
          if (r.status === 'ACTIVE') {
            const expectedReturnDate = new Date(r.expectedReturnDate);
            return expectedReturnDate < today; // Active but past expected return date
          }
          return r.status === 'OVERDUE'; // Or explicitly marked as overdue
        });
        break;
      case 'returned':
        this.filteredRentals = this.rentals.filter(r => r.status === 'RETURNED');
        break;
      case 'cancelled':
        this.filteredRentals = this.rentals.filter(r => r.status === 'CANCELLED');
        break;
      default:
        this.filteredRentals = this.rentals;
    }
    
    // Update the MatTableDataSource
    this.dataSource.data = this.filteredRentals;
    
    // Update grouped view if active
    if (this.isGroupedView) {
      this.groupRentalsByCustomer();
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
      total + (item.costume.sellPrice * item.quantity), 0
    );
  }

  createMultipleRentals() {
    if (this.rentalForm.valid && this.selectedCostumes.length > 0) {
      this.loading = true; // Add loading state
      const formValue = this.rentalForm.value;
      
      // First create the customer
      const customerRequest = {
        firstName: formValue.firstName,
        phone: formValue.phone,
        email: formValue.email || '',
        address: formValue.address || ''
      };

      this.customerService.createCustomer(customerRequest).subscribe({
        next: (customer) => {
          // Now create rentals with the new customer ID
          const rentalRequests: CreateRentalRequest[] = [];
          
          this.selectedCostumes.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
              const request: CreateRentalRequest = {
                customerId: customer.id!,
                costumeId: item.costume.id!,
                rentalDate: this.formatDate(formValue.rentalDate),
                expectedReturnDate: this.formatDate(formValue.expectedReturnDate),
                notes: `${formValue.notes || ''} - Size: ${item.size}`.trim()
              };
              rentalRequests.push(request);
            }
          });

          // Create rentals sequentially to avoid overwhelming the server
          this.createRentalsSequentially(rentalRequests, 0, []);
        },
        error: (error) => {
          console.error('Error creating customer:', error);
          this.loading = false; // Stop loading on error
          // Always close form on error
          this.resetFormAndClose();
          this.snackBar.open('Error creating customer. Please try again.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  createRentalsSequentially(requests: CreateRentalRequest[], index: number, successfulRentals: Rental[]) {
    if (index >= requests.length) {
      // All rentals processed
      this.loadRentals(); // Reload all data
      this.loadAvailableCostumes(); // Refresh available costumes
      this.loadCustomers(); // Refresh customers list
      
      this.resetFormAndClose();
      
      if (successfulRentals.length === requests.length) {
        this.snackBar.open(`Customer created and all ${successfulRentals.length} rentals created successfully`, 'Close', { duration: 4000 });
      } else if (successfulRentals.length > 0) {
        this.snackBar.open(`Customer created and ${successfulRentals.length} out of ${requests.length} rentals created successfully`, 'Close', { duration: 5000 });
      } else {
        this.snackBar.open(`Customer created but failed to create any rentals. Please check backend connection.`, 'Close', { duration: 6000 });
      }
      
      this.loading = false;
      return;
    }

    const request = requests[index];
    console.log(`Creating rental ${index + 1}/${requests.length}:`, request);
    
    this.rentalService.createRental(request).subscribe({
      next: (rental) => {
        console.log(`Rental ${index + 1} created successfully:`, rental);
        successfulRentals.push(rental);
        this.createRentalsSequentially(requests, index + 1, successfulRentals);
      },
      error: (error) => {
        console.error(`Error creating rental ${index + 1}:`, error);
        console.error('Request that failed:', request);
        
        // Show specific error message
        if (error.status === 0) {
          console.error('Backend server appears to be down');
        } else if (error.status === 400) {
          console.error('Bad request - check data format');
        } else if (error.status === 404) {
          console.error('Resource not found - customer or costume may not exist');
        }
        
        // Continue with next rental even if this one fails
        this.createRentalsSequentially(requests, index + 1, successfulRentals);
      }
    });
  }

  createRental() {
    // Keep the old method for backwards compatibility, but redirect to new method
    this.createMultipleRentals();
  }

  returnCostume(rental: Rental) {
    if (confirm(`Are you sure you want to mark "${rental.costume.name}" as returned?`)) {
    const actualReturnDate = new Date();
    const request = {
      actualReturnDate: this.formatDate(actualReturnDate)
    };
    
    this.rentalService.returnCostume(rental.id!, request).subscribe({
      next: (updatedRental) => {
          // Reload all data to ensure proper status updates and data consistency
          this.loadRentals(); // This will reload all rentals and apply current filter
          this.loadAvailableCostumes(); // Refresh available costumes to show updated stock
          this.snackBar.open(`"${rental.costume.name}" returned successfully on ${this.formatDate(actualReturnDate)}`, 'Close', { duration: 4000 });
      },
      error: (error) => {
        console.error('Error returning costume:', error);
          this.snackBar.open('Error returning costume. Please try again.', 'Close', { duration: 3000 });
      }
    });
    }
  }

  cancelRental(rental: Rental) {
    if (confirm(`Are you sure you want to cancel the rental of "${rental.costume.name}" for ${rental.customer.firstName}?`)) {
      this.rentalService.cancelRental(rental.id!).subscribe({
        next: (updatedRental) => {
          // Reload all data to ensure proper status updates and data consistency
          this.loadRentals(); // This will reload all rentals and apply current filter
          this.loadAvailableCostumes(); // Refresh available costumes to show updated stock
          this.snackBar.open(`Rental of "${rental.costume.name}" cancelled successfully`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error cancelling rental:', error);
          this.snackBar.open('Error cancelling rental. Please try again.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Method to get the display status (including computed overdue status)
  getDisplayStatus(rental: Rental): string {
    if (rental.status === 'ACTIVE') {
      const today = new Date();
      const expectedReturnDate = new Date(rental.expectedReturnDate);
      if (expectedReturnDate < today) {
        return 'OVERDUE';
      }
    }
    return rental.status;
  }

  // Method to get the appropriate CSS class for display status
  getDisplayStatusClass(rental: Rental): string {
    return this.getStatusClass(this.getDisplayStatus(rental));
  }

  // Helper methods to get counts for filter buttons
  getActiveCount(): number {
    return this.rentals.filter(r => r.status === 'ACTIVE').length;
  }

  getOverdueCount(): number {
    const today = new Date();
    return this.rentals.filter(r => {
      if (r.status === 'ACTIVE') {
        const expectedReturnDate = new Date(r.expectedReturnDate);
        return expectedReturnDate < today;
      }
      return r.status === 'OVERDUE';
    }).length;
  }

  getReturnedCount(): number {
    return this.rentals.filter(r => r.status === 'RETURNED').length;
  }

  getCancelledCount(): number {
    return this.rentals.filter(r => r.status === 'CANCELLED').length;
  }

  // Simple helper methods
  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'RETURNED': return 'status-returned';
      case 'CANCELLED': return 'status-cancelled';
      case 'OVERDUE': return 'status-overdue';
      default: return 'status-default';
    }
  }

  isRentalOverdue(rental: Rental): boolean {
    if (rental.status !== 'ACTIVE') return false;
    const today = new Date();
    const expectedReturn = new Date(rental.expectedReturnDate);
    return today > expectedReturn;
  }

  // Dialog and detail methods
  openRentalDetails(rental: Rental): void {
    const dialogRef = this.dialog.open(this.rentalDetailsDialog, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { rental: rental },
      panelClass: 'rental-details-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadRentals();
      }
    });
  }

  viewRentalDetails(rental: Rental): void {
    this.openRentalDetails(rental);
  }

  getDurationInDays(rental: Rental): number {
    const startDate = new Date(rental.rentalDate);
    const endDate = rental.actualReturnDate ? new Date(rental.actualReturnDate) : new Date(rental.expectedReturnDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  returnCostumeFromDialog(rental: Rental): void {
    this.returnCostume(rental);
    this.dialog.closeAll();
  }

  cancelRentalFromDialog(rental: Rental): void {
    this.cancelRental(rental);
    this.dialog.closeAll();
  }

  // Grouped view methods
  toggleView(isGrouped: boolean): void {
    this.isGroupedView = isGrouped;
    if (isGrouped) {
      this.groupRentalsByCustomer();
    }
  }

  groupRentalsByCustomer(): void {
    const customerGroups = new Map<number, CustomerRentalGroup>();
    
    this.filteredRentals.forEach(rental => {
      const customerId = rental.customer?.id;
      if (!customerId) return;
      
      if (!customerGroups.has(customerId)) {
        customerGroups.set(customerId, {
          customer: rental.customer,
          rentals: [],
          activeCount: 0,
          returnedCount: 0,
          cancelledCount: 0,
          totalAmount: 0
        });
      }
      
      const group = customerGroups.get(customerId)!;
      group.rentals.push(rental);
      
      // Count by status
      switch (rental.status) {
        case 'ACTIVE':
          group.activeCount++;
          break;
        case 'RETURNED':
          group.returnedCount++;
          break;
        case 'CANCELLED':
          group.cancelledCount++;
          break;
      }
      
      // Calculate total amount (approximate based on daily rate and duration)
              if (rental.costume?.sellPrice) {
          const duration = this.getDurationInDays(rental);
          group.totalAmount += rental.costume.sellPrice * duration;
      }
    });
    
    this.groupedDataSource.data = Array.from(customerGroups.values());
  }

  viewCustomerRentals(group: CustomerRentalGroup): void {
    // Show a dialog with all rentals for this customer
    const customerName = group.customer?.firstName || 'Unknown Customer';
    const rentalsList = group.rentals.map(rental => 
      `• ${rental.costume?.name || 'Unknown'} - ${rental.status} (${rental.rentalDate})`
    ).join('\n');
    
    const details = `
Customer: ${customerName}
Phone: ${group.customer?.phone || 'N/A'}
Email: ${group.customer?.email || 'N/A'}

Rentals (${group.rentals.length}):
${rentalsList}

Summary:
- Active: ${group.activeCount}
- Returned: ${group.returnedCount} 
- Cancelled: ${group.cancelledCount}
- Total Amount: ₹${group.totalAmount.toFixed(2)}
    `;
    
    alert(details);
  }

  expandCustomerGroup(group: CustomerRentalGroup): void {
    // Toggle to individual view showing only this customer's rentals
    this.isGroupedView = false;
    this.filteredRentals = group.rentals;
    this.dataSource.data = this.filteredRentals;
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

  resetFormAndClose() {
    // Force close form and reset all states
    this.loading = false;
    this.showAddForm = false;
    this.selectedCostumes = [];
    this.updateSelectedCostumesDataSource();
    this.selectedCostume = null;
    this.selectedSize = '';
    this.selectedQuantity = 1;
    this.searchControl.setValue('');
    this.rentalForm.reset();
    this.rentalForm.patchValue({ rentalDate: new Date() });
    
    // Force Angular change detection to update the UI immediately
    this.cdr.detectChanges();
    
    // Double-check with setTimeout to ensure form is closed
    setTimeout(() => {
      this.showAddForm = false;
      this.loading = false;
      this.cdr.detectChanges();
    }, 100);
  }

  cancelAdd() {
    this.resetFormAndClose();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}