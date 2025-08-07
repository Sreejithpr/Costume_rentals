package com.costumerental.billing.service;

import com.costumerental.billing.model.Bill;
import com.costumerental.billing.model.Rental;
import com.costumerental.billing.repository.BillRepository;
import com.costumerental.billing.repository.RentalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BillingService {
    
    @Autowired
    private BillRepository billRepository;
    
    @Autowired
    private RentalRepository rentalRepository;
    
    public Bill generateBill(Rental rental) {
        // Check if bill already exists for this rental
        Optional<Bill> existingBill = billRepository.findByRentalId(rental.getId());
        if (existingBill.isPresent()) {
            return existingBill.get();
        }
        
        // Calculate rental days
        LocalDate endDate = rental.getActualReturnDate() != null ? 
                           rental.getActualReturnDate() : rental.getExpectedReturnDate();
        long rentalDays = ChronoUnit.DAYS.between(rental.getRentalDate(), endDate) + 1;
        
        // Calculate base amount
        BigDecimal baseAmount = rental.getCostume().getDailyRentalPrice()
                               .multiply(BigDecimal.valueOf(rentalDays));
        
        // Calculate late fee if returned late
        BigDecimal lateFee = BigDecimal.ZERO;
        if (rental.getActualReturnDate() != null && 
            rental.getActualReturnDate().isAfter(rental.getExpectedReturnDate())) {
            long lateDays = ChronoUnit.DAYS.between(rental.getExpectedReturnDate(), 
                                                   rental.getActualReturnDate());
            lateFee = rental.getCostume().getDailyRentalPrice()
                     .multiply(BigDecimal.valueOf(lateDays))
                     .multiply(BigDecimal.valueOf(0.5)); // 50% of daily rate as late fee
        }
        
        // Create bill
        Bill bill = new Bill();
        bill.setRental(rental);
        bill.setTotalAmount(baseAmount.add(lateFee));
        bill.setLateFee(lateFee);
        bill.setBillDate(LocalDateTime.now());
        bill.setDueDate(LocalDateTime.now().plusDays(30)); // 30 days to pay
        bill.setStatus(Bill.BillStatus.PENDING);
        
        return billRepository.save(bill);
    }
    
    public Bill updateBillWithFees(Long billId, BigDecimal damageFee, BigDecimal discount, String notes) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        bill.setDamageFee(damageFee != null ? damageFee : BigDecimal.ZERO);
        bill.setDiscount(discount != null ? discount : BigDecimal.ZERO);
        bill.setNotes(notes);
        
        // Recalculate total amount
        BigDecimal baseAmount = bill.getTotalAmount().subtract(bill.getLateFee())
                               .subtract(bill.getDamageFee()).add(bill.getDiscount());
        bill.setTotalAmount(baseAmount.add(bill.getLateFee()).add(bill.getDamageFee())
                           .subtract(bill.getDiscount()));
        
        return billRepository.save(bill);
    }
    
    public Bill markBillAsPaid(Long billId, Bill.PaymentMethod paymentMethod) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        bill.setStatus(Bill.BillStatus.PAID);
        bill.setPaidDate(LocalDateTime.now());
        bill.setPaymentMethod(paymentMethod);
        
        return billRepository.save(bill);
    }
    
    public List<Bill> getPendingBills() {
        return billRepository.findByStatus(Bill.BillStatus.PENDING);
    }
    
    public List<Bill> getOverdueBills() {
        return billRepository.findOverdueBills(Bill.BillStatus.PENDING, LocalDateTime.now());
    }
    
    public List<Bill> getBillsByCustomer(Long customerId) {
        return billRepository.findByCustomerId(customerId);
    }
    
    public Double getTotalRevenue(LocalDateTime startDate, LocalDateTime endDate) {
        Double revenue = billRepository.getTotalRevenueByDateRange(startDate, endDate);
        return revenue != null ? revenue : 0.0;
    }
    
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }
    
    public Optional<Bill> getBillById(Long id) {
        return billRepository.findById(id);
    }
}