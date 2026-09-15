package io.proj.highgrand.repository;

import io.proj.highgrand.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    List<Category> findAllByOrderByNameAsc();

    List<Category> findByStatusOrderByNameAsc(String status);

    boolean existsBySlugIgnoreCase(String slug);
}
