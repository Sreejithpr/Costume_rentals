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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { RentalService } from '../../services/rental.service';
import { CustomerService } from '../../services/customer.service';
import { CostumeService } from '../../services/costume.service';
import { BillService } from '../../services/bill.service';
import { Rental, RentalStatus, CreateRentalRequest } from '../../models/rental.model';
import { Customer } from '../../models/customer.model';
import { Costume } from '../../models/costume.model';
import { Bill } from '../../models/bill.model';

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
    MatDividerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Rentals</h1>
      <div class="header-actions">
        <button mat-stroked-button 
                [color]="isGroupedView ? 'primary' : ''" 
                (click)="toggleView(true)"
                class="grouped-view-btn"
                *ngIf="!showAddForm">
          <mat-icon>group</mat-icon>
          Grouped by Customer
        </button>
        <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm">
          <mat-icon>add</mat-icon>
          New Rental
        </button>
      </div>
    </div>



    <!-- Filter Buttons - Only show when not in add form -->
    <div class="action-buttons" *ngIf="!showAddForm">
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

        <!-- Step 1.5: Instructions for next step -->
        <div class="rental-step" *ngIf="selectedCostumes.length === 0">
          <h3>Next Step: Select Costumes</h3>
          <div class="instruction-message">
            <mat-icon>info</mat-icon>
            <p>Please select costumes from the table above to proceed to customer details.</p>
            <p><strong>How to select:</strong></p>
            <ol>
              <li>Choose a costume size by clicking on the size chips</li>
              <li>Select quantity if needed</li>
              <li>Click the <mat-icon>add</mat-icon> button to add to your selection</li>
            </ol>
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
              
              <!-- Bill Generation Option -->
              <div class="bill-generation-section">
                <mat-checkbox formControlName="generateBillsImmediately" color="primary">
                  <strong>Generate bills immediately after creating rentals</strong>
                  <p class="checkbox-description">When checked, bills will be automatically generated and displayed for printing. You can also generate bills later from the Bills section.</p>
                </mat-checkbox>
              </div>
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

    <!-- Bills Display Section -->
    <mat-card *ngIf="showBills && createdBills.length > 0" class="bills-container">
      <mat-card-header>
        <mat-card-title>Generated Bills</mat-card-title>
        <div class="bills-actions">
          <button mat-raised-button color="primary" (click)="printAllBillsForCustomer()" class="print-customer-button">
            <mat-icon>local_printshop</mat-icon>
            Print & Give to Customer
          </button>
          <button mat-stroked-button (click)="printAllBills()" class="print-button">
            <mat-icon>print</mat-icon>
            Print All Bills
          </button>
          <button mat-stroked-button (click)="closeBills()" class="close-button">
            <mat-icon>close</mat-icon>
            Close Bills
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <div class="bills-grid">
          <div *ngFor="let bill of createdBills" class="bill-card" id="bill-{{bill.id}}">
            <div class="bill-header">
              <h3>Bill #{{bill.id}}</h3>
              <button mat-icon-button (click)="printBill(bill)" title="Print this bill">
                <mat-icon>print</mat-icon>
              </button>
            </div>
            <div class="bill-content">
              <div class="customer-info">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> {{bill.rental.customer.firstName}}</p>
                <p><strong>Phone:</strong> {{bill.rental.customer.phone}}</p>
                <p *ngIf="bill.rental.customer.email"><strong>Email:</strong> {{bill.rental.customer.email}}</p>
                <p *ngIf="bill.rental.customer.address"><strong>Address:</strong> {{bill.rental.customer.address}}</p>
              </div>
              <div class="rental-info">
                <h4>Rental Details</h4>
                <p><strong>Costume:</strong> {{bill.rental.costume.name}}</p>
                <p><strong>Category:</strong> {{bill.rental.costume.category}}</p>
                <p><strong>Rental Date:</strong> {{bill.rental.rentalDate | date:'dd/MM/yyyy'}}</p>
                <p><strong>Expected Return:</strong> {{bill.rental.expectedReturnDate | date:'dd/MM/yyyy'}}</p>
                <p *ngIf="bill.rental.notes"><strong>Notes:</strong> {{bill.rental.notes}}</p>
              </div>
              <div class="bill-info">
                <h4>Bill Summary</h4>
                <p><strong>Bill Date:</strong> {{bill.billDate | date:'dd/MM/yyyy HH:mm'}}</p>
                <p><strong>Due Date:</strong> {{bill.dueDate | date:'dd/MM/yyyy'}}</p>
                <p *ngIf="bill.lateFee && bill.lateFee > 0"><strong>Late Fee:</strong> ₹{{bill.lateFee}}</p>
                <p *ngIf="bill.damageFee && bill.damageFee > 0"><strong>Damage Fee:</strong> ₹{{bill.damageFee}}</p>
                <p *ngIf="bill.discount && bill.discount > 0"><strong>Discount:</strong> -₹{{bill.discount}}</p>
                <p class="total-amount"><strong>Total Amount:</strong> ₹{{bill.totalAmount}}</p>
                <p><strong>Status:</strong> <span class="status-{{bill.status.toLowerCase()}}">{{bill.status}}</span></p>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Rental Print Section -->
    <mat-card *ngIf="showRentalPrint && createdRentals.length > 0" class="rental-print-container">
      <mat-card-header>
        <mat-card-title>Created Rentals - Ready for Print</mat-card-title>
        <div class="rental-print-actions">
          <button mat-raised-button color="accent" (click)="returnAllRentals()" class="return-all-button" [disabled]="returningAll">
            <mat-spinner diameter="16" *ngIf="returningAll"></mat-spinner>
            <mat-icon *ngIf="!returningAll">assignment_return</mat-icon>
            {{ returningAll ? 'Processing...' : 'Return All Items' }}
          </button>
          <button mat-stroked-button (click)="printRentalSummary()" class="print-summary-button">
            <mat-icon>receipt</mat-icon>
            Print Summary
          </button>
          <button mat-stroked-button (click)="closeRentalPrint()" class="close-button">
            <mat-icon>close</mat-icon>
            Close
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <div class="rental-summary">
          <h3>Rental Summary</h3>
          <p><strong>Customer:</strong> {{ createdRentals[0].customer.firstName }} ({{ createdRentals[0].customer.phone }})</p>
          <p><strong>Total Rentals:</strong> {{ createdRentals.length }}</p>
          <p><strong>Rental Date:</strong> {{ createdRentals[0].rentalDate | date:'MMM dd, yyyy' }}</p>
          <p><strong>Expected Return:</strong> {{ createdRentals[0].expectedReturnDate | date:'MMM dd, yyyy' }}</p>
        </div>
        
        <div class="rental-items-grid">
          <div *ngFor="let rental of createdRentals" class="rental-item-card" id="rental-{{rental.id}}">
            <div class="rental-item-header">
              <h4>Rental #{{ rental.id }}</h4>
            </div>
            <div class="rental-item-details">
              <p><strong>Costume:</strong> {{ rental.costume.name }}</p>
              <p><strong>Category:</strong> {{ rental.costume.category }}</p>
              <p><strong>Daily Price:</strong> ₹{{ rental.costume.sellPrice }}</p>
              <p><strong>Status:</strong> {{ rental.status }}</p>
              <p *ngIf="rental.notes"><strong>Notes:</strong> {{ rental.notes }}</p>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Rentals Table - Hidden when showAddForm is true -->
    <div class="table-container" *ngIf="!showAddForm">
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
                        color="accent" 
                        *ngIf="group.activeCount > 0"
                        (click)="returnAllCustomerRentals(group); $event.stopPropagation()"
                        class="return-all-customer-btn"
                        [disabled]="returningCustomerRentals === group.customer.id"
                        matTooltip="Return all active rentals for this customer">
                  <mat-spinner diameter="16" *ngIf="returningCustomerRentals === group.customer.id"></mat-spinner>
                  <mat-icon *ngIf="returningCustomerRentals !== group.customer.id">assignment_return</mat-icon>
                  {{ returningCustomerRentals === group.customer.id ? 'Processing...' : 'Return All' }}
                </button>
                <button mat-raised-button 
                        color="primary" 
                        (click)="viewCustomerRentals(group); $event.stopPropagation()"
                        class="view-details-btn">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button mat-icon-button 
                        (click)="expandCustomerGroup(group); $event.stopPropagation()"
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



    <!-- Quick Stats Summary - Only show when in add form -->
    <div class="rentals-summary-container" *ngIf="showAddForm">
      <mat-card>
        <mat-card-content>
          <div class="summary-message">
            <mat-icon>info</mat-icon>
            <h3>Creating New Rental</h3>
            <p>Fill out the form below to create a new rental. The rental table is hidden while creating new rentals.</p>
          </div>
          
          <div class="quick-stats" *ngIf="rentals.length > 0">
            <div class="stat-item">
              <span class="stat-number">{{ getTotalActiveRentals() }}</span>
              <span class="stat-label">Active Rentals</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ getTotalReturnedRentals() }}</span>
              <span class="stat-label">Returned</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ getTotalOverdueRentals() }}</span>
              <span class="stat-label">Overdue</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">₹{{ getTotalRentalRevenue() | number:'1.2-2' }}</span>
              <span class="stat-label">Total Revenue</span>
            </div>
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

    <!-- Customer Rentals Dialog Template -->
    <ng-template #customerRentalsDialog let-data>
      <div class="customer-rentals-dialog">
        <div mat-dialog-title class="dialog-header">
          <div class="dialog-title-content">
            <mat-icon class="dialog-icon">person</mat-icon>
            <h2>Created Rentals - Ready for Print</h2>
          </div>
          <div class="header-actions">
            <button mat-stroked-button 
                    (click)="printRentalSummaryForCustomer(data.rentals, data.customer)"
                    class="print-summary-btn">
              <mat-icon>description</mat-icon>
              Print Summary
            </button>
            <button mat-icon-button mat-dialog-close class="close-button">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <mat-dialog-content class="dialog-content">
          <!-- Rental Summary Section -->
          <div class="rental-summary-section">
            <h3>Rental Summary</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Customer:</span>
                <span class="summary-value">{{ data.customer?.firstName }} ({{ data.customer?.phone }})</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total Rentals:</span>
                <span class="summary-value">{{ data.rentals.length }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Rental Date:</span>
                <span class="summary-value">{{ data.rentals[0]?.rentalDate | date:'MMM dd, yyyy' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Expected Return:</span>
                <span class="summary-value">{{ data.rentals[0]?.expectedReturnDate | date:'MMM dd, yyyy' }}</span>
              </div>
            </div>
          </div>

          <!-- Rentals Table -->
          <div class="rentals-table-container">
            <table mat-table [dataSource]="data.rentals" class="customer-rentals-table">
              
              <!-- Rental ID Column -->
              <ng-container matColumnDef="rentalId">
                <th mat-header-cell *matHeaderCellDef>Rental #</th>
                <td mat-cell *matCellDef="let rental">
                  <div class="rental-id">Rental #{{ rental.id }}</div>
                </td>
              </ng-container>

              <!-- Costume Column -->
              <ng-container matColumnDef="costume">
                <th mat-header-cell *matHeaderCellDef>Costume</th>
                <td mat-cell *matCellDef="let rental">
                  <div class="costume-info">
                    <div class="costume-name">{{ rental.costume?.name || 'Unknown' }}</div>
                    <div class="costume-details">
                      <span class="category">{{ rental.costume?.category }}</span>
                      <span class="size" *ngIf="rental.costume?.size"> - Size: {{ rental.costume.size }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Daily Price Column -->
              <ng-container matColumnDef="dailyPrice">
                <th mat-header-cell *matHeaderCellDef>Daily Price</th>
                <td mat-cell *matCellDef="let rental">
                  <div class="price-info">₹{{ rental.costume?.sellPrice | number:'1.2-2' }}</div>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let rental">
                  <mat-chip [class]="getStatusClass(rental.status)" class="status-chip">
                    {{ rental.status }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Notes Column -->
              <ng-container matColumnDef="notes">
                <th mat-header-cell *matHeaderCellDef>Notes</th>
                <td mat-cell *matCellDef="let rental">
                  <div class="notes-cell">
                    {{ rental.notes || '-' }}
                    <div class="costume-notes" *ngIf="rental.costume?.size">
                      Size: {{ rental.costume.size }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Table Headers and Rows -->
              <tr mat-header-row *matHeaderRowDef="customerRentalsDisplayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: customerRentalsDisplayedColumns;" class="rental-row"></tr>
            </table>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions class="dialog-actions">
          <button mat-stroked-button mat-dialog-close class="close-btn">
            <mat-icon>close</mat-icon>
            Close
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

    /* Header Styles */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px 0;
      border-bottom: 2px solid #e0e0e0;
    }

    .page-title {
      color: #333;
      font-size: 2em;
      font-weight: 600;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }

    .grouped-view-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-lg);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      border: 2px solid var(--primary-color);
      color: var(--primary-color);
    }

    .grouped-view-btn[color="primary"] {
      background: var(--primary-color);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 122, 142, 0.3);
    }

    .grouped-view-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 122, 142, 0.25);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: var(--space-4);
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
        flex-wrap: wrap;
      }

      .grouped-view-btn {
        width: auto;
        justify-content: center;
      }
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

    .instruction-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #e8f4f8, #f0f8ff);
      border-radius: 8px;
      border: 1px solid rgba(0, 122, 142, 0.2);
    }

    .instruction-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--primary-color);
      margin-bottom: 16px;
    }

    .instruction-message p {
      margin: 8px 0;
      color: var(--text-primary);
    }

    .instruction-message ol {
      text-align: left;
      margin: 16px 0;
      padding-left: 20px;
    }

    .instruction-message ol li {
      margin: 8px 0;
      color: var(--text-secondary);
    }

    .instruction-message ol li mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      vertical-align: middle;
      margin: 0 4px;
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
      background-color:rgb(96, 87, 158);
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

    /* Bill Generation Section */
    .bill-generation-section {
      margin-top: 20px;
      padding: 15px;
      background: rgba(0, 122, 142, 0.05);
      border: 1px solid rgba(0, 122, 142, 0.2);
      border-radius: 8px;
    }

    .bill-generation-section .mat-mdc-checkbox {
      margin-bottom: 0;
    }

    .checkbox-description {
      margin: 8px 0 0 32px;
      font-size: 14px;
      color: #666;
      line-height: 1.4;
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

    .return-all-customer-btn {
      background: linear-gradient(135deg, var(--success-color), #4ade80) !important;
      color: white !important;
      border: none !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(45, 144, 39, 0.3) !important;
      margin-right: var(--space-2) !important;
    }

    .return-all-customer-btn:hover:not([disabled]) {
      background: linear-gradient(135deg, #1e7e34, var(--success-color)) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 16px rgba(45, 144, 39, 0.4) !important;
    }

    .return-all-customer-btn[disabled] {
      background: linear-gradient(135deg, #6c757d, #868e96) !important;
      color: rgba(255, 255, 255, 0.7) !important;
      transform: none !important;
      box-shadow: none !important;
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

    /* Bills Styles */
    .bills-container {
      margin-bottom: 30px;
      border: 2px solid #007A8E;
    }

    .bills-container mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: linear-gradient(135deg, #007A8E, #016BD1);
      color: white;
    }

    .bills-container mat-card-title {
      color: white !important;
      margin: 0;
    }

    .bills-actions {
      display: flex;
      gap: 10px;
    }

    .bills-actions button {
      color: white;
      border-color: white;
    }

    .print-customer-button {
      background: linear-gradient(135deg, #00B2A9, #FDF958) !important;
      color: #333 !important;
      font-weight: 600 !important;
      border: none !important;
    }

    .print-customer-button:hover {
      background: linear-gradient(135deg, #FDF958, #00B2A9) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 178, 169, 0.3);
    }

    .bills-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    }

    .bill-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      background: #fafafa;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.3s ease;
    }

    .bill-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .bill-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #007A8E;
    }

    .bill-header h3 {
      margin: 0;
      color: #007A8E;
      font-size: 18px;
    }

    .bill-content {
      display: grid;
      gap: 16px;
    }

    .customer-info, .rental-info, .bill-info {
      background: white;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #007A8E;
    }

    .customer-info h4, .rental-info h4, .bill-info h4 {
      margin: 0 0 8px 0;
      color: #016BD1;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .customer-info p, .rental-info p, .bill-info p {
      margin: 4px 0;
      font-size: 13px;
      line-height: 1.4;
    }

    .total-amount {
      font-size: 16px !important;
      font-weight: bold;
      color: #016BD1 !important;
      background: #e8f4f8;
      padding: 8px;
      border-radius: 4px;
      text-align: center;
    }

    .status-pending {
      color: #f57c00;
      font-weight: bold;
    }

    .status-paid {
      color: #2e7d32;
      font-weight: bold;
    }

    .status-overdue {
      color: #d32f2f;
      font-weight: bold;
    }

    /* Rental Print Section */
    .rental-print-container {
      background: #f8f9fa;
      border: 2px solid #007A8E;
      margin: 20px 0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 122, 142, 0.1);
    }

    .rental-print-container mat-card-header {
      background: linear-gradient(135deg, #007A8E 0%, #00B2A9 100%);
      color: white;
      border-radius: 10px 10px 0 0;
      padding: 20px;
    }

    .rental-print-container mat-card-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }

    .rental-print-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 15px;
    }

    .print-rental-button {
      background: #FDF958 !important;
      color: #007A8E !important;
      font-weight: 600;
    }

    .return-all-button {
      background: linear-gradient(135deg, var(--success-color), #4ade80) !important;
      color: white !important;
      border: none !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(45, 144, 39, 0.3) !important;
    }

    .return-all-button:hover:not([disabled]) {
      background: linear-gradient(135deg, #1e7e34, var(--success-color)) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 16px rgba(45, 144, 39, 0.4) !important;
    }

    .return-all-button[disabled] {
      background: linear-gradient(135deg, #6c757d, #868e96) !important;
      color: rgba(255, 255, 255, 0.7) !important;
      transform: none !important;
      box-shadow: none !important;
    }

    .print-summary-button {
      color: white !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
    }

    .rental-summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #007A8E;
    }

    .rental-summary h3 {
      color: #007A8E;
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 18px;
    }

    .rental-summary p {
      margin: 8px 0;
      font-size: 14px;
    }

    .rental-items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }

    .rental-item-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .rental-item-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .rental-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }

    .rental-item-header h4 {
      color: #007A8E;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .rental-item-details p {
      margin: 6px 0;
      font-size: 13px;
      line-height: 1.4;
    }

    /* Responsive Design for Rental Print */
    @media (max-width: 768px) {
      .rental-items-grid {
        grid-template-columns: 1fr;
      }
      
      .rental-print-actions {
        flex-direction: column;
        align-items: stretch;
      }
      
      .rental-print-actions button {
        width: 100%;
        margin: 5px 0;
      }
      
      .rental-summary {
        padding: 15px;
      }
    }

    @media (max-width: 768px) {
      .bills-grid {
        grid-template-columns: 1fr;
      }
      
      .bills-actions {
        flex-direction: column;
        width: 100%;
      }
      
      .bills-container mat-card-header {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
      }
    }

    /* Rentals Summary Section Styling */
    .rentals-summary-container {
      margin-bottom: var(--space-6);
    }

    .summary-message {
      text-align: center;
      padding: var(--space-8);
      background: linear-gradient(135deg, var(--background-secondary), var(--accent-cream));
      border-radius: var(--radius-lg);
      border: 2px solid var(--border-color);
      margin-bottom: var(--space-6);
    }

    .summary-message mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: var(--primary-color);
      margin-bottom: var(--space-4);
    }

    .summary-message h3 {
      color: var(--text-primary);
      font-family: var(--font-editorial);
      font-size: var(--font-size-h4);
      margin-bottom: var(--space-3);
    }

    .summary-message p {
      color: var(--text-secondary);
      font-size: var(--font-size-base);
      margin: 0;
      max-width: 600px;
      margin: 0 auto;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-6);
      margin-top: var(--space-6);
    }

    .stat-item {
      text-align: center;
      padding: var(--space-6);
      background: var(--background-primary);
      border-radius: var(--radius-lg);
      border: 2px solid var(--border-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .stat-item::before {
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

    .stat-item:hover {
      transform: translateY(-4px) scale(1.02);
      border-color: var(--primary-color);
      box-shadow: 0 8px 25px rgba(0, 122, 142, 0.15), var(--shadow-lg);
    }

    .stat-item:hover::before {
      opacity: 1;
    }

    .stat-item:nth-child(1)::before {
      background: linear-gradient(90deg, var(--success-color), var(--primary-light));
    }

    .stat-item:nth-child(2)::before {
      background: linear-gradient(90deg, var(--info-color), var(--secondary-color));
    }

    .stat-item:nth-child(3)::before {
      background: linear-gradient(90deg, var(--error-color), var(--warning-color));
    }

    .stat-item:nth-child(4)::before {
      background: linear-gradient(90deg, var(--accent-gold), var(--accent-purple));
    }

    .stat-number {
      font-family: var(--font-editorial);
      font-size: var(--font-size-3xl);
      font-weight: 800;
      color: var(--primary-color);
      margin-bottom: var(--space-2);
      line-height: 1;
    }

    .stat-label {
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }

    @media (max-width: 768px) {
      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
      }

      .stat-item {
        padding: var(--space-4);
      }

      .stat-number {
        font-size: var(--font-size-2xl);
      }

      .stat-label {
        font-size: var(--font-size-xs);
      }
    }



    /* Customer Rentals Dialog Styling */
    .customer-rentals-dialog {
      min-height: 600px;
    }

    .customer-rentals-dialog .dialog-header {
      background: linear-gradient(135deg, #007A8E, #016BD1);
      color: white;
      padding: var(--space-6);
      margin: calc(-1 * var(--space-6));
      margin-bottom: var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .customer-rentals-dialog .dialog-title-content {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .customer-rentals-dialog .dialog-title-content h2 {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 700;
    }

    .customer-rentals-dialog .dialog-icon {
      font-size: 2rem;
      color: var(--accent-color);
    }

    .customer-rentals-dialog .header-actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }

    .customer-rentals-dialog .print-summary-btn {
      background: var(--accent-color);
      color: var(--text-dark);
      font-weight: 600;
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-md);
      border: none;
      transition: all 0.3s ease;
    }

    .customer-rentals-dialog .print-summary-btn:hover {
      background: var(--accent-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(253, 249, 88, 0.3);
    }

    .customer-rentals-dialog .close-button {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .customer-rentals-dialog .close-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .customer-rentals-dialog .dialog-content {
      padding: 0;
      max-height: 60vh;
      overflow-y: auto;
    }

    .rental-summary-section {
      background: linear-gradient(135deg, #f8f9fa, #e8f4f8);
      padding: var(--space-6);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-6);
      border: 1px solid rgba(0, 122, 142, 0.1);
    }

    .rental-summary-section h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--primary-color);
      font-size: var(--font-size-lg);
      font-weight: 600;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .summary-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 600;
    }

    .summary-value {
      font-size: var(--font-size-base);
      color: var(--text-primary);
      font-weight: 700;
    }

    .rentals-table-container {
      background: white;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid rgba(0, 122, 142, 0.1);
    }

    .customer-rentals-table {
      width: 100%;
    }

    .customer-rentals-table .mat-mdc-header-cell {
      background: linear-gradient(135deg, #007A8E, #016BD1);
      color: white;
      font-weight: 700;
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: var(--space-4);
      border-bottom: none;
    }

    .customer-rentals-table .mat-mdc-cell {
      padding: var(--space-4);
      border-bottom: 1px solid rgba(0, 122, 142, 0.1);
    }

    .customer-rentals-table .rental-row {
      transition: all 0.3s ease;
    }

    .customer-rentals-table .rental-row:hover {
      background: rgba(0, 178, 169, 0.05);
    }

    .rental-id {
      font-weight: 700;
      color: var(--primary-color);
      font-size: var(--font-size-base);
    }

    .costume-info .costume-name {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .costume-info .costume-details {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .costume-info .category {
      color: var(--secondary-color);
      font-weight: 500;
    }

    .costume-info .size {
      color: var(--text-tertiary);
    }

    .price-info {
      font-weight: 700;
      color: var(--secondary-color);
      font-size: var(--font-size-base);
    }

    .notes-cell {
      max-width: 150px;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .costume-notes {
      margin-top: var(--space-1);
      font-style: italic;
      color: var(--text-tertiary);
    }

    .customer-rentals-dialog .dialog-actions {
      padding: var(--space-6);
      border-top: 1px solid rgba(0, 122, 142, 0.1);
      background: linear-gradient(135deg, #f8f9fa, #e8f4f8);
      justify-content: center;
    }

    .customer-rentals-dialog .close-btn {
      padding: var(--space-3) var(--space-8);
      border: 2px solid var(--primary-color);
      color: var(--primary-color);
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .customer-rentals-dialog .close-btn:hover {
      background: var(--primary-color);
      color: white;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .customer-rentals-dialog .header-actions {
        flex-direction: column;
        gap: var(--space-2);
      }

      .customer-rentals-dialog .print-summary-btn {
        width: 100%;
        justify-content: center;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .customer-rentals-table {
        font-size: var(--font-size-sm);
      }

      .customer-rentals-table .mat-mdc-cell,
      .customer-rentals-table .mat-mdc-header-cell {
        padding: var(--space-2);
      }

      .return-all-customer-btn {
        font-size: var(--font-size-xs) !important;
        padding: var(--space-2) var(--space-3) !important;
        margin-bottom: var(--space-2) !important;
      }

      .actions-cell {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: var(--space-2) !important;
      }
    }
  `]
})
export class RentalsComponent implements OnInit {
  @ViewChild('rentalDetailsDialog') rentalDetailsDialog!: TemplateRef<any>;
  @ViewChild('customerRentalsDialog') customerRentalsDialog!: TemplateRef<any>;
  
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
  customerRentalsDisplayedColumns: string[] = ['rentalId', 'costume', 'dailyPrice', 'status', 'notes'];
  rentalForm: FormGroup;
  
  // Add MatTableDataSource for better table handling
  dataSource = new MatTableDataSource<Rental>([]);
  groupedDataSource = new MatTableDataSource<CustomerRentalGroup>([]);
  
  // View mode toggle (only grouped view available)
  isGroupedView = true;
  
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
  
  // Bills state
  createdBills: Bill[] = [];
  showBills = false;
  
  // Rental printing state
  createdRentals: Rental[] = [];
  showRentalPrint = false;
  returningAll = false;
  returningCustomerRentals: number | null = null;

  constructor(
    private rentalService: RentalService,
    private customerService: CustomerService,
    private costumeService: CostumeService,
    private billService: BillService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    // Set default expected return date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.rentalForm = this.fb.group({
      firstName: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
      address: [''],
      rentalDate: [new Date(), Validators.required],
      expectedReturnDate: [tomorrow, Validators.required],
      notes: [''],
      generateBillsImmediately: [true] // Default to true for convenience
    });
  }

  ngOnInit() {
    console.log('RentalsComponent ngOnInit called');
    console.log('Initial rentalForm state:', this.rentalForm.value);
    console.log('Form valid:', this.rentalForm.valid);
    console.log('Form errors:', this.rentalForm.errors);
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
        
        // Always show grouped view since individual view is removed
        if (this.isGroupedView) {
          this.groupRentalsByCustomer();
        }
        
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
      
      // IMPORTANT: Get the bill generation setting BEFORE resetting the form
      const shouldGenerateBills = this.rentalForm.get('generateBillsImmediately')?.value;
      console.log(`Bill generation setting:`, shouldGenerateBills);
      
      // Store created rentals for printing
      this.createdRentals = [...successfulRentals];
      this.showRentalPrint = true;
      
      this.resetFormAndClose();
      
      if (successfulRentals.length === requests.length) {
        if (shouldGenerateBills === true) {
          // Fetch bills for the successful rentals and display them
          this.fetchAndDisplayBills(successfulRentals);
          this.snackBar.open(`Customer created and all ${successfulRentals.length} rentals created successfully. Bills generated!`, 'Close', { duration: 4000 });
        } else {
          this.snackBar.open(`Customer created and all ${successfulRentals.length} rentals created successfully. You can generate bills later from the Bills section.`, 'Close', { duration: 4000 });
        }
      } else if (successfulRentals.length > 0) {
        if (shouldGenerateBills === true) {
          // Fetch bills for the successful rentals and display them
          this.fetchAndDisplayBills(successfulRentals);
          this.snackBar.open(`Customer created and ${successfulRentals.length} out of ${requests.length} rentals created successfully. Bills generated!`, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(`Customer created and ${successfulRentals.length} out of ${requests.length} rentals created successfully. You can generate bills later from the Bills section.`, 'Close', { duration: 5000 });
        }
      } else {
        this.snackBar.open(`Customer created but failed to create any rentals. Please check backend connection.`, 'Close', { duration: 6000 });
      }
      
      this.loading = false;
      return;
    }

    const request = requests[index];
    const shouldGenerateBill = this.rentalForm.get('generateBillsImmediately')?.value;
    console.log(`Creating rental ${index + 1}/${requests.length}:`, request);
    console.log(`Bill generation option:`, shouldGenerateBill);
    
    this.rentalService.createRental(request, shouldGenerateBill).subscribe({
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

  fetchAndDisplayBills(rentals: Rental[]) {
    // Get the customer ID from the first rental (all rentals should be for the same customer)
    if (rentals.length > 0) {
      const customerId = rentals[0].customer.id!;
      const rentalIds = rentals.map(r => r.id);
      
      console.log('Fetching bills for rentals:', rentalIds);
      
      // Add a small delay to ensure bills are generated on the backend
      setTimeout(() => {
        this.billService.getBillsByCustomer(customerId).subscribe({
          next: (bills) => {
            console.log('All bills for customer:', bills);
            // Filter bills to only show the ones for the newly created rentals
            this.createdBills = bills.filter(bill => rentalIds.includes(bill.rental.id));
            console.log('Filtered bills for new rentals:', this.createdBills);
            
            if (this.createdBills.length > 0) {
              this.showBills = true;
              this.snackBar.open(`${this.createdBills.length} bills generated and ready for printing!`, 'Close', { duration: 3000 });
            } else {
              // If no bills found, try to generate them manually
              console.warn('No bills found for the created rentals, generating them manually...');
              this.generateMissingBills(rentals);
            }
          },
          error: (error) => {
            console.error('Error fetching bills:', error);
            this.snackBar.open('Rentals created successfully, but could not fetch bills', 'Close', { duration: 3000 });
          }
        });
      }, 1000); // 1 second delay to ensure bills are generated
    }
  }

  generateMissingBills(rentals: Rental[]) {
    console.log('Generating bills for rentals:', rentals.map(r => r.id));
    
    // Generate bills sequentially
    this.generateBillsSequentially(rentals, 0, []);
  }

  generateBillsSequentially(rentals: Rental[], index: number, generatedBills: Bill[]) {
    if (index >= rentals.length) {
      // All bills processed
      if (generatedBills.length > 0) {
        this.createdBills = generatedBills;
        this.showBills = true;
        this.snackBar.open(`${generatedBills.length} bills generated and ready for printing!`, 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Rentals created but could not generate bills. Please check the Bills section.', 'Close', { duration: 4000 });
      }
      return;
    }

    const rental = rentals[index];
    this.billService.generateBill(rental.id!).subscribe({
      next: (bill) => {
        console.log(`Bill generated for rental ${rental.id}:`, bill);
        generatedBills.push(bill);
        this.generateBillsSequentially(rentals, index + 1, generatedBills);
      },
      error: (error) => {
        console.error(`Error generating bill for rental ${rental.id}:`, error);
        // Continue with next rental even if this one fails
        this.generateBillsSequentially(rentals, index + 1, generatedBills);
      }
    });
  }

  printBill(bill: Bill) {
    const printContent = this.generateBillPrintContent(bill);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  printAllBills() {
    if (this.createdBills.length === 0) return;
    
    let allBillsContent = this.generateAllBillsPrintContent(this.createdBills);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(allBillsContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  printAllBillsForCustomer() {
    if (this.createdBills.length === 0) return;
    
    // Generate customer-friendly version with additional instructions
    let customerBillsContent = this.generateCustomerBillsPrintContent(this.createdBills);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(customerBillsContent);
      printWindow.document.close();
      printWindow.print();
      
      // Show success message
      this.snackBar.open(`${this.createdBills.length} bill(s) ready for customer`, 'Close', { duration: 3000 });
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

  generateAllBillsPrintContent(bills: Bill[]): string {
    const billsHtml = bills.map(bill => {
      return `
        <div class="bill-container" style="page-break-after: always;">
          ${this.generateBillPrintContent(bill).match(/<div class="bill-container">[\s\S]*<\/div>\s*<\/body>/)?.[0]?.replace('<div class="bill-container">', '').replace('</body>', '') || ''}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>All Bills</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            background: white;
          }
          .bill-container { 
            max-width: 600px; 
            margin: 0 auto 40px auto; 
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
            .bill-container { 
              border: none;
              page-break-after: always;
            }
            .bill-container:last-child {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        ${bills.map(bill => this.generateBillPrintContent(bill).match(/<div class="bill-container">[\s\S]*?<\/div>/)?.[0] || '').join('')}
      </body>
      </html>
    `;
  }

  generateCustomerBillsPrintContent(bills: Bill[]): string {
    const billsHtml = bills.map(bill => {
      return `
        <div class="customer-bill-page" style="page-break-after: always;">
          <div class="bill-container">
            <div class="header">
              <h1>Costume Rental Receipt</h1>
              <h2>Bill #${bill.id}</h2>
              <div class="business-info">
                <p><strong>CostumeRental Pro</strong></p>
                <p>Thank you for choosing our premium costume rental service!</p>
              </div>
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
              <h3>Payment Details</h3>
              ${bill.lateFee && bill.lateFee > 0 ? `<p><strong>Late Fee:</strong> ₹${bill.lateFee}</p>` : ''}
              ${bill.damageFee && bill.damageFee > 0 ? `<p><strong>Damage Fee:</strong> ₹${bill.damageFee}</p>` : ''}
              ${bill.discount && bill.discount > 0 ? `<p><strong>Discount:</strong> -₹${bill.discount}</p>` : ''}
              <p><strong>Status:</strong> ${bill.status}</p>
            </div>

            <div class="total">
              <strong>Total Amount: ₹${bill.totalAmount}</strong>
            </div>

            <div class="customer-instructions">
              <h3>Important Instructions</h3>
              <ul>
                <li>Please return the costume by the expected return date to avoid late fees</li>
                <li>Any damage to the costume will incur additional charges</li>
                <li>Keep this receipt for your records</li>
                <li>Contact us if you need to extend the rental period</li>
                <li>Late returns are subject to additional daily charges</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>We hope you enjoy your costume rental experience</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Bills - CostumeRental Pro</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 0;
            color: #333;
            background: white;
          }
          .customer-bill-page {
            min-height: 100vh;
            padding: 20px;
          }
          .bill-container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 30px;
            border: 2px solid #007A8E;
            border-radius: 10px;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 3px solid #007A8E;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #007A8E; 
            font-size: 32px;
            margin: 0 0 10px 0;
          }
          .header h2 { 
            color: #016BD1; 
            font-size: 24px;
            margin: 0 0 15px 0;
          }
          .business-info {
            margin-top: 15px;
          }
          .business-info p {
            margin: 5px 0;
            color: #666;
          }
          .bill-info { 
            margin-bottom: 25px; 
            text-align: center;
            background: #f0f8ff;
            padding: 15px;
            border-radius: 8px;
          }
          .section { 
            margin-bottom: 25px; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #007A8E;
          }
          .section h3 { 
            color: #007A8E; 
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 1px solid #007A8E;
            padding-bottom: 8px;
            font-size: 18px;
          }
          .section p { 
            margin: 10px 0; 
            line-height: 1.6;
            font-size: 14px;
          }
          .total { 
            font-size: 24px; 
            font-weight: bold; 
            color: #016BD1;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #e8f4f8, #f0f8ff);
            border-radius: 10px;
            margin: 30px 0;
            border: 2px solid #016BD1;
          }
          .customer-instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .customer-instructions h3 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
          }
          .customer-instructions ul {
            margin: 0;
            padding-left: 20px;
          }
          .customer-instructions li {
            margin: 8px 0;
            line-height: 1.5;
            color: #856404;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 2px solid #007A8E;
            color: #007A8E;
          }
          .footer p {
            margin: 8px 0;
            font-size: 16px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .customer-bill-page { 
              page-break-after: always;
              min-height: auto;
            }
            .customer-bill-page:last-child {
              page-break-after: auto;
            }
            .bill-container { 
              border: 2px solid #007A8E;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        ${billsHtml}
      </body>
      </html>
    `;
  }

  closeBills() {
    this.showBills = false;
    this.createdBills = [];
  }

  // Rental Print Methods
  closeRentalPrint() {
    this.showRentalPrint = false;
    this.createdRentals = [];
  }







  generateSingleRentalPrintContent(rental: Rental): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rental Details - #${rental.id}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #007A8E;
            padding-bottom: 20px;
          }
          .company-name { 
            color: #007A8E; 
            font-size: 28px; 
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .rental-title { 
            color: #016BD1; 
            font-size: 20px;
            margin: 10px 0;
          }
          .rental-container {
            background: #f8f9fa;
            border: 2px solid #007A8E;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
          }
          .section { 
            margin-bottom: 20px; 
            padding: 15px;
            background: white;
            border-radius: 8px;
            border-left: 4px solid #00B2A9;
          }
          .section h3 { 
            color: #007A8E; 
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: 600;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .status-active {
            color: #2e7d32;
            font-weight: bold;
            background: #e8f5e8;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            font-size: 12px;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 2px solid #007A8E;
            color: #007A8E;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .rental-container { 
              border: 2px solid #007A8E;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="company-name">Costume Rental System</h1>
          <h2 class="rental-title">Rental Agreement - #${rental.id}</h2>
          <p>Rental Date: ${this.formatDateForPrint(rental.rentalDate)}</p>
        </div>
        
        <div class="rental-container">
          <div class="section">
            <h3>Customer Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${rental.customer.firstName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${rental.customer.phone}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${rental.customer.email || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address:</span>
                <span class="info-value">${rental.customer.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Costume Details</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Costume Name:</span>
                <span class="info-value">${rental.costume.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Category:</span>
                <span class="info-value">${rental.costume.category}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Daily Price:</span>
                <span class="info-value">₹${rental.costume.sellPrice}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value status-active">${rental.status}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Rental Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Rental Date:</span>
                <span class="info-value">${this.formatDateForPrint(rental.rentalDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Expected Return:</span>
                <span class="info-value">${this.formatDateForPrint(rental.expectedReturnDate)}</span>
              </div>
              ${rental.notes ? `
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Notes:</span>
                <span class="info-value">${rental.notes}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for choosing our costume rental service!</strong></p>
          <p>Please return the costume in good condition by the expected return date.</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  generateAllRentalsPrintContent(rentals: Rental[]): string {
    const customer = rentals[0].customer;
    const rentalsHtml = rentals.map(rental => `
      <div class="rental-item">
        <div class="rental-header">
          <h3>Rental #${rental.id}</h3>
          <span class="status-active">${rental.status}</span>
        </div>
        <div class="rental-details">
          <div class="detail-row">
            <span class="label">Costume:</span>
            <span class="value">${rental.costume.name}</span>
          </div>
          <div class="detail-row">
            <span class="label">Category:</span>
            <span class="value">${rental.costume.category}</span>
          </div>
          <div class="detail-row">
            <span class="label">Daily Price:</span>
            <span class="value">₹${rental.costume.sellPrice}</span>
          </div>
          ${rental.notes ? `
          <div class="detail-row">
            <span class="label">Notes:</span>
            <span class="value">${rental.notes}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>All Rentals - ${customer.firstName}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #007A8E;
            padding-bottom: 20px;
          }
          .company-name { 
            color: #007A8E; 
            font-size: 28px; 
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .customer-section {
            background: #f8f9fa;
            border: 2px solid #007A8E;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .customer-section h3 {
            color: #007A8E;
            margin-top: 0;
          }
          .rental-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
            page-break-inside: avoid;
          }
          .rental-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .rental-header h3 {
            color: #007A8E;
            margin: 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .label {
            font-weight: 600;
            color: #555;
          }
          .value {
            color: #333;
          }
          .status-active {
            color: #2e7d32;
            font-weight: bold;
            background: #e8f5e8;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            font-size: 12px;
          }
          .summary {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 2px solid #007A8E;
            color: #007A8E;
          }
          @media print {
            body { margin: 0; padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="company-name">Costume Rental System</h1>
          <h2>All Rental Agreements</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="customer-section">
          <h3>Customer Information</h3>
          <div class="detail-row">
            <span class="label">Name:</span>
            <span class="value">${customer.firstName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone:</span>
            <span class="value">${customer.phone}</span>
          </div>
          <div class="detail-row">
            <span class="label">Email:</span>
            <span class="value">${customer.email || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Address:</span>
            <span class="value">${customer.address || 'N/A'}</span>
          </div>
        </div>

        <div class="summary">
          <h3>Rental Summary</h3>
          <div class="detail-row">
            <span class="label">Total Rentals:</span>
            <span class="value">${rentals.length}</span>
          </div>
          <div class="detail-row">
            <span class="label">Rental Date:</span>
            <span class="value">${this.formatDateForPrint(rentals[0].rentalDate)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Expected Return:</span>
            <span class="value">${this.formatDateForPrint(rentals[0].expectedReturnDate)}</span>
          </div>
        </div>

        <h3>Rental Details</h3>
        ${rentalsHtml}

        <div class="footer">
          <p><strong>Thank you for choosing our costume rental service!</strong></p>
          <p>Please return all costumes in good condition by the expected return date.</p>
        </div>
      </body>
      </html>
    `;
  }

  generateRentalSummaryPrintContent(rentals: Rental[]): string {
    const customer = rentals[0].customer;
    const totalPrice = rentals.reduce((sum, rental) => sum + rental.costume.sellPrice, 0);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rental Summary - ${customer.firstName}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #007A8E;
            padding-bottom: 20px;
          }
          .company-name { 
            color: #007A8E; 
            font-size: 28px; 
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .summary-container {
            background: #f8f9fa;
            border: 2px solid #007A8E;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .summary-table th,
          .summary-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .summary-table th {
            background: #007A8E;
            color: white;
            font-weight: 600;
          }
          .summary-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .total-row {
            background: #e8f4f8 !important;
            font-weight: bold;
            border-top: 2px solid #007A8E;
          }
          .section {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border-left: 4px solid #00B2A9;
          }
          .section h3 {
            color: #007A8E;
            margin-top: 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 2px solid #007A8E;
            color: #007A8E;
          }
          @media print {
            body { margin: 0; padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="company-name">Costume Rental System</h1>
          <h2>Rental Summary</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary-container">
          <div class="section">
            <h3>Customer Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span>Name:</span>
                <span>${customer.firstName}</span>
              </div>
              <div class="info-item">
                <span>Phone:</span>
                <span>${customer.phone}</span>
              </div>
              <div class="info-item">
                <span>Email:</span>
                <span>${customer.email || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span>Address:</span>
                <span>${customer.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Rental Overview</h3>
            <div class="info-grid">
              <div class="info-item">
                <span>Total Items:</span>
                <span>${rentals.length}</span>
              </div>
              <div class="info-item">
                <span>Rental Date:</span>
                <span>${this.formatDateForPrint(rentals[0].rentalDate)}</span>
              </div>
              <div class="info-item">
                <span>Expected Return:</span>
                <span>${this.formatDateForPrint(rentals[0].expectedReturnDate)}</span>
              </div>
              <div class="info-item">
                <span>Total Daily Price:</span>
                <span>₹${totalPrice}</span>
              </div>
            </div>
          </div>

          <table class="summary-table">
            <thead>
              <tr>
                <th>Rental ID</th>
                <th>Costume Name</th>
                <th>Category</th>
                <th>Daily Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rentals.map(rental => `
                <tr>
                  <td>#${rental.id}</td>
                  <td>${rental.costume.name}</td>
                  <td>${rental.costume.category}</td>
                  <td>₹${rental.costume.sellPrice}</td>
                  <td>${rental.status}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3"><strong>Total Daily Price</strong></td>
                <td><strong>₹${totalPrice}</strong></td>
                <td><strong>${rentals.length} Items</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p><strong>Thank you for choosing our costume rental service!</strong></p>
          <p>Please return all costumes in good condition by the expected return date.</p>
        </div>
      </body>
      </html>
    `;
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

  returnAllRentals() {
    if (!this.createdRentals || this.createdRentals.length === 0) {
      this.snackBar.open('No rentals to return', 'Close', { duration: 3000 });
      return;
    }

    const activeRentals = this.createdRentals.filter(rental => rental.status === 'ACTIVE');
    
    if (activeRentals.length === 0) {
      this.snackBar.open('All rentals have already been returned or cancelled', 'Close', { duration: 3000 });
      return;
    }

    const customerName = this.createdRentals[0].customer.firstName;
    const confirmMessage = `Are you sure you want to return all ${activeRentals.length} rented items for ${customerName}?\n\nThis will mark all active rentals as returned with today's date.`;
    
    if (confirm(confirmMessage)) {
      this.returningAll = true;
      const actualReturnDate = new Date();
      const returnRequest = {
        actualReturnDate: this.formatDate(actualReturnDate)
      };

      let completedReturns = 0;
      let totalToReturn = activeRentals.length;
      const errors: string[] = [];

      activeRentals.forEach((rental, index) => {
        this.rentalService.returnCostume(rental.id!, returnRequest).subscribe({
          next: (updatedRental) => {
            completedReturns++;
            
            // Update the rental in the createdRentals array
            const rentalIndex = this.createdRentals.findIndex(r => r.id === rental.id);
            if (rentalIndex !== -1) {
              this.createdRentals[rentalIndex] = updatedRental;
            }

            // Check if all returns are completed
            if (completedReturns + errors.length === totalToReturn) {
              this.handleBulkReturnCompletion(completedReturns, errors, customerName, actualReturnDate);
            }
          },
          error: (error) => {
            console.error(`Error returning costume "${rental.costume.name}":`, error);
            errors.push(rental.costume.name);
            
            // Check if all returns are completed (including errors)
            if (completedReturns + errors.length === totalToReturn) {
              this.handleBulkReturnCompletion(completedReturns, errors, customerName, actualReturnDate);
            }
          }
        });
      });
    }
  }

  private handleBulkReturnCompletion(completedReturns: number, errors: string[], customerName: string, returnDate: Date) {
    this.returningAll = false;
    
    // Reload data to ensure consistency
    this.loadRentals();
    this.loadAvailableCostumes();

    if (errors.length === 0) {
      // All returns successful
      this.snackBar.open(
        `🎉 All ${completedReturns} items returned successfully for ${customerName} on ${this.formatDate(returnDate)}!`, 
        'Close', 
        { duration: 5000 }
      );
      
      // Close the print dialog after successful bulk return
      setTimeout(() => {
        this.closeRentalPrint();
      }, 1000);
    } else if (completedReturns > 0) {
      // Partial success
      this.snackBar.open(
        `✅ ${completedReturns} items returned successfully. ❌ ${errors.length} failed: ${errors.join(', ')}`, 
        'Close', 
        { duration: 7000 }
      );
    } else {
      // All failed
      this.snackBar.open(
        `❌ Failed to return any items. Please try again or return items individually.`, 
        'Close', 
        { duration: 5000 }
      );
    }
  }

  returnAllCustomerRentals(group: CustomerRentalGroup) {
    if (!group || !group.customer) {
      this.snackBar.open('Customer information missing', 'Close', { duration: 3000 });
      return;
    }

    const activeRentals = group.rentals.filter(rental => rental.status === 'ACTIVE');
    
    if (activeRentals.length === 0) {
      this.snackBar.open('No active rentals found for this customer', 'Close', { duration: 3000 });
      return;
    }

    const customerName = group.customer.firstName || 'Unknown Customer';
    const confirmMessage = `Are you sure you want to return all ${activeRentals.length} active rental(s) for ${customerName}?\n\nThis will mark all active rentals as returned with today's date.`;
    
    if (confirm(confirmMessage)) {
      this.returningCustomerRentals = group.customer.id || null;
      const actualReturnDate = new Date();
      const returnRequest = {
        actualReturnDate: this.formatDate(actualReturnDate)
      };

      let completedReturns = 0;
      let totalToReturn = activeRentals.length;
      const errors: string[] = [];

      activeRentals.forEach((rental) => {
        this.rentalService.returnCostume(rental.id!, returnRequest).subscribe({
          next: (updatedRental) => {
            completedReturns++;
            
            // Update the rental in the group
            const rentalIndex = group.rentals.findIndex(r => r.id === rental.id);
            if (rentalIndex !== -1) {
              group.rentals[rentalIndex] = updatedRental;
            }

            // Check if all returns are completed
            if (completedReturns + errors.length === totalToReturn) {
              this.handleCustomerBulkReturnCompletion(completedReturns, errors, customerName, actualReturnDate, group);
            }
          },
          error: (error) => {
            console.error(`Error returning costume "${rental.costume.name}" for ${customerName}:`, error);
            errors.push(rental.costume.name);
            
            // Check if all returns are completed (including errors)
            if (completedReturns + errors.length === totalToReturn) {
              this.handleCustomerBulkReturnCompletion(completedReturns, errors, customerName, actualReturnDate, group);
            }
          }
        });
      });
    }
  }

  private handleCustomerBulkReturnCompletion(
    completedReturns: number, 
    errors: string[], 
    customerName: string, 
    returnDate: Date,
    group: CustomerRentalGroup
  ) {
    this.returningCustomerRentals = null;
    
    // Update group counts
    group.activeCount = Math.max(0, group.activeCount - completedReturns);
    group.returnedCount += completedReturns;
    
    // Reload data to ensure consistency
    this.loadRentals();
    this.loadAvailableCostumes();

    if (errors.length === 0) {
      // All returns successful
      this.snackBar.open(
        `🎉 All ${completedReturns} items returned successfully for ${customerName} on ${this.formatDate(returnDate)}!`, 
        'Close', 
        { duration: 5000 }
      );
    } else if (completedReturns > 0) {
      // Partial success
      this.snackBar.open(
        `✅ ${completedReturns} items returned successfully for ${customerName}. ❌ ${errors.length} failed: ${errors.join(', ')}`, 
        'Close', 
        { duration: 7000 }
      );
    } else {
      // All failed
      this.snackBar.open(
        `❌ Failed to return any items for ${customerName}. Please try again or return items individually.`, 
        'Close', 
        { duration: 5000 }
      );
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
    // Always set to grouped view since individual view is removed
    this.isGroupedView = true;
    this.groupRentalsByCustomer();
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
    // Open the new customer rentals dialog
    const dialogRef = this.dialog.open(this.customerRentalsDialog, {
      data: {
        customer: group.customer,
        rentals: group.rentals,
        totalAmount: group.totalAmount,
        activeCount: group.activeCount,
        returnedCount: group.returnedCount,
        cancelledCount: group.cancelledCount
      },
      width: '90%',
      maxWidth: '1200px',
      height: '80%',
      panelClass: 'customer-rentals-dialog-panel'
    });
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
    
    // Set default values for all fields
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.rentalForm.patchValue({ 
      firstName: '',
      phone: '',
      email: '',
      address: '',
      rentalDate: new Date(),
      expectedReturnDate: tomorrow,
      notes: '',
      generateBillsImmediately: true
    });
    
    this.showAddForm = false;
    // Reset rental print state
    this.showRentalPrint = false;
    this.createdRentals = [];
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
    
    // Set default values for all fields
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.rentalForm.patchValue({ 
      firstName: '',
      phone: '',
      email: '',
      address: '',
      rentalDate: new Date(),
      expectedReturnDate: tomorrow,
      notes: '',
      generateBillsImmediately: true
    });
    // Note: Don't reset rental print state here since we want to show created rentals
    
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

  private formatDateForPrint(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Statistical methods for the summary section
  getTotalActiveRentals(): number {
    return this.rentals.filter(rental => rental.status === 'ACTIVE').length;
  }

  getTotalReturnedRentals(): number {
    return this.rentals.filter(rental => rental.status === 'RETURNED').length;
  }

  getTotalOverdueRentals(): number {
    const today = new Date();
    return this.rentals.filter(rental => {
      if (rental.status === 'ACTIVE') {
        const expectedReturnDate = new Date(rental.expectedReturnDate);
        return expectedReturnDate < today;
      }
      return rental.status === 'OVERDUE';
    }).length;
  }

  getTotalRentalRevenue(): number {
    return this.rentals.reduce((total, rental) => {
      if (rental.costume?.sellPrice) {
        const duration = this.getDurationInDays(rental);
        return total + (rental.costume.sellPrice * duration);
      }
      return total;
    }, 0);
  }

  // Wrapper function for created rentals print functionality
  printRentalSummary(): void {
    console.log('printRentalSummary called');
    console.log('createdRentals:', this.createdRentals);
    
    if (!this.createdRentals || this.createdRentals.length === 0) {
      console.error('No created rentals found for printing');
      this.snackBar.open('No rentals available for printing', 'Close', { duration: 3000 });
      return;
    }
    
    if (!this.createdRentals[0].customer) {
      console.error('Customer information missing from first rental');
      this.snackBar.open('Customer information missing. Cannot print summary.', 'Close', { duration: 3000 });
      return;
    }
    
    try {
      // Use the new print function with created rentals
      this.printRentalSummaryForCustomer(this.createdRentals, this.createdRentals[0].customer);
    } catch (error) {
      console.error('Error printing rental summary:', error);
      this.snackBar.open('Error printing summary. Please try again.', 'Close', { duration: 3000 });
    }
  }



  printRentalSummaryForCustomer(rentals: Rental[], customer: Customer): void {
    console.log('printRentalSummaryForCustomer called with:', { rentals, customer });
    
    if (!rentals || rentals.length === 0) {
      console.error('No rentals provided for printing');
      this.snackBar.open('No rentals data available for printing', 'Close', { duration: 3000 });
      return;
    }
    
    if (!customer) {
      console.error('No customer provided for printing');
      this.snackBar.open('Customer information missing for printing', 'Close', { duration: 3000 });
      return;
    }
    
    // Create minimal summary print content
    const customerName = customer?.firstName || 'Unknown Customer';
    const customerPhone = customer?.phone || 'N/A';
    const customerEmail = customer?.email || 'N/A';
    const customerAddress = customer?.address || 'N/A';
    
    let totalAmount = 0;
    const rentalSummary = rentals.map((rental, index) => {
      const dailyPrice = rental.costume?.sellPrice || 0;
      totalAmount += dailyPrice;
      
      return `
        <tr>
          <td>Rental #${rental.id}</td>
          <td>${rental.costume?.name || 'Unknown'}</td>
          <td>${rental.costume?.category || 'N/A'}</td>
          <td>${rental.costume?.size || 'N/A'}</td>
          <td>₹${dailyPrice.toFixed(2)}</td>
          <td>${rental.status}</td>
        </tr>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rental Summary - ${customerName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .document-title {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .print-date {
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
          }
          .customer-section {
            margin-bottom: 20px;
          }
          .customer-section h3 {
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .customer-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .customer-table td {
            padding: 5px 10px;
            border: 1px solid #ddd;
          }
          .customer-table td:first-child {
            font-weight: bold;
            background: #f8f9fa;
            width: 120px;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
          }
          .summary-table th,
          .summary-table td {
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
          }
          .summary-table th {
            background: #f8f9fa;
            font-weight: bold;
          }
          .summary-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .total-row {
            background: #e8f4f8 !important;
            font-weight: bold;
          }
          @media print {
            body { margin: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Costume Rental Service</div>
          <div class="document-title">Rental Summary</div>
          <div class="print-date">Generated on: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>

        <div class="customer-section">
          <h3>Customer Information</h3>
          <table class="customer-table">
            <tr>
              <td>Customer Name:</td>
              <td>${customerName}</td>
            </tr>
            <tr>
              <td>Phone Number:</td>
              <td>${customerPhone}</td>
            </tr>
            <tr>
              <td>Email Address:</td>
              <td>${customerEmail}</td>
            </tr>
            <tr>
              <td>Address:</td>
              <td>${customerAddress}</td>
            </tr>
          </table>
        </div>

        <table class="summary-table">
          <thead>
            <tr>
              <th>Rental</th>
              <th>Costume</th>
              <th>Category</th>
              <th>Size</th>
              <th>Daily Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rentalSummary}
            <tr class="total-row">
              <td colspan="4"><strong>Total Rentals: ${rentals.length}</strong></td>
              <td><strong>₹${totalAmount.toFixed(2)}</strong></td>
              <td><strong>Total</strong></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Immediately trigger print dialog without delay
        printWindow.print();
        
        // Close the window after printing
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
        });
        
        // Fallback: close window after a delay if afterprint doesn't fire
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
          }
        }, 1000);
      } else {
        // Popup was blocked
        console.error('Print window was blocked by popup blocker');
        this.snackBar.open('Popup blocked! Please allow popups for this site to print the summary.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error opening print window:', error);
      this.snackBar.open('Error opening print window. Please check your browser settings.', 'Close', { duration: 5000 });
    }
  }
}