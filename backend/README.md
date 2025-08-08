# Costume Rental Billing System - Backend

Spring Boot backend API for the costume rental billing system.

## 🏗️ Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL with Hibernate
- **Build Tool**: Maven
- **API**: RESTful web services

## 📁 Project Structure

```
backend/
├── src/main/java/com/costumerental/billing/
│   ├── CostumeRentalBillingApplication.java    # Main application class
│   ├── config/
│   │   └── CorsConfig.java                     # CORS configuration
│   ├── controller/                             # REST controllers
│   │   ├── BillController.java
│   │   ├── CostumeController.java
│   │   ├── CustomerController.java
│   │   └── RentalController.java
│   ├── model/                                  # JPA entities
│   │   ├── Bill.java
│   │   ├── Costume.java
│   │   ├── Customer.java
│   │   └── Rental.java
│   ├── repository/                             # Data access layer
│   │   ├── BillRepository.java
│   │   ├── CostumeRepository.java
│   │   ├── CustomerRepository.java
│   │   └── RentalRepository.java
│   └── service/                                # Business logic
│       ├── BillingService.java
│       └── RentalService.java
├── src/main/resources/
│   └── application.properties                  # Configuration
└── pom.xml                                     # Maven dependencies
```

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+ (or Docker for easy setup)

### Running the Application

1. **Set up PostgreSQL database:**
   
   **Option A: Using Docker (Recommended)**
   ```bash
   # From project root
   docker-compose up -d
   ```
   
   **Option B: Manual Setup**
   ```bash
   # Install PostgreSQL, then run:
   psql -U postgres -f backend/setup-database.sql
   ```

2. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

3. **Install dependencies:**
   ```bash
   mvn clean install
   ```

4. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

5. **Access the API:**
   - Base URL: `http://localhost:8080/api`
   - Health check: `http://localhost:8080/api/actuator/health` (if actuator is enabled)

### Building for Production

```bash
mvn clean package
java -jar target/billing-system-0.0.1-SNAPSHOT.jar
```

## 🗄️ Database

### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed):
   - Download from https://www.postgresql.org/download/
   - Or use Docker: `docker run --name costume-rental-db -e POSTGRES_PASSWORD=costume_rental_password -d -p 5432:5432 postgres`

2. **Create Database and User**:
   ```sql
   CREATE DATABASE costume_rental;
   CREATE USER costume_rental_user WITH PASSWORD 'costume_rental_password';
   GRANT ALL PRIVILEGES ON DATABASE costume_rental TO costume_rental_user;
   ```

3. **Configuration**:
   - Hibernate DDL: `update` (creates/updates tables automatically)
   - Connection pooling optimized for concurrent access

### Entity Relationships
```
Customer (1) ←→ (N) Rental (1) ←→ (1) Bill
Costume (1) ←→ (N) Rental
```

### Sample Data
The application starts with an empty database. Use the frontend or API calls to populate data.

## 🛠️ API Documentation

### Base URL
All endpoints are prefixed with `/api`

### Customer Endpoints
```http
GET    /customers              # Get all customers
POST   /customers              # Create customer
GET    /customers/{id}         # Get customer by ID
PUT    /customers/{id}         # Update customer
DELETE /customers/{id}         # Delete customer
GET    /customers/search       # Search customers (query param: term)
```

### Costume Endpoints
```http
GET    /costumes               # Get all costumes
GET    /costumes/available     # Get available costumes only
POST   /costumes               # Create costume
GET    /costumes/{id}          # Get costume by ID
PUT    /costumes/{id}          # Update costume
DELETE /costumes/{id}          # Delete costume
GET    /costumes/search        # Search costumes (query param: term)
GET    /costumes/categories    # Get all categories
GET    /costumes/sizes         # Get all sizes
```

