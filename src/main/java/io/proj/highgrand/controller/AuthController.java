package io.proj.highgrand.controller;

import io.proj.highgrand.service.UserService;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Registration endpoint.
     */
    @PostMapping("/register")
    public String register(

            @RequestParam("name")
            String name,

            @RequestParam("username")
            String username,

            @RequestParam("email")
            String email,

            @RequestParam("password")
            String password,

            @RequestParam("confirm_password")
            String confirmPassword) {

        name = name.trim();
        username = username.trim();
        email = email.trim().toLowerCase();

        // ------------------------------
        // Validate name
        // ------------------------------
        if (name.isBlank()) {
            return "redirect:/pages/auth/signup.html?error=name";
        }

        // ------------------------------
        // Validate username
        // ------------------------------
        if (username.isBlank()) {
            return "redirect:/pages/auth/signup.html?error=username";
        }

        if (username.length() < 3) {
            return "redirect:/pages/auth/signup.html?error=username_length";
        }

        // ------------------------------
        // Validate email
        // ------------------------------
        if (email.isBlank()) {
            return "redirect:/pages/auth/signup.html?error=email";
        }

        // ------------------------------
        // Validate password
        // ------------------------------
        if (password == null || password.length() < 6) {
            return "redirect:/pages/auth/signup.html?error=password";
        }

        // ------------------------------
        // Confirm password
        // ------------------------------
        if (!password.equals(confirmPassword)) {
            return "redirect:/pages/auth/signup.html?error=password_match";
        }

        // ------------------------------
        // Check duplicate username
        // ------------------------------
        if (userService.usernameExists(username)) {
            return "redirect:/pages/auth/signup.html?error=username_exists";
        }

        // ------------------------------
        // Check duplicate email
        // ------------------------------
        if (userService.emailExists(email)) {
            return "redirect:/pages/auth/signup.html?error=email_exists";
        }

        // ------------------------------
        // Create user
        // ------------------------------
        userService.registerUser(
                name,
                username,
                email,
                password
        );

        return "redirect:/pages/auth/login.html?registered=true";
    }

    /**
     * Admin root.
     */
    @GetMapping("/admin")
    public String adminRoot() {
        return "redirect:/admin/dashboard.html";
    }

    /**
     * Admin dashboard.
     */
    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "redirect:/admin/dashboard.html";
    }
}