package io.proj.highgrand.config;

import io.proj.highgrand.entity.Order;
import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.OrderRepository;
import io.proj.highgrand.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Configuration
public class OrderSeeder {

    @Bean
    ApplicationRunner seedOrders(OrderRepository orderRepository,
                                 UserRepository userRepository) {

        return args -> {

            if (orderRepository.count() == 0) {

                User seedUser = userRepository.findAll()
                        .stream()
                        .findFirst()
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "No users found. Please create a user first."
                                )
                        );

                createSeedOrder(
                        orderRepository,
                        seedUser,
                        "High Grand Oxford Classic x 1, Grand Noir Parfum x 1",
                        new BigDecimal("24500.00"),
                        "Processing",
                        "DHL-EXP-992144"
                );

                createSeedOrder(
                        orderRepository,
                        seedUser,
                        "Cashmere Overcoat Charcoal x 1",
                        new BigDecimal("18200.00"),
                        "Shipped",
                        "DHL-EXP-992143"
                );

                createSeedOrder(
                        orderRepository,
                        seedUser,
                        "Leather Weekend Duffle x 1, Silk Crepe Evening Blouse x 1",
                        new BigDecimal("42000.00"),
                        "Delivered",
                        "DHL-EXP-992140"
                );

                createSeedOrder(
                        orderRepository,
                        seedUser,
                        "Grand Noir Eau De Parfum 100ml x 1",
                        new BigDecimal("9500.00"),
                        "Delivered",
                        "DHL-EXP-992135"
                );

                createSeedOrder(
                        orderRepository,
                        seedUser,
                        "Structured Leather Tote x 1",
                        new BigDecimal("15400.00"),
                        "Cancelled",
                        "DHL-EXP-992130"
                );
            }
        };
    }

    private void createSeedOrder(
            OrderRepository repo,
            User user,
            String items,
            BigDecimal total,
            String status,
            String trackingNumber) {

        Order order = new Order();

        order.setUser(user);
        order.setItemsSummary(items);
        order.setTotalAmount(total);
        order.setStatus(status);
        order.setTrackingNumber(trackingNumber);
        order.setOrderDate(LocalDateTime.now());

        repo.save(order);
    }
}