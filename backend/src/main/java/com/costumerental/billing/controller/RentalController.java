package com.costumerental.billing.controller;

import com.costumerental.billing.model.Rental;
import com.costumerental.billing.service.RentalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/rentals")
@CrossOrigin(origins = "http://localhost:4200")
public class RentalController {
    
    @Autowired
    private RentalService rentalService;
    
    @GetMapping
    public List<Rental> getAllRentals() {
        return rentalService.getAllRentals();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Rental> getRentalById(@PathVariable Long id) {
        Optional<Rental> rental = rentalService.getRentalById(id);
        return rental.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/active")
    public List<Rental> getActiveRentals() {
        return rentalService.getActiveRentals();
    }
    
    @GetMapping("/overdue")
    public List<Rental> getOverdueRentals() {
        return rentalService.getOverdueRentals();
    }
    
    @GetMapping("/customer/{customerId}")
    public List<Rental> getRentalsByCustomer(@PathVariable Long customerId) {
        return rentalService.getRentalsByCustomer(customerId);
    }
    
    @PostMapping
    public ResponseEntity<Rental> createRental(
            @RequestParam Long customerId,
            @RequestParam Long costumeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate rentalDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expectedReturnDate,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false, defaultValue = "true") Boolean generateBill) {
        try {
            Rental rental = rentalService.createRental(customerId, costumeId, rentalDate, 
                                                      expectedReturnDate, notes, generateBill);
            return ResponseEntity.status(HttpStatus.CREATED).body(rental);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/return")
    public ResponseEntity<Rental> returnCostume(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate actualReturnDate) {
        try {
            Rental rental = rentalService.returnCostume(id, actualReturnDate);
            return ResponseEntity.ok(rental);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Rental> cancelRental(@PathVariable Long id) {
        try {
            Rental rental = rentalService.cancelRental(id);
            return ResponseEntity.ok(rental);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/notes")
    public ResponseEntity<Rental> updateRentalNotes(@PathVariable Long id, @RequestBody String notes) {
        try {
            Rental rental = rentalService.updateRentalNotes(id, notes);
            return ResponseEntity.ok(rental);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}