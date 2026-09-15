package io.proj.highgrand.controller;

import io.proj.highgrand.entity.Category;
import io.proj.highgrand.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryApiController {

    private final CategoryService categoryService;

    public CategoryApiController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<Map<String, Object>> all() {
        List<Map<String, Object>> result = new ArrayList<>();
        Map<Long, Long> counts = categoryService.productCounts();
        for (Category c : categoryService.findAll()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("name", c.getName());
            item.put("slug", c.getSlug());
            item.put("description", c.getDescription());
            item.put("status", c.getStatus());
            item.put("sortOrder", c.getSortOrder());
            item.put("productCount", counts.getOrDefault(c.getId(), 0L));
            item.put("hasImage", c.getImage() != null && c.getImage().length > 0);
            result.add(item);
        }
        return result;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "catName", required = false) String catName,
            @RequestParam(value = "slug", required = false) String slug,
            @RequestParam(value = "catSlug", required = false) String catSlug,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "catDesc", required = false) String catDesc,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "catOrder", required = false) Integer catOrder,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "catStatus", required = false) String catStatus,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "catImage", required = false) MultipartFile catImage) {
        String finalName = name != null && !name.isBlank() ? name : catName;
        String finalSlug = slug != null && !slug.isBlank() ? slug : catSlug;
        String finalDesc = description != null ? description : catDesc;
        Integer finalOrder = sortOrder != null ? sortOrder : catOrder;
        String finalStatus = status != null && !status.isBlank() ? status : catStatus;
        MultipartFile finalImg = image != null && !image.isEmpty() ? image : catImage;
        Category saved = categoryService.create(finalName, finalSlug, finalDesc, finalOrder, finalStatus, finalImg);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "name", saved.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "catName", required = false) String catName,
            @RequestParam(value = "slug", required = false) String slug,
            @RequestParam(value = "catSlug", required = false) String catSlug,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "catDesc", required = false) String catDesc,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "catOrder", required = false) Integer catOrder,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "catStatus", required = false) String catStatus,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "catImage", required = false) MultipartFile catImage) {
        String finalName = name != null && !name.isBlank() ? name : catName;
        String finalSlug = slug != null && !slug.isBlank() ? slug : catSlug;
        String finalDesc = description != null ? description : catDesc;
        Integer finalOrder = sortOrder != null ? sortOrder : catOrder;
        String finalStatus = status != null && !status.isBlank() ? status : catStatus;
        MultipartFile finalImg = image != null && !image.isEmpty() ? image : catImage;
        Category saved = categoryService.update(id, finalName, finalSlug, finalDesc, finalOrder, finalStatus, finalImg);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "name", saved.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(@PathVariable Long id) {
        return categoryService.findAll().stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .map(Category::getImage)
                .filter(img -> img != null && img.length > 0)
                .map(img -> ResponseEntity.ok()
                        .header("Content-Type", detectImageType(img))
                        .header("Cache-Control", "max-age=3600")
                        .body(img))
                .orElse(ResponseEntity.notFound().build());
    }

    private String detectImageType(byte[] img) {
        if (img.length >= 3 && (img[0] & 0xFF) == 0xFF && (img[1] & 0xFF) == 0xD8) return "image/jpeg";
        if (img.length >= 4 && (img[0] & 0xFF) == 0x89 && img[1] == 'P' && img[2] == 'N' && img[3] == 'G') return "image/png";
        if (img.length >= 3 && img[0] == 'G' && img[1] == 'I' && img[2] == 'F') return "image/gif";
        if (img.length >= 12 && img[8] == 'W' && img[9] == 'E' && img[10] == 'B' && img[11] == 'P') return "image/webp";
        return "image/jpeg";
    }
}
