package io.proj.highgrand.controller;

import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    @GetMapping
    public List<Map<String, Object>> getAllUsers() {

        List<Map<String, Object>> result = new ArrayList<>();

        List<User> users = userRepository.findAll();

        for (User user : users) {

            Map<String, Object> data = new HashMap<>();

            data.put("id", user.getId());
            data.put("name", user.getName());
            data.put("username", user.getUsername());
            data.put("email", user.getEmail());
            data.put("roleId", user.getRoleId());
            data.put("role", user.getRole());
            data.put("enabled", user.isEnabled());

            result.add(data);
        }

        return result;
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {

        User user = userRepository.findById(id).orElse(null);

        if (user == null) {

            Map<String, String> error = new HashMap<>();
            error.put("error", "User not found.");

            return ResponseEntity.notFound().build();
        }

        Boolean enabled = request.get("enabled");

        if (enabled == null) {

            Map<String, String> error = new HashMap<>();
            error.put("error", "Enabled value is required.");

            return ResponseEntity.badRequest().body(error);
        }

        user.setEnabled(enabled);

        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();

        response.put("message", "User status updated successfully.");
        response.put("enabled", enabled);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id) {

        User user = userRepository.findById(id).orElse(null);

        if (user == null) {

            Map<String, String> error = new HashMap<>();
            error.put("error", "User not found.");

            return ResponseEntity.notFound().build();
        }

        userRepository.delete(user);

        Map<String, String> response = new HashMap<>();

        response.put("message", "User deleted successfully.");

        return ResponseEntity.ok(response);
    }
}