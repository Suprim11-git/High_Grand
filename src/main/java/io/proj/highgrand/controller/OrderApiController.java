package io.proj.highgrand.controller;

import io.proj.highgrand.entity.Order;
import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.UserRepository;
import io.proj.highgrand.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderApiController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderApiController(
            OrderService orderService,
            UserRepository userRepository) {

        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Order> all() {
        return orderService.findAll();
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyOrders(
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "error",
                            "User is not authenticated"
                    ));
        }

        String username = authentication.getName();

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found: " + username
                        ));

        return ResponseEntity.ok(
                orderService.findByUser(user)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
            @PathVariable Long id) {

        try {

            return ResponseEntity.ok(
                    orderService.getById(id)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(
            Authentication authentication,

            @RequestParam String customerName,
            @RequestParam String customerEmail,

            @RequestParam(required = false)
            String customerPhone,

            @RequestParam(required = false)
            String shippingAddress,

            @RequestParam(required = false)
            String city,

            @RequestParam(required = false)
            String postalCode,

            @RequestParam String itemsSummary,

            @RequestParam(required = false)
            Integer itemCount,

            @RequestParam(required = false)
            BigDecimal subtotal,

            @RequestParam(required = false)
            BigDecimal shippingFee,

            @RequestParam(required = false)
            BigDecimal tax,

            @RequestParam BigDecimal totalAmount,

            @RequestParam(required = false)
            String paymentMethod,

            @RequestParam(required = false)
            String notes) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "error",
                            "User is not authenticated"
                    ));
        }

        String username =
                authentication.getName();

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found: " + username
                        ));

        if (itemCount == null) {
            itemCount = 0;
        }

        if (subtotal == null) {
            subtotal = totalAmount;
        }

        if (shippingFee == null) {
            shippingFee = BigDecimal.ZERO;
        }

        if (tax == null) {
            tax = BigDecimal.ZERO;
        }

        if (paymentMethod == null ||
                paymentMethod.isBlank()) {

            paymentMethod = "Cash on Delivery";
        }

        Order saved =
                orderService.createOrder(
                        user,
                        customerName,
                        customerEmail,
                        customerPhone,
                        shippingAddress,
                        city,
                        postalCode,
                        itemsSummary,
                        itemCount,
                        subtotal,
                        shippingFee,
                        tax,
                        totalAmount,
                        paymentMethod,
                        notes
                );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,

            @RequestParam(
                    value = "status",
                    required = false)
            String status,

            @RequestParam(
                    value = "orderStatus",
                    required = false)
            String orderStatus,

            @RequestParam(
                    value = "trackingNumber",
                    required = false)
            String trackingNumber,

            @RequestBody(
                    required = false)
            Map<String, String> body) {

        String finalStatus =
                status != null ? status : orderStatus;

        String finalTracking =
                trackingNumber;

        if (body != null) {

            if (finalStatus == null &&
                    body.containsKey("status")) {

                finalStatus =
                        body.get("status");
            }

            if (finalTracking == null &&
                    body.containsKey("trackingNumber")) {

                finalTracking =
                        body.get("trackingNumber");
            }
        }

        try {

            Order updated =
                    orderService.updateStatus(
                            id,
                            finalStatus,
                            finalTracking
                    );

            return ResponseEntity.ok(updated);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id) {

        try {

            orderService.deleteOrder(id);

            return ResponseEntity.ok(
                    Map.of("deleted", id)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.notFound().build();
        }
    }
}