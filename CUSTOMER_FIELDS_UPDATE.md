# Customer Fields Update - Last Name Removed, Email Optional

This document outlines the changes made to remove the `lastName` field and make `email` optional in the Customer entity.

## 📋 Changes Made

### 🗄️ Backend Changes

#### 1. Customer Entity (`Customer.java`)
- ✅ **Removed**: `lastName` field and all related methods
- ✅ **Updated**: Email field made optional (removed `@NotBlank` validation)
- ✅ **Updated**: Constructor to only require `firstName`
- ✅ **Updated**: `getFullName()` method now returns only `firstName`
- ✅ **Updated**: Increased `firstName` max length to 100 characters

#### 2. Customer Controller (`CustomerController.java`)
- ✅ **Removed**: `lastName` references in update method

#### 3. Customer Repository (`CustomerRepository.java`)
- ✅ **Updated**: Search queries to exclude `lastName`
- ✅ **Updated**: Search now includes `phone` field instead
- ✅ **Simplified**: Repository method names

### 🎨 Frontend Changes

#### 1. Customer Model (`customer.model.ts`)
- ✅ **Removed**: `lastName` field from interface

#### 2. Customer Component (`customers.component.ts`)
- ✅ **Removed**: Last Name form field
- ✅ **Updated**: Form validation (no longer requires `lastName`)
- ✅ **Updated**: Customer display shows only `firstName`
- ✅ **Updated**: Customer detail views

#### 3. Rentals Component (`rentals.component.ts`)
- ✅ **Removed**: Last Name form field in new rental form
- ✅ **Updated**: Customer creation logic
- ✅ **Updated**: Customer display in rental tables

#### 4. Bills Component (`bills.component.ts`)
- ✅ **Updated**: Customer display in bills table

#### 5. Dashboard Component (`dashboard.component.ts`)
- ✅ **Updated**: Customer display in activity feeds

### 📚 Documentation Updates
- ✅ **Updated**: Backend README with new API example
- ✅ **Created**: Database migration script

## 🗄️ Database Migration

Since Hibernate's `ddl-auto=update` doesn't drop columns automatically, you need to run the migration script manually:

### Option 1: Using Docker (Recommended)
```bash
# Copy migration script to container
docker cp backend/database-migration.sql costume-rental-db:/tmp/

# Run migration
docker exec -i costume-rental-db psql -U postgres -d costume_rental -f /tmp/database-migration.sql
```

### Option 2: Direct PostgreSQL
```bash
# Run migration script
psql -U postgres -d costume_rental -f backend/database-migration.sql
```

### Option 3: Manual SQL
Connect to your PostgreSQL database and run:
```sql
-- Remove last_name column
ALTER TABLE customers DROP COLUMN IF EXISTS last_name;

-- Make email optional
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- Remove email unique constraint if exists
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
```

## 🧪 Testing the Changes

### 1. Start the Application
```bash
# Start PostgreSQL
docker-compose up -d

# Start backend
cd backend
mvn spring-boot:run

# Start frontend (in another terminal)
cd frontend
ng serve
```

### 2. Test Customer Creation
1. Go to **Customers** module
2. Click **Add Customer**
3. Fill only **First Name** (required) and optionally **Email**
4. **Last Name** field should be gone
5. **Email** should be optional (no validation error if empty)

### 3. Test Rental Creation
1. Go to **Rentals** module
2. Create a new rental
3. In customer section, only **First Name** and **Phone** should be required
4. **Email** should be optional

### 4. Verify Displays
1. Check all customer displays show only `firstName`
2. Verify search functionality still works
3. Check rental and bill displays

## 🔄 API Changes

### Before
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "address": "123 Main St"
}
```

### After
```json
{
  "firstName": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890", 
  "address": "123 Main St"
}
```

## ⚡ Benefits

1. **Simplified Forms**: Less fields to fill
2. **Flexible Names**: Can use full name in `firstName` field
3. **Optional Contact**: Email is now truly optional
4. **Better UX**: Faster customer registration in rental process
5. **Cultural Friendly**: Works better for names that don't fit first/last pattern

## 🎯 Form Validation Summary

### Required Fields
- ✅ **First Name** (1-100 characters)
- ✅ **Phone** (for rentals only)

### Optional Fields
- 🔄 **Email** (validated if provided)
- 🔄 **Phone** (for customers module)
- 🔄 **Address**

The changes are now complete and ready for use! The customer registration process is now simpler and more flexible.