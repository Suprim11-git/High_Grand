package io.proj.highgrand.repository;

import io.proj.highgrand.entity.PassReset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PassResetRepository extends JpaRepository<PassReset, Long> {

    Optional<PassReset> findByToken(String token);

    void deleteByToken(String token);

    void deleteByUserId(Long userId);
}