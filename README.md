# Costume Rental Billing System

A comprehensive billing system for costume rental shops built with Spring Boot (backend) and Angular (frontend), using PostgreSQL as the database.

## 🏗️ Architecture

- **Backend**: Java Spring Boot with REST API
- **Frontend**: Angular 17 with Angular Material
- **Database**: PostgreSQL
- **Build Tools**: Maven (backend), npm/Angular CLI (frontend)

## 📋 Features

### Core Functionality
- **Customer Management**: Add, edit, search, and manage customer information
- **Costume Inventory**: Track costumes with categories, sizes, and pricing
- **Rental Management**: Create rentals, track active/overdue rentals, process returns
- **Billing System**: Automatic bill generation, payment processing, late fees, damage fees
- **Dashboard**: Overview of system statistics and recent activity

### Key Features
- Automatic bill calculation based on rental duration
- Late fee calculation for overdue returns
- Damage fee and discount management
- Multiple payment method support
- Real-time availability tracking
- Overdue rental notifications
- Revenue reporting

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- Node.js 16+ and npm
- Maven 3.6+
- Angular CLI 17+
- PostgreSQL 12+ (or Docker for containerized setup)
- Docker and Docker Compose (recommended for easy PostgreSQL setup)

### Database Setup (PostgreSQL)

1. Start PostgreSQL using Docker (recommended):
   ```bash
   docker-compose up -d
   ```

2. Or install PostgreSQL locally and run the setup script:
   ```bash
   psql -U postgres -f backend/setup-database.sql
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies and run the application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   The backend will connect to PostgreSQL automatically.

3. The backend server will start on `http://localhost:8080`

4. API documentation will be available at `http://localhost:8080/api`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

4. The frontend application will be available at `http://localhost:4200`

### Database

The PostgreSQL database needs to be set up before running the application. See the backend README for database setup instructions.

## 📊 Database Schema

### Tables
- **customers**: Customer information (name, email, phone, address)
- **costumes**: Costume inventory (name, category, size, daily price, availability)
- **rentals**: Rental records (customer, costume, dates, status)
- **bills**: Billing information (amounts, fees, payment status)

### Key Relationships
- One customer can have many rentals
- One costume can have many rentals (over time)
- Each rental has one bill
- Bills track payment status and additional fees

## 🎯 Usage Guide

### 1. Customer Management
- Add new customers with contact information
- Search customers by name or email
- View customer rental history

### 2. Costume Inventory
- Add costumes with categories, sizes, and daily rental prices
- Track availability status
- Filter by available costumes only
- Search by name or category

### 3. Creating Rentals
- Select customer and available costume
- Set rental and expected return dates
- Add optional notes
- System automatically marks costume as unavailable

### 4. Processing Returns
- Mark costumes as returned
- System automatically calculates bill amount
- Late fees are calculated for overdue returns
- Costume becomes available again

### 5. Billing Management
- View all bills with status filters
- Add damage fees or discounts
- Process payments with different methods
- Track overdue bills

### 6. Dashboard Overview
- View system statistics
- Monitor recent activity
- Quick access to all modules

## 🔧 API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/{id}` - Get customer by ID
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer
- `GET /api/customers/search?term={term}` - Search customers

### Costumes
- `GET /api/costumes` - Get all costumes
- `GET /api/costumes/available` - Get available costumes
- `POST /api/costumes` - Create new costume
- `PUT /api/costumes/{id}` - Update costume
- `DELETE /api/costumes/{id}` - Delete costume
- `GET /api/costumes/search?term={term}` - Search costumes

### Rentals
- `GET /api/rentals` - Get all rentals
- `POST /api/rentals` - Create new rental
- `GET /api/rentals/active` - Get active rentals
- `GET /api/rentals/overdue` - Get overdue rentals
- `PUT /api/rentals/{id}/return` - Return costume
- `PUT /api/rentals/{id}/cancel` - Cancel rental

### Bills
- `GET /api/bills` - Get all bills
- `GET /api/bills/pending` - Get pending bills
- `GET /api/bills/overdue` - Get overdue bills
- `PUT /api/bills/{id}/fees` - Update bill fees
- `PUT /api/bills/{id}/pay` - Mark bill as paid
- `GET /api/bills/revenue` - Get revenue report

## 🛠️ Development

### Backend Development
- Use Spring Boot DevTools for hot reload
- Database migrations handled by Hibernate
- API testing with tools like Postman or Insomnia

### Frontend Development
- Angular CLI for scaffolding and building
- Angular Material for UI components
- Hot reload enabled in development mode

### Testing
- Backend: Run `mvn test` in the backend directory
- Frontend: Run `ng test` in the frontend directory

## 📦 Deployment

### Backend Deployment
1. Build the JAR file:
   ```bash
   mvn clean package
   ```
2. Run the JAR:
   ```bash
   java -jar target/billing-system-0.0.1-SNAPSHOT.jar
   ```

### Frontend Deployment
1. Build for production:
   ```bash
   ng build --configuration production
   ```
2. Serve the `dist/` directory with any web server

## 🔒 Configuration

### Backend Configuration
Edit `application.properties` to modify:
- Server port
- Database location
- CORS settings

### Frontend Configuration
- API base URL in service files
- Angular Material theme in `styles.css`

## 🐛 Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend CORS is configured for frontend URL
2. **Database Issues**: Check PostgreSQL connection and credentials
3. **Port Conflicts**: Change ports in configuration files if needed

### Database Reset
To reset the database, connect to PostgreSQL and drop/recreate the database:
```sql
DROP DATABASE costume_rental;
CREATE DATABASE costume_rental;
GRANT ALL PRIVILEGES ON DATABASE costume_rental TO costume_rental_user;
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or issues, please create an issue in the repository or contact the development team.

---

Built with ❤️ for costume rental businesses