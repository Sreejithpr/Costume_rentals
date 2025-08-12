import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';


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
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Costumes</h1>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm">
          <mat-icon>add</mat-icon>
          Add Costume
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
              <mat-label>Sell Price</mat-label>
              <input matInput type="number" step="0.01" formControlName="sellPrice" required>
              <span matPrefix>₹</span>
            </mat-form-field>
            <mat-form-field class="form-field">
              <mat-label>Original Price</mat-label>
              <input matInput type="number" step="0.01" formControlName="originalPrice" required>
              <span matPrefix>₹</span>
            </mat-form-field>
          </div>
          <div class="form-row">
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

    <!-- Edit Costume Dialog Template -->
    <ng-template #editCostumeDialog let-data>
      <div class="edit-costume-dialog">
        <div mat-dialog-title class="dialog-header">
          <div class="dialog-title-content">
            <mat-icon class="dialog-icon">edit</mat-icon>
            <h2>Edit Costume - {{ data.costume.name }}</h2>
            <mat-chip [class]="data.costume.available ? 'status-available' : 'status-rented'" class="status-chip">
              {{ data.costume.available ? 'Available' : 'Rented' }}
            </mat-chip>
          </div>
          <button mat-icon-button mat-dialog-close class="close-button">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-dialog-content class="dialog-content">
          <form [formGroup]="editCostumeForm" (ngSubmit)="updateCostume()">
            <div class="form-grid">
              <mat-form-field class="form-field">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" required>
                <mat-icon matSuffix>label</mat-icon>
              </mat-form-field>
              
              <mat-form-field class="form-field full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="Enter costume description"></textarea>
                <mat-icon matSuffix>description</mat-icon>
              </mat-form-field>

              <mat-form-field class="form-field">
                <mat-label>Category</mat-label>
                <input matInput formControlName="category" required placeholder="e.g., Traditional, Modern, Fantasy">
                <mat-icon matSuffix>category</mat-icon>
              </mat-form-field>

              <mat-form-field class="form-field">
                <mat-label>Size</mat-label>
                <mat-select formControlName="size" required>
                  <mat-option value="XS">XS - Extra Small</mat-option>
                  <mat-option value="S">S - Small</mat-option>
                  <mat-option value="M">M - Medium</mat-option>
                  <mat-option value="L">L - Large</mat-option>
                  <mat-option value="XL">XL - Extra Large</mat-option>
                  <mat-option value="XXL">XXL - Double Extra Large</mat-option>
                  <mat-option value="One Size">One Size</mat-option>
                </mat-select>
                <mat-icon matSuffix>straighten</mat-icon>
              </mat-form-field>

              <mat-form-field class="form-field">
                <mat-label>Sell Price</mat-label>
                <input matInput type="number" step="0.01" formControlName="sellPrice" required>
                <span matPrefix>₹</span>
                <mat-icon matSuffix>payments</mat-icon>
              </mat-form-field>

              <mat-form-field class="form-field">
                <mat-label>Original Price</mat-label>
                <input matInput type="number" step="0.01" formControlName="originalPrice" required>
                <span matPrefix>₹</span>
                <mat-icon matSuffix>price_change</mat-icon>
              </mat-form-field>

              <mat-form-field class="form-field">
                <mat-label>Stock Quantity</mat-label>
                <input matInput type="number" formControlName="stockQuantity" required min="1">
                <mat-hint>Number of units available</mat-hint>
                <mat-icon matSuffix>inventory</mat-icon>
              </mat-form-field>

              <mat-form-field class="form-field">
                <mat-label>Availability</mat-label>
                <mat-select formControlName="available">
                  <mat-option [value]="true">✅ Available</mat-option>
                  <mat-option [value]="false">❌ Not Available</mat-option>
                </mat-select>
                <mat-icon matSuffix>toggle_on</mat-icon>
              </mat-form-field>
            </div>
          </form>
        </mat-dialog-content>

        <mat-dialog-actions class="dialog-actions">
          <button mat-stroked-button mat-dialog-close type="button" class="cancel-btn">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
          <button mat-raised-button color="primary" 
                  (click)="updateCostume()" 
                  [disabled]="!editCostumeForm.valid"
                  class="update-btn">
            <mat-icon>save</mat-icon>
            Update Costume
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>

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
              <th mat-header-cell *matHeaderCellDef>Sell Price</th>
              <td mat-cell *matCellDef="let costume">
                ₹{{ costume.sellPrice | number:'1.2-2' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="originalPrice">
              <th mat-header-cell *matHeaderCellDef>Original Price</th>
              <td mat-cell *matCellDef="let costume">
                ₹{{ costume.originalPrice | number:'1.2-2' }}
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
                        matTooltip="Edit costume">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button 
                        color="warn" 
                        (click)="deleteCostume(costume.id)"
                        matTooltip="Delete costume">
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

    /* Edit Costume Dialog Styles */
    .edit-costume-dialog {
      min-width: 600px;
    }

    .dialog-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: var(--space-6);
      margin: calc(-1 * var(--space-6));
      margin-bottom: var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dialog-title-content {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex: 1;
    }

    .dialog-title-content h2 {
      margin: 0;
      font-family: var(--font-editorial);
      font-size: var(--font-size-h4);
      font-weight: 700;
      color: white;
    }

    .dialog-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .close-button {
      color: white !important;
    }

    .dialog-content {
      padding: var(--space-6);
      max-height: 60vh;
      overflow-y: auto;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
      align-items: start;
    }

    .form-field {
      width: 100%;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .dialog-actions {
      padding: var(--space-6);
      margin: calc(-1 * var(--space-6));
      margin-top: var(--space-6);
      background: var(--background-secondary);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-4);
    }

    .update-btn {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
      color: white !important;
    }

    .cancel-btn {
      color: var(--text-secondary) !important;
      border-color: var(--border-color) !important;
    }

    .status-chip {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-xl);
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
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

      .edit-costume-dialog {
        min-width: auto;
        width: 100%;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .dialog-header {
        padding: var(--space-4);
        margin: calc(-1 * var(--space-4));
        margin-bottom: var(--space-4);
      }

      .dialog-title-content h2 {
        font-size: var(--font-size-h5);
      }

      .dialog-content {
        padding: var(--space-4);
      }

      .dialog-actions {
        padding: var(--space-4);
        margin: calc(-1 * var(--space-4));
        margin-top: var(--space-4);
        flex-direction: column;
      }
    }
  `]
})
export class CostumesComponent implements OnInit {
  costumes: Costume[] = [];
  filteredCostumes: Costume[] = [];
  loading = false;
  showAddForm = false;

  showAvailableOnly = false;
  searchTerm = '';
  editingCostume: Costume | null = null;
  displayedColumns: string[] = ['name', 'category', 'size', 'price', 'originalPrice', 'stock', 'availability', 'actions'];
  costumeForm: FormGroup;
  editCostumeForm: FormGroup;

  @ViewChild('editCostumeDialog') editCostumeDialog!: TemplateRef<any>;

  constructor(
    private costumeService: CostumeService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.costumeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      size: ['', Validators.required],
      sellPrice: ['', [Validators.required, Validators.min(0.01)]],
      originalPrice: ['', [Validators.required, Validators.min(0.01)]],
      stockQuantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.editCostumeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      size: ['', Validators.required],
      sellPrice: ['', [Validators.required, Validators.min(0.01)]],
      originalPrice: ['', [Validators.required, Validators.min(0.01)]],
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
      this.loading = true;
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
          this.loading = false;
          this.snackBar.open('Costume added successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error adding costume:', error);
          this.loading = false;
          this.showAddForm = false; // Close form even on error
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
      sellPrice: costume.sellPrice,
      originalPrice: costume.originalPrice,
      stockQuantity: costume.stockQuantity || 1,
      available: costume.available
    });
    this.openEditCostumeDialog(costume);
  }

  openEditCostumeDialog(costume: Costume): void {
    const dialogRef = this.dialog.open(this.editCostumeDialog, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { costume: costume },
      panelClass: 'edit-costume-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated') {
        this.loadCostumes();
      }
      this.editingCostume = null;
    });
  }

  updateCostume() {
    if (this.editCostumeForm.valid && this.editingCostume) {
      this.loading = true;
      const updatedCostume: Costume = {
        ...this.editCostumeForm.value,
        id: this.editingCostume.id
      };
      
      this.costumeService.updateCostume(this.editingCostume.id!, updatedCostume).subscribe({
        next: (costume) => {
          // Close dialog and reload data
          this.dialog.closeAll();
          this.loadCostumes();
          this.loading = false;
          this.snackBar.open('Costume updated successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error updating costume:', error);
          this.loading = false;
          this.dialog.closeAll(); // Close dialog even on error
          this.snackBar.open('Error updating costume', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelEdit() {
    this.editingCostume = null;
    this.editCostumeForm.reset();
    this.loading = false; // Ensure loading state is reset
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
    this.loading = false; // Ensure loading state is reset
  }
}