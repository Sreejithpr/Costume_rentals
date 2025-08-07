package com.costumerental.billing.repository;

import com.costumerental.billing.model.Costume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CostumeRepository extends JpaRepository<Costume, Long> {
    
    List<Costume> findByAvailable(Boolean available);
    
    List<Costume> findByCategory(String category);
    
    List<Costume> findBySize(String size);
    
    @Query("SELECT c FROM Costume c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.category) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Costume> findBySearchTerm(@Param("searchTerm") String searchTerm);
    
    List<Costume> findByCategoryAndAvailable(String category, Boolean available);
    
    List<Costume> findBySizeAndAvailable(String size, Boolean available);
    
    @Query("SELECT DISTINCT c.category FROM Costume c ORDER BY c.category")
    List<String> findDistinctCategories();
    
    @Query("SELECT DISTINCT c.size FROM Costume c ORDER BY c.size")
    List<String> findDistinctSizes();
    
    @Query("SELECT c FROM Costume c WHERE c.stockQuantity > 0")
    List<Costume> findCostumesWithStock();
}