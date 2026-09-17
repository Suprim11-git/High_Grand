package io.proj.highgrand.config;

import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.UserRepository;
import io.proj.highgrand.security.CustomAuthenticationSuccessHandler;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * BCrypt password encoder.
     *
     * Passwords are never stored as plain text.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Main Spring Security configuration.
     */

    @Bean
    public CustomAuthenticationSuccessHandler
    customAuthenticationSuccessHandler() {

        return new CustomAuthenticationSuccessHandler();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CustomAuthenticationSuccessHandler successHandler)
            throws Exception {

        http
                /*
                 * The current High Grand frontend is made from
                 * static HTML pages. CSRF will be handled separately
                 * when the customer APIs are implemented.
                 */
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        // --------------------------------
                        // Public pages
                        // --------------------------------
                        .requestMatchers(
                                "/",
                                "/signup",
                                "/home",
                                "/index",
                                "/Home.html",
                                "/error",
                                "/pages/auth/**",
                                "/pages/product/**",
                                "/pages/account/**",
                                "/pages/cart/**",
                                "/pages/checkout/**",
                                "/pages/order/**",
                                "/css/**",
                                "/js/**",
                                "/assets/**",
                                "/favicon.ico"
                        ).permitAll()

                        // --------------------------------
                        // Public product/category/order APIs
                        // --------------------------------
                        .requestMatchers(
                                "/api/products",
                                "/api/products/**",
                                "/api/categories",
                                "/api/categories/**",
                                "/api/orders",
                                "/api/orders/**",
                                "/api/admin/dashboard/**"
                        ).permitAll()

                        // --------------------------------
                        // Authentication endpoints
                        // --------------------------------
                        .requestMatchers(
                                "/register",
                                "/login"
                        ).permitAll()

                        // --------------------------------
                        // Admin area
                        // --------------------------------
                        .requestMatchers("/admin/**", "/admin/api/**")
                        .hasRole("ADMIN")

                        // --------------------------------
                        // Everything else
                        // --------------------------------
                        .anyRequest().authenticated()
                )

                // --------------------------------
                // Form login
                // --------------------------------
                .formLogin(form -> form

                        .loginPage("/pages/auth/login.html")

                        .loginProcessingUrl("/login")

                        .usernameParameter("username")

                        .passwordParameter("password")

                        .successHandler(successHandler)

                        .failureUrl(
                                "/pages/auth/login.html?error=invalid"
                        )

                        .permitAll()
                )

                // --------------------------------
                // Logout
                // --------------------------------
                .logout(logout -> logout

                        .logoutUrl("/logout")

                        .logoutSuccessUrl(
                                "/pages/auth/login.html?logout=true"
                        )

                        .invalidateHttpSession(true)

                        .deleteCookies("JSESSIONID")

                        .permitAll()
                )

                // --------------------------------
                // Access denied
                // --------------------------------
                .exceptionHandling(exception -> exception

                        .accessDeniedHandler(
                                (request, response, accessDeniedException) -> {

                                    response.sendRedirect(
                                            "/pages/auth/login.html?error=access"
                                    );
                                }
                        )
                );

        return http.build();
    }

    /**
     * Create the default administrator account.
     *
     * This runs when the application starts.
     */
    @Bean
    CommandLineRunner createAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            if (userRepository.findByUsername("admin").isEmpty()) {

                User admin = new User();

                admin.setName("High Grand Administrator");

                admin.setUsername("admin");

                admin.setEmail(
                        "admin@highgrand.com"
                );

                admin.setPassword(
                        passwordEncoder.encode("admin123")
                );

// ADMIN role
                admin.setRoleId(2L);
                admin.setRole("ADMIN");

                admin.setEnabled(true);

                userRepository.save(admin);

                userRepository.save(admin);

                System.out.println(
                        "======================================"
                );

                System.out.println(
                        "High Grand admin account created."
                );

                System.out.println(
                        "Username: admin"
                );

                System.out.println(
                        "Password: admin123"
                );

                System.out.println(
                        "======================================"
                );
            }
        };
    }
}