# SQLite to PostgreSQL Migration Guide

This guide documents the migration from SQLite to PostgreSQL for the Costume Rental Billing System.

## 🔄 Migration Summary

The project has been successfully migrated from SQLite to PostgreSQL for better performance, scalability, and production-readiness.

## 📋 Changes Made

### 1. Maven Dependencies (`backend/pom.xml`)
- **Removed**: SQLite JDBC driver (`sqlite-jdbc`)
- **Removed**: Hibernate community dialects (`hibernate-community-dialects`)
- **Added**: PostgreSQL JDBC driver (`postgresql`)

### 2. Database Configuration (`backend/src/main/resources/application.properties`)
- **Updated**: Database URL to PostgreSQL format
- **Updated**: Database driver class name
- **Updated**: Hibernate dialect for PostgreSQL
- **Updated**: Connection pool settings optimized for PostgreSQL

### 3. Health Check (`DatabaseHealthIndicator.java`)
- **Updated**: Database references from "SQLite" to "PostgreSQL"

### 4. Documentation Updates
- **Updated**: README.md with PostgreSQL setup instructions
- **Updated**: Backend README with PostgreSQL troubleshooting
- **Added**: Database setup prerequisites

### 5. Files Removed
- **Deleted**: `costume_rental.db` (SQLite database file)

### 6. Start Scripts
- **Updated**: Added PostgreSQL startup reminder

## 🚀 Setup Instructions

### Option 1: Using Docker (Recommended)

1. Start PostgreSQL service:
   ```bash
   docker-compose up -d
   ```

2. The database and user will be automatically created with the following credentials:
   - **Database**: `costume_rental`
   - **Username**: `costume_rental_user`
   - **Password**: `costume_rental_password`
   - **Port**: `5432`

### Option 2: Manual PostgreSQL Installation

1. Install PostgreSQL on your system
2. Create database and user by running:
   ```bash
   psql -U postgres -f backend/setup-database.sql
   ```

## 🔧 Configuration Details

### Database Connection
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/costume_rental
spring.datasource.username=costume_rental_user
spring.datasource.password=costume_rental_password
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

### Connection Pool Settings
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000
```

## 🗂️ Data Migration

Since this is a fresh migration, no existing data needs to be transferred. The application will automatically create the required tables on first startup using Hibernate's DDL auto-generation.

### Schema Creation
The application uses `spring.jpa.hibernate.ddl-auto=update` which will:
1. Create tables if they don't exist
2. Update schema if entities are modified
3. Preserve existing data during updates

## ✅ Verification Steps

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

2. **Verify database connection**:
   ```bash
   docker exec -it costume-rental-db psql -U costume_rental_user -d costume_rental
   ```

3. **Start the backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

4. **Check health endpoint**:
   ```bash
   curl http://localhost:8080/api/actuator/health
   ```
   Should return database status as "PostgreSQL"

## 🔍 Troubleshooting

### Common Issues

1. **PostgreSQL not running**:
   ```bash
   docker-compose ps
   docker-compose up -d
   ```

2. **Connection refused**:
   - Check if PostgreSQL is listening on port 5432
   - Verify credentials in `application.properties`

3. **Database doesn't exist**:
   ```bash
   docker exec -it costume-rental-db psql -U postgres -c "CREATE DATABASE costume_rental;"
   ```

4. **User permissions**:
   ```bash
   docker exec -it costume-rental-db psql -U postgres -f /docker-entrypoint-initdb.d/setup-database.sql
   ```

## 🎯 Benefits of PostgreSQL Migration

1. **Performance**: Better query optimization and indexing
2. **Scalability**: Supports concurrent connections
3. **ACID Compliance**: Full transaction support
4. **Production Ready**: Enterprise-grade database
5. **Rich Features**: Advanced data types and functions
6. **Backup & Recovery**: Robust backup solutions
7. **Monitoring**: Better monitoring and logging capabilities

## 🔄 Rollback (If Needed)

To rollback to SQLite (not recommended for production):

1. Restore SQLite dependencies in `pom.xml`
2. Update `application.properties` with SQLite configuration
3. Revert health check references
4. Remove PostgreSQL Docker container

## 📞 Support

If you encounter any issues during the migration:
1. Check the application logs for detailed error messages
2. Verify PostgreSQL service status
3. Ensure all dependencies are properly installed
4. Refer to the troubleshooting section above

The migration is now complete and the system is ready for production use with PostgreSQL!