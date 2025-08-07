import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { 
    path: 'customers', 
    loadComponent: () => import('./components/customers/customers.component').then(m => m.CustomersComponent)
  },
  { 
    path: 'costumes', 
    loadComponent: () => import('./components/costumes/costumes.component').then(m => m.CostumesComponent)
  },
  { 
    path: 'rentals', 
    loadComponent: () => import('./components/rentals/rentals.component').then(m => m.RentalsComponent)
  },
  { 
    path: 'bills', 
    loadComponent: () => import('./components/bills/bills.component').then(m => m.BillsComponent)
  }
];