package com.costumerental.billing.config;

import com.costumerental.billing.model.Customer;
import com.costumerental.billing.model.Costume;
import com.costumerental.billing.repository.CustomerRepository;
import com.costumerental.billing.repository.CostumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CostumeRepository costumeRepository;

    @Override
    public void run(String... args) throws Exception {
        // Initialize sample data only if database is empty
        if (customerRepository.count() == 0) {
            initializeSampleCustomers();
        }
        
        if (costumeRepository.count() == 0) {
            initializeSampleCostumes();
        }
    }

    private void initializeSampleCustomers() {
        // Create sample customers
        Customer customer1 = new Customer("John", "Doe", "john.doe@email.com", "555-1234", "123 Main St, City, State");
        Customer customer2 = new Customer("Jane", "Smith", "jane.smith@email.com", "555-5678", "456 Oak Ave, City, State");
        Customer customer3 = new Customer("Bob", "Johnson", "bob.johnson@email.com", "555-9012", "789 Pine Rd, City, State");
        Customer customer4 = new Customer("Alice", "Brown", "alice.brown@email.com", "555-3456", "321 Elm St, City, State");
        Customer customer5 = new Customer("Charlie", "Wilson", "charlie.wilson@email.com", "555-7890", "654 Maple Dr, City, State");

        customerRepository.save(customer1);
        customerRepository.save(customer2);
        customerRepository.save(customer3);
        customerRepository.save(customer4);
        customerRepository.save(customer5);

        System.out.println("Initialized 5 sample customers");
    }

    private void initializeSampleCostumes() {
        // Create sample costumes with stock quantities
        Costume costume1 = new Costume("Vampire Costume", "Classic vampire costume with cape", "M", "Horror", new BigDecimal("25.00"), 3);
        Costume costume2 = new Costume("Princess Dress", "Beautiful princess dress with tiara", "S", "Fairy Tale", new BigDecimal("30.00"), 2);
        Costume costume3 = new Costume("Pirate Outfit", "Complete pirate costume with hat and sword", "L", "Adventure", new BigDecimal("28.00"), 4);
        Costume costume4 = new Costume("Superhero Suit", "Red and blue superhero costume", "M", "Superhero", new BigDecimal("35.00"), 5);
        Costume costume5 = new Costume("Witch Costume", "Spooky witch costume with hat", "L", "Horror", new BigDecimal("22.00"), 2);
        Costume costume6 = new Costume("Knight Armor", "Medieval knight armor costume", "XL", "Medieval", new BigDecimal("40.00"), 1);
        Costume costume7 = new Costume("Fairy Wings Set", "Delicate fairy wings with wand", "One Size", "Fairy Tale", new BigDecimal("18.00"), 6);
        Costume costume8 = new Costume("Zombie Outfit", "Scary zombie costume with makeup", "L", "Horror", new BigDecimal("26.00"), 3);
        Costume costume9 = new Costume("Angel Costume", "White angel costume with wings", "M", "Spiritual", new BigDecimal("24.00"), 2);
        Costume costume10 = new Costume("Cowboy Outfit", "Western cowboy costume with hat", "L", "Western", new BigDecimal("32.00"), 3);
        Costume costume11 = new Costume("Ballerina Tutu", "Pink ballerina tutu with accessories", "S", "Dance", new BigDecimal("20.00"), 4);
        Costume costume12 = new Costume("Robot Costume", "Futuristic robot costume", "M", "Sci-Fi", new BigDecimal("38.00"), 2);
        Costume costume13 = new Costume("Cat Costume", "Cute cat costume with ears and tail", "S", "Animals", new BigDecimal("16.00"), 5);
        Costume costume14 = new Costume("Doctor Outfit", "Professional doctor costume", "M", "Profession", new BigDecimal("25.00"), 3);
        Costume costume15 = new Costume("Clown Costume", "Colorful clown costume with accessories", "L", "Comedy", new BigDecimal("28.00"), 2);

        costumeRepository.save(costume1);
        costumeRepository.save(costume2);
        costumeRepository.save(costume3);
        costumeRepository.save(costume4);
        costumeRepository.save(costume5);
        costumeRepository.save(costume6);
        costumeRepository.save(costume7);
        costumeRepository.save(costume8);
        costumeRepository.save(costume9);
        costumeRepository.save(costume10);
        costumeRepository.save(costume11);
        costumeRepository.save(costume12);
        costumeRepository.save(costume13);
        costumeRepository.save(costume14);
        costumeRepository.save(costume15);

        System.out.println("Initialized 15 sample costumes");
    }
}