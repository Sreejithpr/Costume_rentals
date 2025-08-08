package com.costumerental.billing.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "customers")
public class Customer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    @Column(name = "first_name", nullable = false)
    private String firstName;
    
    @Email(message = "Email should be valid")
    @Column(name = "email")
    private String email;
    
    @Size(max = 15, message = "Phone number must not exceed 15 characters")
    @Column(name = "phone")
    private String phone;
    
    @Size(max = 255, message = "Address must not exceed 255 characters")
    @Column(name = "address")
    private String address;
    
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Rental> rentals;
    
    // Constructors
    public Customer() {}
    
    public Customer(String firstName, String email, String phone, String address) {
        this.firstName = firstName;
        this.email = email;
        this.phone = phone;
        this.address = address;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public List<Rental> getRentals() {
        return rentals;
    }
    
    public void setRentals(List<Rental> rentals) {
        this.rentals = rentals;
    }
    
    public String getFullName() {
        return firstName;
    }
}