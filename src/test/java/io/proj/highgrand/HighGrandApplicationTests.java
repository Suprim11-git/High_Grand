package io.proj.highgrand;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class HighGrandApplicationTests {

    @org.springframework.beans.factory.annotation.Autowired
    private io.proj.highgrand.service.ProductService productService;

    @Test
    void testCreateProduct() {
        byte[] testImage = new byte[100 * 1024];
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "image", "test.jpg", "image/jpeg", testImage);
        io.proj.highgrand.entity.Product p = productService.createProduct(
                "Test Oxford Shoes", "Footwear", "TEST-SKU-" + System.currentTimeMillis(),
                "Description", new java.math.BigDecimal("12000"), null,
                10, 2, "Active", file);
        org.junit.jupiter.api.Assertions.assertNotNull(p.getId());
        productService.deleteProduct(p.getId());
    }
}
