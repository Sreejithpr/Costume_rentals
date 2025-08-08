package com.costumerental.billing.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "costumes")
public class Costume {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Costume name is required")
    @Size(max = 100, message = "Costume name must not exceed 100 characters")
    @Column(name = "name", nullable = false)
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Column(name = "description")
    private String description;
    
    @NotBlank(message = "Size is required")
    @Size(max = 10, message = "Size must not exceed 10 characters")
    @Column(name = "size", nullable = false)
    private String size;
    
    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    @Column(name = "category", nullable = false)
    private String category;
    
    @NotNull(message = "Sell price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Sell price must be greater than 0")
    @Column(name = "sell_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal sellPrice;
    
    @NotNull(message = "Original price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Original price must be greater than 0")
    @Column(name = "original_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal originalPrice;
    
    @Column(name = "available", nullable = false)
    private Boolean available = true;
    
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 1;
    
    @OneToMany(mappedBy = "costume", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Rental> rentals;
    
    // Constructors
    public Costume() {}
    
    public Costume(String name, String description, String size, String category, BigDecimal sellPrice, BigDecimal originalPrice) {
        this.name = name;
        this.description = description;
        this.size = size;
        this.category = category;
        this.sellPrice = sellPrice;
        this.originalPrice = originalPrice;
        this.available = true;
        this.stockQuantity = 1;
    }
    
    public Costume(String name, String description, String size, String category, BigDecimal sellPrice, BigDecimal originalPrice, Integer stockQuantity) {
        this.name = name;
        this.description = description;
        this.size = size;
        this.category = category;
        this.sellPrice = sellPrice;
        this.originalPrice = originalPrice;
        this.available = true;
        this.stockQuantity = stockQuantity;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getSize() {
        return size;
    }
    
    public void setSize(String size) {
        this.size = size;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public BigDecimal getSellPrice() {
        return sellPrice;
    }
    
    public void setSellPrice(BigDecimal sellPrice) {
        this.sellPrice = sellPrice;
    }
    
    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }
    
    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }
    
    public Boolean getAvailable() {
        return available;
    }
    
    public void setAvailable(Boolean available) {
        this.available = available;
    }
    
    public List<Rental> getRentals() {
        return rentals;
    }
    
    public void setRentals(List<Rental> rentals) {
        this.rentals = rentals;
    }
    
    public Integer getStockQuantity() {
        return stockQuantity;
    }
    
    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
        // Update availability based on stock
        this.available = stockQuantity != null && stockQuantity > 0;
    }
    
    public Integer getAvailableStock() {
        if (rentals == null) return stockQuantity;
        
        // Count active rentals
        long activeRentals = rentals.stream()
            .filter(rental -> rental.getStatus() == Rental.RentalStatus.ACTIVE)
            .count();
        
        return Math.max(0, stockQuantity - (int) activeRentals);
    }
}