### Rental Endpoints
```http
GET    /rentals                # Get all rentals
POST   /rentals                # Create rental (form params)
GET    /rentals/{id}           # Get rental by ID
GET    /rentals/active         # Get active rentals
GET    /rentals/overdue        # Get overdue rentals
GET    /rentals/customer/{id}  # Get rentals by customer
PUT    /rentals/{id}/return    # Return costume (query param: actualReturnDate)
PUT    /rentals/{id}/cancel    # Cancel rental
PUT    /rentals/{id}/notes     # Update rental notes
```

### Bill Endpoints
```http
GET    /bills                  # Get all bills
GET    /bills/{id}             # Get bill by ID
GET    /bills/pending          # Get pending bills
GET    /bills/overdue          # Get overdue bills
GET    /bills/customer/{id}    # Get bills by customer
GET    /bills/revenue          # Get revenue (query params: startDate, endDate)
PUT    /bills/{id}/fees        # Update fees (query params: damageFee, discount, notes)
PUT    /bills/{id}/pay         # Mark as paid (query param: paymentMethod)
```

## ⚙️ Configuration

### Application Properties
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/costume_rental
spring.datasource.username=costume_rental_user
spring.datasource.password=costume_rental_password
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Server
server.port=8080
server.servlet.context-path=/api

# CORS
spring.web.cors.allowed-origins=http://localhost:4200
```

### Environment Variables
You can override configuration using environment variables:
- `SERVER_PORT`: Change server port
- `DB_PATH`: Change database file location

## 🧪 Testing

### Running Tests
```bash
mvn test
```

### API Testing
Use tools like Postman, Insomnia, or curl to test endpoints:

```bash
# Get all customers
curl http://localhost:8080/api/customers

# Create a customer
curl -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John Doe","email":"john@example.com"}'
```

## 🔧 Development

### Hot Reload
Add Spring Boot DevTools dependency for hot reload during development:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
</dependency>
```

### Database Inspection
Use PostgreSQL tools to inspect the database:
- pgAdmin (GUI tool)
- psql (command line): `psql -U costume_rental_user -d costume_rental`
- DBeaver (Universal database tool)

### Logging
Adjust logging levels in `application.properties`:
```properties
logging.level.com.costumerental=DEBUG
logging.level.org.hibernate.SQL=DEBUG
```

## 🚨 Error Handling

The API uses standard HTTP status codes:
- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## 🔒 Security Considerations

### Current Security
- CORS configured for frontend origin
- Input validation using Bean Validation
- SQL injection prevention through JPA

### Production Recommendations
- Add authentication/authorization (Spring Security)
- Use HTTPS in production
- Implement rate limiting
- Add comprehensive logging and monitoring

## 📦 Dependencies

### Main Dependencies
- `spring-boot-starter-web`: Web MVC framework
- `spring-boot-starter-data-jpa`: JPA with Hibernate
- `spring-boot-starter-validation`: Bean validation
- `postgresql`: PostgreSQL database driver

### Development Dependencies
- `spring-boot-starter-test`: Testing framework
- `spring-boot-devtools`: Development tools (optional)

## 🐛 Troubleshooting

### Common Issues

1. **Database connection error:**
   - Ensure PostgreSQL is running
   - Check database credentials and connection string
   - Verify database and user exist

2. **CORS errors:**
   - Verify frontend URL in CORS configuration
   - Check browser console for specific CORS errors

3. **Port already in use:**
   - Change port in `application.properties`
   - Kill process using the port: `lsof -ti:8080 | xargs kill`

4. **PostgreSQL connection issues:**
   - Ensure PostgreSQL service is running
   - Verify database credentials and connection URL
   - Check if database and user exist (run setup-database.sql)

### Reset Database
Connect to PostgreSQL and drop/recreate the `costume_rental` database, or run the setup-database.sql script.

## 📝 Notes

- The application uses PostgreSQL for production-ready data persistence
- Bills are automatically generated when costumes are returned
- Late fees are calculated at 50% of daily rental rate per day
- The system prevents double-booking of costumes automatically