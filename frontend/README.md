# Costume Rental Billing System - Frontend

Angular frontend application for the costume rental billing system.

## 🏗️ Technology Stack

- **Framework**: Angular 17
- **UI Library**: Angular Material
- **Language**: TypeScript
- **Build Tool**: Angular CLI
- **Styling**: CSS with Material Design

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/                    # Feature components
│   │   │   ├── dashboard/
│   │   │   ├── customers/
│   │   │   ├── costumes/
│   │   │   ├── rentals/
│   │   │   └── bills/
│   │   ├── models/                        # TypeScript interfaces
│   │   │   ├── customer.model.ts
│   │   │   ├── costume.model.ts
│   │   │   ├── rental.model.ts
│   │   │   └── bill.model.ts
│   │   ├── services/                      # API services
│   │   │   ├── customer.service.ts
│   │   │   ├── costume.service.ts
│   │   │   ├── rental.service.ts
│   │   │   └── bill.service.ts
│   │   ├── app.component.ts               # Root component
│   │   ├── app.routes.ts                  # Routing configuration
│   │   └── app.config.ts                  # App configuration
│   ├── assets/                            # Static assets
│   ├── styles.css                         # Global styles
│   └── index.html                         # Main HTML file
├── angular.json                           # Angular CLI configuration
├── package.json                           # Dependencies
└── tsconfig.json                          # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Angular CLI 17+

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Angular CLI globally (if not installed):**
   ```bash
   npm install -g @angular/cli@17
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start development server:**
   ```bash
   ng serve
   ```

5. **Access the application:**
   - URL: `http://localhost:4200`
   - The app will automatically reload when you change source files

### Building for Production

```bash
# Build for production
ng build --configuration production

# Output will be in dist/ directory
# Serve with any web server (nginx, Apache, etc.)
```

## 🎨 Features & Components

### Dashboard Component
- **Route**: `/dashboard`
- **Features**: 
  - System statistics overview
  - Recent rental activity
  - Pending bills summary
  - Quick navigation to other modules

### Customers Component
- **Route**: `/customers`
- **Features**:
  - View all customers in a data table
  - Add new customers with form validation
  - Search customers by name or email
  - Edit/delete customer records
  - Responsive design

### Costumes Component
- **Route**: `/costumes`
- **Features**:
  - Browse costume inventory
  - Filter by availability status
  - Search by name or category
  - Add new costumes with categories and pricing
  - Track rental status

### Rentals Component
- **Route**: `/rentals`
- **Features**:
  - Create new rentals
  - View active, overdue, and returned rentals
  - Process costume returns
  - Cancel active rentals
  - Filter and sort rental records

### Bills Component
- **Route**: `/bills`
- **Features**:
  - View all bills with status filtering
  - Process payments with multiple methods
  - Add damage fees and discounts
  - Track overdue bills
  - Revenue summaries

## 🔧 Services & API Integration

### HTTP Services
All services extend Angular's HttpClient for API communication:

```typescript
// Example: Customer Service
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private apiUrl = 'http://localhost:8080/api/customers';
  
  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }
  // ... other methods
}
```

### API Configuration
Base API URL is configured in each service. To change:
1. Update the `apiUrl` property in each service file
2. Or create an environment configuration

### Error Handling
Services include error handling with user-friendly notifications:
```typescript
.subscribe({
  next: (data) => { /* handle success */ },
  error: (error) => {
    this.snackBar.open('Error message', 'Close', { duration: 3000 });
  }
});
```

## 🎨 UI/UX Design

### Material Design
The application uses Angular Material components:
- Material icons for consistent iconography
- Material cards for content organization
- Material forms with validation
- Material tables for data display
- Material buttons and navigation

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Responsive tables
- Collapsible navigation on mobile

