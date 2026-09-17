package io.proj.highgrand.controller;

import io.proj.highgrand.entity.Category;
import io.proj.highgrand.entity.Product;
import io.proj.highgrand.repository.CategoryRepository;
import io.proj.highgrand.service.ProductService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Controller
public class ProductPageController {

    private final ProductService productService;
    private final CategoryRepository categoryRepository;

    public ProductPageController(ProductService productService, CategoryRepository categoryRepository) {
        this.productService = productService;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/admin/add_products")
    public String addProductPage() {
        return "redirect:/admin/add_products.html";
    }

    @PostMapping("/admin/add_product")
    public String handleAddProduct(
            @RequestParam("productName") String productName,
            @RequestParam("category") String category,
            @RequestParam(value = "sku", required = false) String sku,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("price") BigDecimal price,
            @RequestParam(value = "salePrice", required = false) BigDecimal salePrice,
            @RequestParam(value = "stock", required = false) Integer stock,
            @RequestParam(value = "minStock", required = false) Integer minStock,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            Product saved = productService.createProduct(
                    productName, category, sku, description,
                    price, salePrice,
                    stock, minStock, status, image);

            return "redirect:/admin/products.html?added=" + urlEncode(saved.getName());
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = "Failed to add product.";
            }
            return "redirect:/admin/add_products.html?error=" + urlEncode(msg);
        }
    }

    private String urlEncode(String value) {
        try {
            return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    @GetMapping("/admin/products")
    public String productsPage() {
        return "redirect:/admin/products.html";
    }

    @GetMapping("/admin/edit_product")
    public String editProductPage() {
        return "redirect:/admin/edit_product.html";
    }

    @PostMapping("/admin/update_product")
    public String handleUpdateProduct(
            @RequestParam("id") Long id,
            @RequestParam(value = "productName", required = false) String productName,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "sku", required = false) String sku,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) BigDecimal price,
            @RequestParam(value = "salePrice", required = false) BigDecimal salePrice,
            @RequestParam(value = "stock", required = false) Integer stock,
            @RequestParam(value = "minStock", required = false) Integer minStock,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            Product saved = productService.updateProduct(id, productName, category, sku, description,
                    price, salePrice, stock, minStock, status, image);
            return "redirect:/admin/products.html?updated=" + urlEncode(saved.getName());
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = "Failed to update product.";
            }
            return "redirect:/admin/edit_product.html?id=" + id + "&error=" + urlEncode(msg);
        }
    }

    @PostMapping("/admin/delete_product")
    public String handleDeleteProduct(@RequestParam("id") Long id) {
        try {
            productService.deleteProduct(id);
            return "redirect:/admin/products.html?deleted=1";
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = "Failed to delete product.";
            }
            return "redirect:/admin/products.html?error=" + urlEncode(msg);
        }
    }

    @GetMapping("/admin/categories")
    public List<Category> categories() {
        return categoryRepository.findAll();
    }
}
