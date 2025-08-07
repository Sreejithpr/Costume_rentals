package com.costumerental.billing.repository;

import com.costumerental.billing.model.Rental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<Rental, Long> {
    
    List<Rental> findByCustomerId(Long customerId);
    
    List<Rental> findByCostumeId(Long costumeId);
    
    List<Rental> findByStatus(Rental.RentalStatus status);
    
    @Query("SELECT r FROM Rental r WHERE r.status = :status AND r.expectedReturnDate < :currentDate")
    List<Rental> findOverdueRentals(@Param("status") Rental.RentalStatus status, 
                                   @Param("currentDate") LocalDate currentDate);
    
    @Query("SELECT r FROM Rental r WHERE r.rentalDate BETWEEN :startDate AND :endDate")
    List<Rental> findByRentalDateBetween(@Param("startDate") LocalDate startDate, 
                                        @Param("endDate") LocalDate endDate);
    
    @Query("SELECT r FROM Rental r WHERE r.customer.id = :customerId AND r.status = :status")
    List<Rental> findByCustomerIdAndStatus(@Param("customerId") Long customerId, 
                                          @Param("status") Rental.RentalStatus status);
}