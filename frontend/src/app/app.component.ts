import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Costume Rental Billing System</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/dashboard">
        <mat-icon>dashboard</mat-icon>
        Dashboard
      </button>
      <button mat-button routerLink="/customers">
        <mat-icon>people</mat-icon>
        Customers
      </button>
      <button mat-button routerLink="/costumes">
        <mat-icon>checkroom</mat-icon>
        Costumes
      </button>
      <button mat-button routerLink="/rentals">
        <mat-icon>assignment</mat-icon>
        Rentals
      </button>
      <button mat-button routerLink="/bills">
        <mat-icon>receipt</mat-icon>
        Bills
      </button>
    </mat-toolbar>
    
    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    
    mat-toolbar button {
      margin-left: 10px;
    }
    
    .container {
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'costume-rental-frontend';
}