package io.proj.highgrand.controller;

import io.proj.highgrand.entity.Product;
import io.proj.highgrand.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductApiController {

    private final ProductService productService;

    public ProductApiController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> all() {
        return productService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestParam(value = "productName", required = false) String productName,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam("category") String category,
            @RequestParam(value = "sku", required = false) String sku,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("price") BigDecimal price,
            @RequestParam(value = "salePrice", required = false) BigDecimal salePrice,
            @RequestParam(value = "stock", required = false) Integer stock,
            @RequestParam(value = "minStock", required = false) Integer minStock,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        String finalName = productName != null && !productName.isBlank() ? productName : name;
        Product saved = productService.createProduct(finalName, category, sku, description,
                price, salePrice, stock, minStock, status, image);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(@PathVariable Long id) {
        Product p = productService.getById(id);
        byte[] img = p.getImage();
        if (img == null || img.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("Content-Type", detectImageType(img))
                .header("Cache-Control", "max-age=3600")
                .body(img);
    }

    private String detectImageType(byte[] img) {
        if (img.length >= 3 && (img[0] & 0xFF) == 0xFF && (img[1] & 0xFF) == 0xD8) return "image/jpeg";
        if (img.length >= 4 && (img[0] & 0xFF) == 0x89 && img[1] == 'P' && img[2] == 'N' && img[3] == 'G') return "image/png";
        if (img.length >= 3 && img[0] == 'G' && img[1] == 'I' && img[2] == 'F') return "image/gif";
        if (img.length >= 12 && img[8] == 'W' && img[9] == 'E' && img[10] == 'B' && img[11] == 'P') return "image/webp";
        return "application/octet-stream";
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam(value = "productName", required = false) String productName,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "sku", required = false) String sku,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) BigDecimal price,
            @RequestParam(value = "salePrice", required = false) BigDecimal salePrice,
            @RequestParam(value = "stock", required = false) Integer stock,
            @RequestParam(value = "minStock", required = false) Integer minStock,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        String finalName = productName != null && !productName.isBlank() ? productName : name;
        Product saved = productService.updateProduct(id, finalName, category, sku, description,
                price, salePrice, stock, minStock, status, image);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> adjustStock(@PathVariable Long id,
                                         @RequestBody Map<String, Integer> body) {
        Integer newStock = body.get("stock");
        if (newStock == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "stock value required"));
        }
        return ResponseEntity.ok(productService.updateStock(id, newStock));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }
}
