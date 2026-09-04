package com.erp.multitenant.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class SecurityExceptionHandlingTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Deve retornar HTTP 401 JSON com mensagem clara quando requisitar rota protegida sem token")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/admin/secret"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType("application/json;charset=UTF-8"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Deve aceitar preflight OPTIONS CORS de origem Vercel preview com headers adequados")
    void shouldAllowCorsPreflightForVercelPreview() throws Exception {
        mockMvc.perform(options("/auth/login")
                .header("Origin", "https://gestao-estopa-git-dev-gutember-g.vercel.app")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type, X-Tenant-ID"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://gestao-estopa-git-dev-gutember-g.vercel.app"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("Deve aceitar preflight OPTIONS CORS de localhost")
    void shouldAllowCorsPreflightForLocalhost() throws Exception {
        mockMvc.perform(options("/auth/login")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type, X-Tenant-ID"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
}
