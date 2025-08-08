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
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CostumeService } from '../../services/costume.service';
import { Costume } from '../../models/costume.model';

@Component({
  selector: 'app-costumes',
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
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Costumes</h1>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm; showEditForm = false">
          <mat-icon>add</mat-icon>
          Add Costume
        </button>
        <button *ngIf="showEditForm" mat-stroked-button color="warn" (click)="cancelEdit()">
          <mat-icon>cancel</mat-icon>
          Cancel Edit
        </button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="search-form">
      <mat-form-field>
        <mat-label>Search costumes</mat-label>
        <input matInput 
               [(ngModel)]="searchTerm" 
               (keyup.enter)="searchCostumes()"
               placeholder="Enter name or category">
      </mat-form-field>
      <button mat-button (click)="searchCostumes()">Search</button>
      <button mat-button (click)="loadCostumes()">Clear</button>
      <button mat-button (click)="showAvailableOnly = !showAvailableOnly; filterCostumes()">
        {{ showAvailableOnly ? 'Show All' : 'Available Only' }}
      </button>
    </div>

    <!-- Add Costume Form -->
    <mat-card *ngIf="showAddForm" class="form-container">
      <mat-card-header>
        <mat-card-title>Add New Costume</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="costumeForm" (ngSubmit)="addCostume()">
          <mat-form-field class="form-field">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" required>
          </mat-form-field>
          <mat-form-field class="form-field">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>Category</mat-label>
              <input matInput formControlName="category" required>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Size</mat-label>
              <mat-select formControlName="size" required>
                <mat-option value="XS">XS</mat-option>
                <mat-option value="S">S</mat-option>
                <mat-option value="M">M</mat-option>
                <mat-option value="L">L</mat-option>
                <mat-option value="XL">XL</mat-option>
                <mat-option value="XXL">XXL</mat-option>
                <mat-option value="One Size">One Size</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>Daily Rental Price</mat-label>
              <input matInput type="number" step="0.01" formControlName="dailyRentalPrice" required>
              <span matPrefix>$</span>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Stock Quantity</mat-label>
              <input matInput type="number" formControlName="stockQuantity" required min="1">
              <mat-hint>Number of units available</mat-hint>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="!costumeForm.valid">
              Add Costume
            </button>
            <button mat-button type="button" (click)="cancelAdd()">Cancel</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Edit Costume Form -->
    <mat-card *ngIf="showEditForm" class="form-container">
      <mat-card-header>
        <mat-card-title>Edit Costume</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="editCostumeForm" (ngSubmit)="updateCostume()">
          <mat-form-field class="form-field">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" required>
          </mat-form-field>
          <mat-form-field class="form-field">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>Category</mat-label>
              <input matInput formControlName="category" required>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Size</mat-label>
              <mat-select formControlName="size" required>
                <mat-option value="XS">XS</mat-option>
                <mat-option value="S">S</mat-option>
                <mat-option value="M">M</mat-option>
                <mat-option value="L">L</mat-option>
                <mat-option value="XL">XL</mat-option>
                <mat-option value="XXL">XXL</mat-option>
                <mat-option value="One Size">One Size</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>Daily Rental Price</mat-label>
              <input matInput type="number" step="0.01" formControlName="dailyRentalPrice" required>
              <span matPrefix>$</span>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Stock Quantity</mat-label>
              <input matInput type="number" formControlName="stockQuantity" required min="1">
              <mat-hint>Number of units available</mat-hint>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field class="form-field">
              <mat-label>Availability</mat-label>
              <mat-select formControlName="available">
                <mat-option [value]="true">Available</mat-option>
                <mat-option [value]="false">Not Available</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="!editCostumeForm.valid">
              Update Costume
            </button>
            <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Costumes Table -->
    <div class="table-container">
      <mat-card>
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
          
          <table mat-table [dataSource]="filteredCostumes" *ngIf="!loading">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let costume">{{ costume.name }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let costume">{{ costume.category }}</td>
            </ng-container>

            <ng-container matColumnDef="size">
              <th mat-header-cell *matHeaderCellDef>Size</th>
              <td mat-cell *matCellDef="let costume">{{ costume.size }}</td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Daily Price</th>
              <td mat-cell *matCellDef="let costume">
                <span class="currency">₹{{ costume.dailyRentalPrice | number:'1.2-2' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Stock</th>
              <td mat-cell *matCellDef="let costume">
                <div class="stock-info">
                  <span class="stock-available">{{ costume.availableStock || costume.stockQuantity }}</span>
                  <span class="stock-separator">/</span>
                  <span class="stock-total">{{ costume.stockQuantity }}</span>
                </div>
                <div class="stock-label">Available/Total</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="availability">
              <th mat-header-cell *matHeaderCellDef>Availability</th>
              <td mat-cell *matCellDef="let costume">
                <mat-chip-set>
                  <mat-chip [class]="costume.available ? 'status-available' : 'status-rented'">
                    {{ costume.available ? 'Available' : 'Rented' }}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let costume">
                <button mat-icon-button 
                        (click)="editCostume(costume)"
                        matTooltip="Edit costume"
                        [disabled]="editingCostume?.id === costume.id">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button 
                        color="warn" 
                        (click)="deleteCostume(costume.id)"
                        matTooltip="Delete costume"
                        [disabled]="editingCostume?.id === costume.id">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="filteredCostumes.length === 0 && !loading" class="no-data">
            No costumes found
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
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

    .status-available {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-rented {
      background-color: #ffebee;
      color: #c62828;
    }

    .stock-info {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 1.1em;
    }

    .stock-available {
      color: #2e7d32;
      font-weight: bold;
    }

    .stock-separator {
      margin: 0 4px;
      color: #666;
    }

    .stock-total {
      color: #1565c0;
    }

    .stock-label {
      font-size: 0.75em;
      color: #666;
      text-align: center;
      margin-top: 2px;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .form-container {
      border-left: 4px solid #3f51b5;
      margin-bottom: 20px;
    }

    mat-card[class*="edit"] .mat-card-header {
      background-color: #f5f5f5;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CostumesComponent implements OnInit {
  costumes: Costume[] = [];
  filteredCostumes: Costume[] = [];
  loading = false;
  showAddForm = false;
  showEditForm = false;
  showAvailableOnly = false;
  searchTerm = '';
  editingCostume: Costume | null = null;
  displayedColumns: string[] = ['name', 'category', 'size', 'price', 'stock', 'availability', 'actions'];
  costumeForm: FormGroup;
  editCostumeForm: FormGroup;

  constructor(
    private costumeService: CostumeService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.costumeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      size: ['', Validators.required],
      dailyRentalPrice: ['', [Validators.required, Validators.min(0.01)]],
      stockQuantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.editCostumeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      size: ['', Validators.required],
      dailyRentalPrice: ['', [Validators.required, Validators.min(0.01)]],
      stockQuantity: [1, [Validators.required, Validators.min(1)]],
      available: [true]
    });
  }

  ngOnInit() {
    this.loadCostumes();
  }

  loadCostumes() {
    this.loading = true;
    this.costumeService.getAllCostumes().subscribe({
      next: (costumes) => {
        this.costumes = costumes;
        this.filterCostumes();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading costumes:', error);
        this.loading = false;
        this.snackBar.open('Error loading costumes', 'Close', { duration: 3000 });
      }
    });
  }

  searchCostumes() {
    if (!this.searchTerm.trim()) {
      this.loadCostumes();
      return;
    }

    this.loading = true;
    this.costumeService.searchCostumes(this.searchTerm).subscribe({
      next: (costumes) => {
        this.costumes = costumes;
        this.filterCostumes();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching costumes:', error);
        this.loading = false;
        this.snackBar.open('Error searching costumes', 'Close', { duration: 3000 });
      }
    });
  }

  filterCostumes() {
    if (this.showAvailableOnly) {
      this.filteredCostumes = this.costumes.filter(costume => costume.available);
    } else {
      this.filteredCostumes = this.costumes;
    }
  }

  addCostume() {
    if (this.costumeForm.valid) {
      const costume: Costume = {
        ...this.costumeForm.value,
        available: true
      };
      
      this.costumeService.createCostume(costume).subscribe({
        next: (newCostume) => {
          // Reload all data to ensure we have the latest information
          this.loadCostumes();
          this.costumeForm.reset();
          this.costumeForm.patchValue({ stockQuantity: 1 }); // Reset to default
          this.showAddForm = false;
          this.snackBar.open('Costume added successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error adding costume:', error);
          this.snackBar.open('Error adding costume', 'Close', { duration: 3000 });
        }
      });
    }
  }

  editCostume(costume: Costume) {
    this.editingCostume = costume;
    this.editCostumeForm.patchValue({
      name: costume.name,
      description: costume.description,
      category: costume.category,
      size: costume.size,
      dailyRentalPrice: costume.dailyRentalPrice,
      stockQuantity: costume.stockQuantity || 1,
      available: costume.available
    });
    this.showEditForm = true;
    this.showAddForm = false; // Close add form if open
  }

  updateCostume() {
    if (this.editCostumeForm.valid && this.editingCostume) {
      const updatedCostume: Costume = {
        ...this.editCostumeForm.value,
        id: this.editingCostume.id
      };
      
      this.costumeService.updateCostume(this.editingCostume.id!, updatedCostume).subscribe({
        next: (costume) => {
          // Reload all data to ensure we have the latest information
          this.loadCostumes();
          this.cancelEdit();
          this.snackBar.open('Costume updated successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error updating costume:', error);
          this.snackBar.open('Error updating costume', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelEdit() {
    this.showEditForm = false;
    this.editingCostume = null;
    this.editCostumeForm.reset();
  }

  deleteCostume(costumeId: number) {
    const costume = this.costumes.find(c => c.id === costumeId);
    const costumeName = costume ? costume.name : 'this costume';
    
    if (confirm(`Are you sure you want to delete "${costumeName}"? This action cannot be undone.`)) {
      this.costumeService.deleteCostume(costumeId).subscribe({
        next: () => {
          // Reload all data to ensure we have the latest information
          this.loadCostumes();
          this.snackBar.open(`"${costumeName}" deleted successfully`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting costume:', error);
          this.snackBar.open('Error deleting costume. It may be currently rented.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelAdd() {
    this.showAddForm = false;
    this.costumeForm.reset();
    this.showEditForm = false; // Also close edit form if open
  }
}