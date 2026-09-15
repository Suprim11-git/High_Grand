package io.proj.highgrand.config;

import io.proj.highgrand.entity.Category;
import io.proj.highgrand.repository.CategoryRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class CategorySeeder {

    private static final List<String> DEFAULT_CATEGORIES = List.of(
            "Footwear", "Men's Wear", "Women's Wear", "Accessories",
            "Fragrances", "Bags & Leather");

    @Bean
    ApplicationRunner seedCategories(CategoryRepository categories) {
        return args -> {
            for (String name : DEFAULT_CATEGORIES) {
                Category c = categories.findByNameIgnoreCase(name).orElse(null);
                if (c == null) {
                    categories.save(new Category(name));
                } else if (c.getStatus() == null || c.getStatus().isBlank()) {
                    c.setStatus("Active");
                    if (c.getSortOrder() == 0) {
                        c.setSortOrder(1);
                    }
                    categories.save(c);
                }
            }
        };
    }
}
