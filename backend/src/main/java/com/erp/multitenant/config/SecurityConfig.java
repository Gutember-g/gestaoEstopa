package com.erp.multitenant.config;

import com.erp.multitenant.security.CustomAccessDeniedHandler;
import com.erp.multitenant.security.CustomAuthenticationEntryPoint;
import com.erp.multitenant.security.JwtAuthenticationFilter;
import com.erp.multitenant.security.TenantFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final TenantFilter tenantFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    public SecurityConfig(
            TenantFilter tenantFilter,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomAuthenticationEntryPoint authenticationEntryPoint,
            CustomAccessDeniedHandler accessDeniedHandler
    ) {
        this.tenantFilter = tenantFilter;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/h2-console/**",
                    "/auth/**",
                    "/health",
                    "/api/health",
                    "/actuator/health",
                    "/error",
                    "/perfil/**",
                    "/empresa/**",
                    "/configuracoes/**",
                    "/notificacoes/**",
                    "/dashboard/**",
                    "/clientes/**",
                    "/produtos/**",
                    "/vendas/**",
                    "/financeiro/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .addFilterBefore(tenantFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // SEGURANÇA: Com allowCredentials(true) ativado, evitamos wildcards amplos (ex: https://*.vercel.app)
        // para impedir que aplicações de terceiros no mesmo domínio compartilhado tenham acesso aos cookies/tokens.
        // Usamos setAllowedOrigins para origens fixas e setAllowedOriginPatterns apenas para padrões de preview restritos ao projeto.
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                                     .map(String::trim)
                                     .filter(s -> !s.isBlank())
                                     .toList();

        List<String> exactOrigins = origins.stream().filter(o -> !o.contains("*")).toList();
        List<String> patternOrigins = origins.stream().filter(o -> o.contains("*")).toList();

        if (!exactOrigins.isEmpty()) {
            configuration.setAllowedOrigins(exactOrigins);
        }
        if (!patternOrigins.isEmpty()) {
            configuration.setAllowedOriginPatterns(patternOrigins);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Tenant-ID", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(List.of("Authorization", "X-Tenant-ID"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);


        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
