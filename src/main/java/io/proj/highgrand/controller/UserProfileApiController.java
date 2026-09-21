package io.proj.highgrand.controller;

import io.proj.highgrand.entity.Order;
import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.OrderRepository;
import io.proj.highgrand.repository.UserRepository;
import io.proj.highgrand.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/user")
public class UserProfileApiController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("MMM dd, yyyy");

    public UserProfileApiController(
            UserService userService,
            UserRepository userRepository,
            OrderRepository orderRepository) {

        this.userService = userService;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null ||
                !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getName())) {
            return null;
        }

        return userRepository.findByUsername(authentication.getName())
                .or(() -> userRepository.findByEmail(authentication.getName()))
                .orElse(null);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "authenticated", false,
                    "error", "User is not authenticated"
            ));
        }

        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("authenticated", true);
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("phone", user.getPhone() != null ? user.getPhone() : "");
        response.put("address", user.getAddress() != null ? user.getAddress() : "");
        response.put("city", user.getCity() != null ? user.getCity() : "");
        response.put("postalCode", user.getPostalCode() != null ? user.getPostalCode() : "");
        response.put("memberSince", user.getCreatedAt() != null
                ? user.getCreatedAt().format(DATE_FORMATTER)
                : "2026");

        response.put("orderCount", orders.size());

        List<Map<String, Object>> recentOrders = new ArrayList<>();
        int limit = Math.min(5, orders.size());
        for (int i = 0; i < limit; i++) {
            Order o = orders.get(i);
            Map<String, Object> oMap = new LinkedHashMap<>();
            oMap.put("id", o.getId());
            oMap.put("orderNumber", o.getOrderNumber());
            oMap.put("date", o.getOrderDate() != null
                    ? o.getOrderDate().format(DATE_FORMATTER)
                    : "");
            oMap.put("status", o.getStatus());
            oMap.put("itemCount", o.getItemCount());
            oMap.put("totalAmount", o.getTotalAmount());
            oMap.put("itemsSummary", o.getItemsSummary());
            recentOrders.add(oMap);
        }
        response.put("recentOrders", recentOrders);

        return ResponseEntity.ok(response);
    }


    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String postalCode) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "User is not authenticated"
            ));
        }

        String finalName = body != null && body.containsKey("name") ? body.get("name") : name;
        String finalPhone = body != null && body.containsKey("phone") ? body.get("phone") : phone;
        String finalAddress = body != null && body.containsKey("address") ? body.get("address") : address;
        String finalCity = body != null && body.containsKey("city") ? body.get("city") : city;
        String finalPostalCode = body != null && body.containsKey("postalCode") ? body.get("postalCode") : postalCode;

        if (finalName != null && finalName.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Full name cannot be empty."
            ));
        }

        User updated = userService.updateProfile(
                user,
                finalName,
                finalPhone,
                finalAddress,
                finalCity,
                finalPostalCode
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Profile updated successfully.");
        response.put("name", updated.getName());
        response.put("phone", updated.getPhone() != null ? updated.getPhone() : "");
        response.put("address", updated.getAddress() != null ? updated.getAddress() : "");
        response.put("city", updated.getCity() != null ? updated.getCity() : "");
        response.put("postalCode", updated.getPostalCode() != null ? updated.getPostalCode() : "");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false) String currentPassword,
            @RequestParam(required = false) String newPassword,
            @RequestParam(required = false) String confirmPassword) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "User is not authenticated"
            ));
        }

        String curPwd = body != null && body.containsKey("currentPassword") ? body.get("currentPassword") : currentPassword;
        String newPwd = body != null && body.containsKey("newPassword") ? body.get("newPassword") : newPassword;
        String confPwd = body != null && body.containsKey("confirmPassword") ? body.get("confirmPassword") : confirmPassword;

        if (curPwd == null || curPwd.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is required."));
        }

        if (newPwd == null || newPwd.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters."));
        }

        if (confPwd != null && !newPwd.equals(confPwd)) {
            return ResponseEntity.badRequest().body(Map.of("error", "New passwords do not match."));
        }

        try {
            boolean changed = userService.changePassword(user, curPwd, newPwd);
            if (!changed) {
                return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect."));
            }

            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
