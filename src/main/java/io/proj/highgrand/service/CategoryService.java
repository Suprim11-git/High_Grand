package io.proj.highgrand.service;

import io.proj.highgrand.entity.Category;
import io.proj.highgrand.repository.CategoryRepository;
import io.proj.highgrand.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class CategoryService {

    private static final int MAX_IMAGE_BYTES = 2 * 1024 * 1024;

    private final CategoryRepository categories;
    private final ProductRepository products;

    public CategoryService(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }

    public List<Category> findAll() {
        return categories.findAllByOrderByNameAsc();
    }

    public Map<Long, Long> productCounts() {
        Map<Long, Long> counts = new HashMap<>();
        for (Category c : categories.findAll()) {
            counts.put(c.getId(), products.countByCategoryId(c.getId()));
        }
        return counts;
    }

    @Transactional
    public Category create(String name, String slug, String description, Integer sortOrder, String status, MultipartFile image) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required.");
        }
        if (categories.findByNameIgnoreCase(name.trim()).isPresent()) {
            throw new IllegalArgumentException("Category already exists: " + name.trim());
        }

        Category c = new Category();
        apply(c, name, slug, description, sortOrder, status, image);
        if (c.getStatus().isBlank()) {
            c.setStatus("Active");
        }
        if (c.getSlug() == null || c.getSlug().isBlank()) {
            c.setSlug(c.getName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"));
        }
        if (categories.existsBySlugIgnoreCase(c.getSlug())) {
            c.setSlug(c.getSlug() + "-" + (System.currentTimeMillis() % 1000));
        }
        return categories.save(c);
    }

    @Transactional
    public Category update(Long id, String name, String slug, String description, Integer sortOrder, String status, MultipartFile image) {
        Category c = categories.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));

        Category byName = categories.findByNameIgnoreCase(name == null ? "" : name.trim()).orElse(null);
        if (byName != null && !byName.getId().equals(id)) {
            throw new IllegalArgumentException("Category already exists: " + name.trim());
        }
        apply(c, name, slug, description, sortOrder, status, image);
        return categories.save(c);
    }

    @Transactional
    public void delete(Long id) {
        Category c = categories.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        if (products.countByCategoryId(id) > 0) {
            throw new IllegalArgumentException("Cannot delete a category that still has products.");
        }
        categories.delete(c);
    }

    private void apply(Category c, String name, String slug, String description, Integer sortOrder, String status, MultipartFile image) {
        if (name != null && !name.isBlank()) {
            c.setName(name.trim());
        }
        String cleanSlug = slug == null ? "" : slug.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        if (cleanSlug.startsWith("-")) {
            cleanSlug = cleanSlug.substring(1);
        }
        if (cleanSlug.endsWith("-")) {
            cleanSlug = cleanSlug.substring(0, cleanSlug.length() - 1);
        }
        c.setSlug(cleanSlug);
        c.setDescription(description == null ? "" : description.trim());
        c.setSortOrder(sortOrder == null ? 1 : Math.max(1, sortOrder));
        if (status != null && !status.isBlank()) {
            c.setStatus(status.trim());
        }
        if (image != null && !image.isEmpty()) {
            try {
                byte[] bytes = image.getBytes();
                if (bytes.length > MAX_IMAGE_BYTES) {
                    throw new IllegalArgumentException("Category image is too large (max 2 MB).");
                }
                c.setImage(bytes);
            } catch (IOException e) {
                throw new IllegalArgumentException("Could not read category image.", e);
            }
        }
    }
}
