package com.costumerental.billing.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
public class Bill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Rental is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_id", nullable = false)
    @JsonIgnore
    private Rental rental;
    
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Total amount must be non-negative")
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Late fee must be non-negative")
    @Column(name = "late_fee", precision = 10, scale = 2)
    private BigDecimal lateFee = BigDecimal.ZERO;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Damage fee must be non-negative")
    @Column(name = "damage_fee", precision = 10, scale = 2)
    private BigDecimal damageFee = BigDecimal.ZERO;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Discount must be non-negative")
    @Column(name = "discount", precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;
    
    @NotNull(message = "Bill date is required")
    @Column(name = "bill_date", nullable = false)
    private LocalDateTime billDate;
    
    @Column(name = "due_date")
    private LocalDateTime dueDate;
    
    @Column(name = "paid_date")
    private LocalDateTime paidDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BillStatus status = BillStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;
    
    @Column(name = "notes")
    private String notes;
    
    // Constructors
    public Bill() {}
    
    public Bill(Rental rental, BigDecimal totalAmount) {
        this.rental = rental;
        this.totalAmount = totalAmount;
        this.billDate = LocalDateTime.now();
        this.status = BillStatus.PENDING;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Rental getRental() {
        return rental;
    }
    
    public void setRental(Rental rental) {
        this.rental = rental;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public BigDecimal getLateFee() {
        return lateFee;
    }
    
    public void setLateFee(BigDecimal lateFee) {
        this.lateFee = lateFee;
    }
    
    public BigDecimal getDamageFee() {
        return damageFee;
    }
    
    public void setDamageFee(BigDecimal damageFee) {
        this.damageFee = damageFee;
    }
    
    public BigDecimal getDiscount() {
        return discount;
    }
    
    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }
    
    public LocalDateTime getBillDate() {
        return billDate;
    }
    
    public void setBillDate(LocalDateTime billDate) {
        this.billDate = billDate;
    }
    
    public LocalDateTime getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }
    
    public LocalDateTime getPaidDate() {
        return paidDate;
    }
    
    public void setPaidDate(LocalDateTime paidDate) {
        this.paidDate = paidDate;
    }
    
    public BillStatus getStatus() {
        return status;
    }
    
    public void setStatus(BillStatus status) {
        this.status = status;
    }
    
    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public enum BillStatus {
        PENDING, PAID, OVERDUE, CANCELLED
    }
    
    public enum PaymentMethod {
        CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, PAYPAL
    }
}