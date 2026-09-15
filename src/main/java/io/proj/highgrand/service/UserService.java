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

        // Store encrypted password
        user.setPassword(
                passwordEncoder.encode(rawPassword)
        );

        // Regular customer
        user.setRoleId(1L);
        user.setRole("USER");
        user.setEnabled(true);

        return userRepository.save(user);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }
}