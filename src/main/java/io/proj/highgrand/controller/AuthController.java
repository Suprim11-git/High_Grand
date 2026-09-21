package io.proj.highgrand.controller;

import io.proj.highgrand.entity.User;
import io.proj.highgrand.service.EmailService;
import io.proj.highgrand.service.PassResetService;
import io.proj.highgrand.service.UserService;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;
    private final PassResetService passResetService;

    public AuthController(
            UserService userService,
            EmailService emailService,
            PassResetService passResetService) {

        this.userService = userService;
        this.emailService = emailService;
        this.passResetService = passResetService;
    }

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

        if (name.isBlank()) {
            return "redirect:/pages/auth/signup.html?error=name";
        }

        if (username.isBlank()) {
            return "redirect:/pages/auth/signup.html?error=username";
        }

        if (username.length() < 3) {
            return "redirect:/pages/auth/signup.html?error=username_length";
        }

        if (email.isBlank()) {
            return "redirect:/pages/auth/signup.html?error=email";
        }

        if (password == null || password.length() < 6) {
            return "redirect:/pages/auth/signup.html?error=password";
        }

        if (!password.equals(confirmPassword)) {
            return "redirect:/pages/auth/signup.html?error=password_match";
        }

        if (userService.usernameExists(username)) {
            return "redirect:/pages/auth/signup.html?error=username_exists";
        }

        if (userService.emailExists(email)) {
            return "redirect:/pages/auth/signup.html?error=email_exists";
        }

        userService.registerUser(
                name,
                username,
                email,
                password
        );

        emailService.sendRegistrationEmail(email, name);

        return "redirect:/pages/auth/login.html?registered=true";
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(
            @RequestParam("email") String email) {

        email = email.trim().toLowerCase();

        if (email.isBlank()) {
            return "redirect:/pages/auth/forgot-password.html?error=email";
        }

        String token = passResetService.createResetToken(email);

        if (token == null) {
            return "redirect:/pages/auth/forgot-password.html?error=not_found";
        }

        User user = userService.findByEmail(email).orElse(null);

        if (user == null) {
            return "redirect:/pages/auth/forgot-password.html?error=not_found";
        }

        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getName(),
                token
        );

        return "redirect:/pages/auth/forgot-password.html?sent=true";
    }

    @PostMapping("/reset-password")
    public String resetPassword(
            @RequestParam("token") String token,
            @RequestParam("password") String password,
            @RequestParam("confirm_password") String confirmPassword) {

        if (token == null || token.isBlank()) {
            return "redirect:/pages/auth/login.html?error=reset";
        }

        if (password == null || password.length() < 6) {
            return "redirect:/pages/auth/reset-password.html?token="
                    + token + "&error=password";
        }

        if (!password.equals(confirmPassword)) {
            return "redirect:/pages/auth/reset-password.html?token="
                    + token + "&error=match";
        }

        boolean success = passResetService.resetPassword(
                token,
                password
        );

        if (!success) {
            return "redirect:/pages/auth/reset-password.html?error=invalid";
        }

        return "redirect:/pages/auth/login.html?reset=true";
    }
    @GetMapping("/admin")
    public String adminRoot() {
        return "redirect:/admin/dashboard.html";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "redirect:/admin/dashboard.html";
    }
}