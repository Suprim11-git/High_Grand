package io.proj.highgrand.controller;

import io.proj.highgrand.entity.Order;
import io.proj.highgrand.entity.Product;
import io.proj.highgrand.repository.CategoryRepository;
import io.proj.highgrand.repository.OrderRepository;
import io.proj.highgrand.repository.ProductRepository;
import io.proj.highgrand.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardApiController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public DashboardApiController(ProductRepository productRepository,
                                  OrderRepository orderRepository,
                                  UserRepository userRepository,
                                  CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {

        Map<String, Object> stats = new HashMap<>();

        List<Order> allOrders =
                orderRepository.findAllByOrderByOrderDateDesc();

        List<Product> allProducts =
                productRepository.findAllByOrderByIdDesc();

        long totalUsers = userRepository.count();
        long totalCategories = categoryRepository.count();

        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> !"Cancelled".equalsIgnoreCase(o.getStatus()))
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long lowStockCount = allProducts.stream()
                .filter(p -> p.getStock() > 0
                        && p.getStock() <= p.getMinStock())
                .count();

        long outOfStockCount = allProducts.stream()
                .filter(p -> p.getStock() <= 0)
                .count();

        List<Order> recentOrders = allOrders.stream()
                .limit(6)
                .collect(Collectors.toList());

        List<Product> bestSellers = allProducts.stream()
                .limit(5)
                .collect(Collectors.toList());

        stats.put("totalRevenue", totalRevenue);
        stats.put("totalOrders", allOrders.size());
        stats.put("totalProducts", allProducts.size());
        stats.put("totalUsers", totalUsers);
        stats.put("totalCategories", totalCategories);
        stats.put("lowStockCount", lowStockCount);
        stats.put("outOfStockCount", outOfStockCount);
        stats.put("recentOrders", recentOrders);
        stats.put("bestSellers", bestSellers);

        return ResponseEntity.ok(stats);
    }
}