package com.costumerental.billing.service;

import com.costumerental.billing.model.Costume;
import com.costumerental.billing.model.Customer;
import com.costumerental.billing.model.Rental;
import com.costumerental.billing.repository.CostumeRepository;
import com.costumerental.billing.repository.CustomerRepository;
import com.costumerental.billing.repository.RentalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RentalService {
    
    @Autowired
    private RentalRepository rentalRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private CostumeRepository costumeRepository;
    
    @Autowired
    private BillingService billingService;
    
    public Rental createRental(Long customerId, Long costumeId, LocalDate rentalDate, 
                              LocalDate expectedReturnDate, String notes) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        Costume costume = costumeRepository.findById(costumeId)
                .orElseThrow(() -> new RuntimeException("Costume not found"));
        
        if (!costume.getAvailable() || costume.getAvailableStock() <= 0) {
            throw new RuntimeException("Costume is not available for rental - no stock available");
        }
        
        Rental rental = new Rental();
        rental.setCustomer(customer);
        rental.setCostume(costume);
        rental.setRentalDate(rentalDate);
        rental.setExpectedReturnDate(expectedReturnDate);
        rental.setNotes(notes);
        rental.setStatus(Rental.RentalStatus.ACTIVE);
        
        // Update costume availability based on remaining stock
        if (costume.getAvailableStock() <= 1) {
            costume.setAvailable(false);
        }
        costumeRepository.save(costume);
        
        return rentalRepository.save(rental);
    }
    
    public Rental returnCostume(Long rentalId, LocalDate actualReturnDate) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found"));
        
        if (rental.getStatus() != Rental.RentalStatus.ACTIVE) {
            throw new RuntimeException("Rental is not active");
        }
        
        rental.setActualReturnDate(actualReturnDate);
        rental.setStatus(Rental.RentalStatus.RETURNED);
        
        // Update costume availability when returned
        Costume costume = rental.getCostume();
        if (costume.getStockQuantity() > 0) {
            costume.setAvailable(true);
        }
        costumeRepository.save(costume);
        
        rental = rentalRepository.save(rental);
        
        // Generate bill for the rental
        billingService.generateBill(rental);
        
        return rental;
    }
    
    public List<Rental> getActiveRentals() {
        return rentalRepository.findByStatus(Rental.RentalStatus.ACTIVE);
    }
    
    public List<Rental> getOverdueRentals() {
        return rentalRepository.findOverdueRentals(Rental.RentalStatus.ACTIVE, LocalDate.now());
    }
    
    public List<Rental> getRentalsByCustomer(Long customerId) {
        return rentalRepository.findByCustomerId(customerId);
    }
    
    public List<Rental> getAllRentals() {
        return rentalRepository.findAll();
    }
    
    public Optional<Rental> getRentalById(Long id) {
        return rentalRepository.findById(id);
    }
    
    public Rental updateRentalNotes(Long rentalId, String notes) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found"));
        
        rental.setNotes(notes);
        return rentalRepository.save(rental);
    }
    
    public Rental cancelRental(Long rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found"));
        
        if (rental.getStatus() != Rental.RentalStatus.ACTIVE) {
            throw new RuntimeException("Only active rentals can be cancelled");
        }
        
        rental.setStatus(Rental.RentalStatus.CANCELLED);
        
        // Update costume availability when cancelled
        Costume costume = rental.getCostume();
        if (costume.getStockQuantity() > 0) {
            costume.setAvailable(true);
        }
        costumeRepository.save(costume);
        
        return rentalRepository.save(rental);
    }
}