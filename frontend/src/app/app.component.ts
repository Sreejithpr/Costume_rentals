import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from './services/theme.service';

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
    <nav class="modern-navbar">
      <div class="navbar-brand">
        <mat-icon class="brand-icon">celebration</mat-icon>
        <span class="brand-text">CostumeRental</span>
        <span class="brand-subtitle">Pro</span>
      </div>
      
      <div class="navbar-nav">
        <a mat-button routerLink="/dashboard" routerLinkActive="active-link" class="nav-item">
          <mat-icon>dashboard</mat-icon>
          <span>Dashboard</span>
        </a>
        <a mat-button routerLink="/customers" routerLinkActive="active-link" class="nav-item">
          <mat-icon>people</mat-icon>
          <span>Customers</span>
        </a>
        <a mat-button routerLink="/costumes" routerLinkActive="active-link" class="nav-item">
          <mat-icon>checkroom</mat-icon>
          <span>Costumes</span>
        </a>
        <a mat-button routerLink="/rentals" routerLinkActive="active-link" class="nav-item">
          <mat-icon>assignment</mat-icon>
          <span>Rentals</span>
        </a>
      </div>
      
      <div class="navbar-actions">
        <button mat-icon-button class="theme-toggle-btn" (click)="toggleTheme()" [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        <button mat-icon-button class="notification-btn">
          <mat-icon>notifications</mat-icon>
        </button>
        <button mat-icon-button class="profile-btn">
          <mat-icon>account_circle</mat-icon>
        </button>
      </div>
    </nav>
    
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .modern-navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 70px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      box-shadow: var(--shadow-lg);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: white;
    }
    
    .brand-icon {
      font-size: 2rem;
      background: linear-gradient(135deg, var(--accent-gold), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .brand-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }
    
    .brand-subtitle {
      font-size: 0.75rem;
      color: var(--accent-gold);
      background: rgba(255, 255, 255, 0.1);
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .navbar-nav {
      display: flex;
      gap: 0.5rem;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.8) !important;
      padding: 0.75rem 1rem !important;
      border-radius: 0.75rem !important;
      transition: all 0.2s ease !important;
      font-weight: 500 !important;
    }
    
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
      transform: translateY(-1px);
    }
    
    .nav-item.active-link {
      background: rgba(255, 255, 255, 0.15) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .navbar-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .theme-toggle-btn,
    .notification-btn,
    .profile-btn {
      color: rgba(255, 255, 255, 0.8) !important;
      transition: all 0.2s ease !important;
    }
    
    .theme-toggle-btn:hover,
    .notification-btn:hover,
    .profile-btn:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
    }
    
    .theme-toggle-btn {
      background: linear-gradient(135deg, var(--accent-gold), var(--accent-purple)) !important;
      color: white !important;
      margin-right: 0.5rem !important;
    }
    
    .theme-toggle-btn:hover {
      background: linear-gradient(135deg, var(--accent-purple), var(--accent-gold)) !important;
      transform: rotate(180deg) !important;
    }
    
    .main-content {
      min-height: calc(100vh - 70px);
      background: var(--background-secondary);
    }
    
    @media (max-width: 768px) {
      .modern-navbar {
        padding: 0 1rem;
        height: 60px;
      }
      
      .navbar-nav {
        display: none;
      }
      
      .brand-text {
        font-size: 1.25rem;
      }
      
      .main-content {
        min-height: calc(100vh - 60px);
      }
    }
  `]
})
export class AppComponent {
  title = 'costume-rental-frontend';

  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}