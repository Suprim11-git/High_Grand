package io.proj.highgrand.repository;

import io.proj.highgrand.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByStatusOrderByIdDesc(String status);

    List<Product> findAllByOrderByIdDesc();

    List<Product> findByCategoryIdOrderByIdDesc(Long categoryId);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    long countByCategoryId(Long categoryId);

    @Query("select p.categoryId from Product p")
    List<Long> findAllCategoryIds();
}
