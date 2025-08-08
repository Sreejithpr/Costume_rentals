package com.costumerental.billing.config;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    @Autowired
    private DataSource dataSource;

    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            // Simple health check query
            try (PreparedStatement statement = connection.prepareStatement("SELECT 1");
                 ResultSet resultSet = statement.executeQuery()) {
                
                if (resultSet.next() && resultSet.getInt(1) == 1) {
                    return Health.up()
                            .withDetail("database", "SQLite")
                            .withDetail("status", "Connected")
                            .build();
                }
            }
        } catch (Exception e) {
            return Health.down()
                    .withDetail("database", "SQLite")
                    .withDetail("error", e.getMessage())
                    .build();
        }
        
        return Health.down()
                .withDetail("database", "SQLite")
                .withDetail("error", "Unknown database error")
                .build();
    }
}