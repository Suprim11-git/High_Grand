package io.proj.highgrand.service;

import io.proj.highgrand.entity.PassReset;
import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.PassResetRepository;
import io.proj.highgrand.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PassResetService {

    private final PassResetRepository passResetRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PassResetService(
            PassResetRepository passResetRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.passResetRepository = passResetRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String createResetToken(String email) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase()
        ).orElse(null);

        if (user == null) {
            return null;
        }

        passResetRepository.deleteByUserId(user.getId());

        PassReset reset = new PassReset();

        reset.setToken(UUID.randomUUID().toString());
        reset.setUser(user);
        reset.setExpiresAt(
                LocalDateTime.now().plusMinutes(30)
        );

        passResetRepository.save(reset);

        return reset.getToken();
    }

    public boolean resetPassword(
            String token,
            String newPassword) {

        PassReset reset = passResetRepository
                .findByToken(token)
                .orElse(null);

        if (reset == null) {
            return false;
        }

        if (reset.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            passResetRepository.delete(reset);
            return false;
        }

        if (newPassword == null ||
                newPassword.length() < 6) {

            return false;
        }

        User user = reset.getUser();

        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        passResetRepository.delete(reset);

        return true;
    }
}