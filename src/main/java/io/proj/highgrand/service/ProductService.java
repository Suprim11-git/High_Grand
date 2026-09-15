package io.proj.highgrand.service;

import io.proj.highgrand.entity.Category;
import io.proj.highgrand.entity.Product;
import io.proj.highgrand.repository.CategoryRepository;
import io.proj.highgrand.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    private static final int MAX_IMAGE_BYTES = 4 * 1024 * 1024;

    private final ProductRepository products;
    private final CategoryRepository categories;

    public ProductService(ProductRepository products, CategoryRepository categories) {
        this.products = products;
        this.categories = categories;
    }

    @Transactional
    public Product createProduct(String name, String categoryName, String sku,
                                 String description, BigDecimal price, BigDecimal salePrice,
                                 Integer stock, Integer minStock, String status,
                                 MultipartFile image) {

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Product name is required.");
        }
        if (price == null || price.signum() <= 0) {
            throw new IllegalArgumentException("Regular price must be greater than 0.");
        }
        if (salePrice == null || salePrice.signum() <= 0) {
            salePrice = price;
        }
        if (salePrice.compareTo(price) > 0) {
            salePrice = price;
        }

        Category category = resolveCategory(categoryName);

        String cleanSku = orEmpty(sku);
        if (cleanSku.isEmpty()) {
            cleanSku = "HG-" + (System.currentTimeMillis() % 1000000);
        } else if (products.existsBySkuIgnoreCase(cleanSku)) {
            cleanSku = cleanSku + "-" + (System.currentTimeMillis() % 1000);
        }

        Product p = new Product();
        p.setCategoryId(category.getId());
        p.setName(name.trim());
        p.setSku(cleanSku);
        p.setDescription(orEmpty(description));
        p.setOriginalPrice(price);
        p.setPrice(salePrice.compareTo(price) < 0 ? salePrice : price);
        p.setStock(stock == null ? 0 : Math.max(0, stock));
        p.setMinStock(minStock == null ? 5 : Math.max(0, minStock));
        p.setStatus(normalizeStatus(status));
        p.setRating(BigDecimal.ZERO);
        p.setImage(readImage(image));

        return products.save(p);
    }

    @Transactional
    public Product updateProduct(Long id, String name, String categoryName, String sku,
                                 String description, BigDecimal price, BigDecimal salePrice,
                                 Integer stock, Integer minStock, String status,
                                 MultipartFile image) {

        Product p = getById(id);

        if (name != null && !name.isBlank()) {
            p.setName(name.trim());
        }
        if (price != null && price.signum() > 0) {
            p.setOriginalPrice(price);
        }
        if (salePrice != null && salePrice.signum() > 0 && p.getOriginalPrice() != null
                && salePrice.compareTo(p.getOriginalPrice()) < 0) {
            p.setPrice(salePrice);
        } else if (price != null && price.signum() > 0) {
            p.setPrice(price);
        }
        if (categoryName != null && !categoryName.isBlank()) {
            Category category = resolveCategory(categoryName);
            p.setCategoryId(category.getId());
        }
        if (sku != null && !sku.isBlank()) {
            String cleanSku = sku.trim();
            if (products.existsBySkuIgnoreCaseAndIdNot(cleanSku, id)) {
                cleanSku = cleanSku + "-" + (System.currentTimeMillis() % 1000);
            }
            p.setSku(cleanSku);
        }
        if (description != null) {
            p.setDescription(description.trim());
        }
        if (stock != null) {
            p.setStock(Math.max(0, stock));
        }
        if (minStock != null) {
            p.setMinStock(Math.max(0, minStock));
        }
        if (status != null && !status.isBlank()) {
            p.setStatus(normalizeStatus(status));
        }
        if (image != null && !image.isEmpty()) {
            p.setImage(readImage(image));
        }

        return products.save(p);
    }

    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return products.findAllByOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public Product getById(Long id) {
        return products.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
    }

    @Transactional
    public Product updateStock(Long id, int newStock) {
        Product p = getById(id);
        p.setStock(Math.max(0, newStock));
        return products.save(p);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!products.existsById(id)) {
            throw new IllegalArgumentException("Product not found: " + id);
        }
        products.deleteById(id);
    }

    public Category resolveCategory(String categoryName) {
        String trimmed = orEmpty(categoryName);
        if (!trimmed.isEmpty()) {
            try {
                Long catId = Long.parseLong(trimmed);
                java.util.Optional<Category> byId = categories.findById(catId);
                if (byId.isPresent()) {
                    return byId.get();
                }
            } catch (NumberFormatException ignored) {
            }
            java.util.Optional<Category> byName = categories.findByNameIgnoreCase(trimmed);
            if (byName.isPresent()) {
                return byName.get();
            }
            String normalized = trimmed.replace('’', '\'').replace('`', '\'');
            java.util.Optional<Category> byNorm = categories.findByNameIgnoreCase(normalized);
            if (byNorm.isPresent()) {
                return byNorm.get();
            }
            Category newCat = new Category(trimmed);
            String slug = trimmed.toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
            if (slug.startsWith("-")) slug = slug.substring(1);
            if (slug.endsWith("-")) slug = slug.substring(0, slug.length() - 1);
            newCat.setSlug(slug);
            newCat.setStatus("Active");
            newCat.setSortOrder(1);
            return categories.save(newCat);
        }
        List<Category> all = categories.findAll();
        if (!all.isEmpty()) {
            return all.get(0);
        }
        Category def = new Category("General");
        def.setSlug("general");
        def.setStatus("Active");
        def.setSortOrder(1);
        return categories.save(def);
    }

    private byte[] readImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return null;
        }
        try {
            byte[] bytes = image.getBytes();
            if (bytes.length > MAX_IMAGE_BYTES) {
                throw new IllegalArgumentException("Image is too large (max 4 MB).");
            }
            return bytes;
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read uploaded image.", e);
        }
    }

    private String normalizeStatus(String status) {
        String s = orEmpty(status);
        if (s.equalsIgnoreCase("Draft")) return "Draft";
        if (s.equalsIgnoreCase("Archived")) return "Archived";
        return "Active";
    }

    private String orEmpty(String s) {
        return s == null ? "" : s.trim();
    }
}