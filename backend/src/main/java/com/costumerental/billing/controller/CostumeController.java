package com.costumerental.billing.controller;

import com.costumerental.billing.model.Costume;
import com.costumerental.billing.repository.CostumeRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/costumes")
@CrossOrigin(origins = "http://localhost:4200")
public class CostumeController {
    
    @Autowired
    private CostumeRepository costumeRepository;
    
    @GetMapping
    public List<Costume> getAllCostumes() {
        return costumeRepository.findAll();
    }
    
    @GetMapping("/available")
    public List<Costume> getAvailableCostumes() {
        return costumeRepository.findByAvailable(true);
    }
    
    @GetMapping("/with-stock")
    public List<Costume> getCostumesWithStock() {
        return costumeRepository.findCostumesWithStock();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Costume> getCostumeById(@PathVariable Long id) {
        Optional<Costume> costume = costumeRepository.findById(id);
        return costume.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public List<Costume> searchCostumes(@RequestParam String term) {
        return costumeRepository.findBySearchTerm(term);
    }
    
    @GetMapping("/categories")
    public List<String> getAllCategories() {
        return costumeRepository.findDistinctCategories();
    }
    
    @GetMapping("/sizes")
    public List<String> getAllSizes() {
        return costumeRepository.findDistinctSizes();
    }
    
    @GetMapping("/category/{category}")
    public List<Costume> getCostumesByCategory(@PathVariable String category) {
        return costumeRepository.findByCategory(category);
    }
    
    @GetMapping("/size/{size}")
    public List<Costume> getCostumesBySize(@PathVariable String size) {
        return costumeRepository.findBySize(size);
    }
    
    @PostMapping
    public ResponseEntity<Costume> createCostume(@Valid @RequestBody Costume costume) {
        try {
            Costume savedCostume = costumeRepository.save(costume);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCostume);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Costume> updateCostume(@PathVariable Long id, 
                                               @Valid @RequestBody Costume costumeDetails) {
        Optional<Costume> optionalCostume = costumeRepository.findById(id);
        if (optionalCostume.isPresent()) {
            Costume costume = optionalCostume.get();
            costume.setName(costumeDetails.getName());
            costume.setDescription(costumeDetails.getDescription());
            costume.setSize(costumeDetails.getSize());
            costume.setCategory(costumeDetails.getCategory());
            costume.setDailyRentalPrice(costumeDetails.getDailyRentalPrice());
            costume.setAvailable(costumeDetails.getAvailable());
            costume.setStockQuantity(costumeDetails.getStockQuantity());
            Costume updatedCostume = costumeRepository.save(costume);
            return ResponseEntity.ok(updatedCostume);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCostume(@PathVariable Long id) {
        if (costumeRepository.existsById(id)) {
            costumeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}