### Theme & Styling
- Primary color: Indigo (#3f51b5)
- Global styles in `src/styles.css`
- Component-specific styles in component files
- Material theme: `indigo-pink` (customizable)

## 📱 Responsive Features

### Mobile Optimization
- Touch-friendly interface
- Swipe gestures support
- Responsive data tables
- Mobile navigation menu

### Desktop Features
- Full data tables with sorting
- Multi-column layouts
- Keyboard shortcuts
- Advanced filtering options

## 🔧 Development

### Development Server
```bash
ng serve
# Runs on http://localhost:4200
# Hot reload enabled
# Opens browser automatically with --open flag
```

### Code Generation
```bash
# Generate new component
ng generate component components/new-feature

# Generate new service
ng generate service services/new-service

# Generate new model
ng generate interface models/new-model
```

### Linting & Formatting
```bash
# Run linter
ng lint

# Format code (if Prettier is configured)
npm run format
```

### Testing
```bash
# Run unit tests
ng test

# Run e2e tests
ng e2e

# Run tests with coverage
ng test --coverage
```

## ⚙️ Configuration

### Environment Configuration
Create environment files for different deployments:

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api'
};
```

### Angular Material Theme
Customize theme in `src/styles.css`:
```css
@import '@angular/material/prebuilt-themes/indigo-pink.css';
/* Or create custom theme */
```

### Routing Configuration
Routes are configured in `app.routes.ts` with lazy loading:
```typescript
export const routes: Routes = [
  { 
    path: 'customers', 
    loadComponent: () => import('./components/customers/customers.component')
      .then(m => m.CustomersComponent)
  },
  // ... other routes
];
```

## 🚀 Deployment

### Build Process
1. **Production build:**
   ```bash
   ng build --configuration production
   ```

2. **Output location:** `dist/costume-rental-frontend/`

3. **Deploy to web server:** Copy contents of dist folder

### Web Server Configuration
For SPA routing, configure server to redirect all routes to `index.html`:

**Nginx example:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache example:**
```apache
RewriteEngine On
RewriteRule ^(?!.*\.).*$ /index.html [L]
```

### Environment Variables
For Docker or cloud deployments, replace environment values at build time.

## 🧪 Testing Strategy

### Unit Testing
- Component testing with Angular Testing Utilities
- Service testing with HttpClientTestingModule
- Model validation testing

### Integration Testing
- Component interaction testing
- Service integration testing
- End-to-end user flows

### Testing Best Practices
- Mock external dependencies
- Test user interactions
- Test error scenarios
- Maintain good test coverage

## 🔧 Troubleshooting

### Common Issues

1. **CORS errors:**
   - Ensure backend CORS is configured
   - Check browser console for specific errors
   - Verify API URLs in services

2. **Module not found errors:**
   - Run `npm install` to ensure dependencies
   - Check import paths in TypeScript files
   - Verify Angular CLI version compatibility

3. **Build errors:**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Update Angular CLI: `ng update @angular/cli`
   - Check TypeScript version compatibility

4. **Styling issues:**
   - Ensure Angular Material theme is imported
   - Check component-specific styles
   - Verify Material icons are loaded

### Performance Optimization
- Use OnPush change detection strategy
- Implement virtual scrolling for large datasets
- Lazy load feature modules
- Optimize bundle size with tree shaking

## 📦 Dependencies

### Main Dependencies
```json
{
  "@angular/core": "^17.0.0",
  "@angular/material": "^17.0.0",
  "@angular/cdk": "^17.0.0",
  "rxjs": "~7.8.0"
}
```

### Development Dependencies
```json
{
  "@angular/cli": "^17.0.0",
  "typescript": "~5.2.0",
  "karma": "~6.4.0",
  "jasmine": "~5.1.0"
}
```

## 🎯 Future Enhancements

### Planned Features
- Advanced search and filtering
- Data export functionality
- Print receipts and invoices
- Email notifications
- Multi-language support
- Dark theme option

### Performance Improvements
- Implement pagination for large datasets
- Add caching for frequently accessed data
- Optimize images and assets
- Implement service worker for offline support

## 📝 Contributing

1. Follow Angular style guide
2. Write unit tests for new features
3. Use meaningful commit messages
4. Update documentation for new features
5. Test on different screen sizes

## 🐛 Known Issues

- Large datasets may cause performance issues (pagination planned)
- Mobile keyboard may overlap forms on some devices
- Print functionality not yet implemented

---

For backend API documentation, see `../backend/README.md`