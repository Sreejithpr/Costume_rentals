package com.costumerental.billing.controller;

import com.costumerental.billing.model.Bill;
import com.costumerental.billing.model.Rental;
import com.costumerental.billing.service.BillingService;
import com.costumerental.billing.service.RentalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/bills")
@CrossOrigin(origins = "http://localhost:4200")
public class BillController {
    
    @Autowired
    private BillingService billingService;
    
    @Autowired
    private RentalService rentalService;
    
    @GetMapping
    public List<Bill> getAllBills() {
        return billingService.getAllBills();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        Optional<Bill> bill = billingService.getBillById(id);
        return bill.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/pending")
    public List<Bill> getPendingBills() {
        return billingService.getPendingBills();
    }
    
    @GetMapping("/overdue")
    public List<Bill> getOverdueBills() {
        return billingService.getOverdueBills();
    }
    
    @GetMapping("/customer/{customerId}")
    public List<Bill> getBillsByCustomer(@PathVariable Long customerId) {
        return billingService.getBillsByCustomer(customerId);
    }
    
    @GetMapping("/revenue")
    public ResponseEntity<Double> getTotalRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Double revenue = billingService.getTotalRevenue(startDate, endDate);
        return ResponseEntity.ok(revenue);
    }
    
    @PutMapping("/{id}/fees")
    public ResponseEntity<Bill> updateBillWithFees(
            @PathVariable Long id,
            @RequestParam(required = false) BigDecimal damageFee,
            @RequestParam(required = false) BigDecimal discount,
            @RequestParam(required = false) String notes) {
        try {
            Bill bill = billingService.updateBillWithFees(id, damageFee, discount, notes);
            return ResponseEntity.ok(bill);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/pay")
    public ResponseEntity<Bill> markBillAsPaid(
            @PathVariable Long id,
            @RequestParam Bill.PaymentMethod paymentMethod) {
        try {
            Bill bill = billingService.markBillAsPaid(id, paymentMethod);
            return ResponseEntity.ok(bill);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/generate/{rentalId}")
    public ResponseEntity<Bill> generateBill(@PathVariable Long rentalId) {
        try {
            Optional<Rental> rental = rentalService.getRentalById(rentalId);
            if (rental.isPresent()) {
                Bill bill = billingService.generateBill(rental.get());
                return ResponseEntity.ok(bill);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}