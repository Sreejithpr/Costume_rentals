package com.costumerental.billing.repository;

import com.costumerental.billing.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    
    Optional<Bill> findByRentalId(Long rentalId);
    
    List<Bill> findByStatus(Bill.BillStatus status);
    
    @Query("SELECT b FROM Bill b WHERE b.rental.customer.id = :customerId")
    List<Bill> findByCustomerId(@Param("customerId") Long customerId);
    
    @Query("SELECT b FROM Bill b WHERE b.status = :status AND b.dueDate < :currentDate")
    List<Bill> findOverdueBills(@Param("status") Bill.BillStatus status, 
                               @Param("currentDate") LocalDateTime currentDate);
    
    @Query("SELECT b FROM Bill b WHERE b.billDate BETWEEN :startDate AND :endDate")
    List<Bill> findByBillDateBetween(@Param("startDate") LocalDateTime startDate, 
                                    @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT b FROM Bill b WHERE b.paidDate BETWEEN :startDate AND :endDate")
    List<Bill> findByPaidDateBetween(@Param("startDate") LocalDateTime startDate, 
                                    @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(b.totalAmount) FROM Bill b WHERE b.status = 'PAID' AND b.paidDate BETWEEN :startDate AND :endDate")
    Double getTotalRevenueByDateRange(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
}