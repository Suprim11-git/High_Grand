package io.proj.highgrand.service;

import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByUsernameOrEmail(String login) {
        return userRepository.findByUsername(login)
                .or(() -> userRepository.findByEmail(login));
    }

    public boolean usernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public User registerUser(
            String name,
            String username,
            String email,
            String rawPassword) {

        User user = new User();

        user.setName(name.trim());
        user.setUsername(username.trim());
        user.setEmail(email.trim().toLowerCase());

        user.setPassword(
                passwordEncoder.encode(rawPassword)
        );

        user.setRoleId(1L);
        user.setRole("USER");
        user.setEnabled(true);

        return userRepository.save(user);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User updateProfile(
            User user,
            String name,
            String phone,
            String address,
            String city,
            String postalCode) {

        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }

        user.setPhone(phone != null && !phone.isBlank() ? phone.trim() : null);
        user.setAddress(address != null && !address.isBlank() ? address.trim() : null);
        user.setCity(city != null && !city.isBlank() ? city.trim() : null);
        user.setPostalCode(postalCode != null && !postalCode.isBlank() ? postalCode.trim() : null);

        return userRepository.save(user);
    }

    public boolean verifyPassword(User user, String rawPassword) {
        if (user == null || rawPassword == null) {
            return false;
        }
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    public boolean changePassword(User user, String currentPassword, String newPassword) {
        if (user == null || currentPassword == null || newPassword == null) {
            return false;
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false;
        }

        if (newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters.");
        }

        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
        return true;
    }
}