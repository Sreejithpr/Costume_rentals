package com.costumerental.billing.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "rentals")
public class Rental {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Customer is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    
    @NotNull(message = "Costume is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "costume_id", nullable = false)
    private Costume costume;
    
    @NotNull(message = "Rental date is required")
    @Column(name = "rental_date", nullable = false)
    private LocalDate rentalDate;
    
    @NotNull(message = "Expected return date is required")
    @Column(name = "expected_return_date", nullable = false)
    private LocalDate expectedReturnDate;
    
    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RentalStatus status = RentalStatus.ACTIVE;
    
    @Column(name = "notes")
    private String notes;
    
    @OneToOne(mappedBy = "rental", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Bill bill;
    
    // Constructors
    public Rental() {}
    
    public Rental(Customer customer, Costume costume, LocalDate rentalDate, LocalDate expectedReturnDate) {
        this.customer = customer;
        this.costume = costume;
        this.rentalDate = rentalDate;
        this.expectedReturnDate = expectedReturnDate;
        this.status = RentalStatus.ACTIVE;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Customer getCustomer() {
        return customer;
    }
    
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
    
    public Costume getCostume() {
        return costume;
    }
    
    public void setCostume(Costume costume) {
        this.costume = costume;
    }
    
    public LocalDate getRentalDate() {
        return rentalDate;
    }
    
    public void setRentalDate(LocalDate rentalDate) {
        this.rentalDate = rentalDate;
    }
    
    public LocalDate getExpectedReturnDate() {
        return expectedReturnDate;
    }
    
    public void setExpectedReturnDate(LocalDate expectedReturnDate) {
        this.expectedReturnDate = expectedReturnDate;
    }
    
    public LocalDate getActualReturnDate() {
        return actualReturnDate;
    }
    
    public void setActualReturnDate(LocalDate actualReturnDate) {
        this.actualReturnDate = actualReturnDate;
    }
    
    public RentalStatus getStatus() {
        return status;
    }
    
    public void setStatus(RentalStatus status) {
        this.status = status;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public Bill getBill() {
        return bill;
    }
    
    public void setBill(Bill bill) {
        this.bill = bill;
    }
    
    public enum RentalStatus {
        ACTIVE, RETURNED, OVERDUE, CANCELLED
    }
}