package com.erp.multitenant.security;

import com.erp.multitenant.model.Usuario;
import com.erp.multitenant.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AuthSenhaTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        Usuario usuario = usuarioRepository.findByUsername("admin")
                .orElseGet(() -> new Usuario("admin", "", "admin@gestaoestopa.com", "Gabriel Andrade", "Administrador", "empresa_demo"));

        usuario.setNome("Gabriel Andrade");
        usuario.setEmail("gabriel@flowerp.com.br");
        usuario.setCargo("Administrador");
        usuario.setSenhaHash(passwordEncoder.encode("admin123"));
        usuarioRepository.save(usuario);
    }

    @Test
    @DisplayName("FLUXO COMPLETO: Login com senha antiga funciona, altera senha, senha antiga falha e nova funciona")
    void testFluxoTrocaDeSenhaEAutenticacao() throws Exception {
        // 1. Tentar logar com a senha inicial (admin123) -> DEVE FUNCIONAR
        MvcResult loginInicialResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "username": "admin",
                                    "password": "admin123",
                                    "tenantId": "empresa_demo"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn();

        String responseBody = loginInicialResult.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        String accessToken = jsonNode.get("accessToken").asText();

        // 2. Trocar a senha do usuário via /perfil/senha
        mockMvc.perform(put("/perfil/senha")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "senhaAtual": "admin123",
                                    "novaSenha": "novaSenhaSegura456"
                                }
                                """))
                .andExpect(status().isNoContent());

        // 3. Tentar logar com a SENHA ANTIGA (admin123) -> DEVE FALHAR (401 Unauthorized)
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "username": "admin",
                                    "password": "admin123",
                                    "tenantId": "empresa_demo"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Credenciais inválidas. Usuário ou senha incorretos."));

        // 4. Tentar logar com a SENHA NOVA (novaSenhaSegura456) -> DEVE FUNCIONAR (200 OK)
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "username": "admin",
                                    "password": "novaSenhaSegura456",
                                    "tenantId": "empresa_demo"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    @DisplayName("PERSISTENCIA: Alterar dados de perfil via PUT /perfil deve persistir no banco e retornar em GET /perfil")
    void testPersistenciaDePerfil() throws Exception {
        // 1. Alterar o perfil do usuário
        mockMvc.perform(put("/perfil")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "nome": "Gabriel Andrade Editado",
                                    "email": "gabriel.editado@flowerp.com.br",
                                    "cargo": "Diretor Comercial"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Gabriel Andrade Editado"))
                .andExpect(jsonPath("$.email").value("gabriel.editado@flowerp.com.br"))
                .andExpect(jsonPath("$.cargo").value("Diretor Comercial"));

        // 2. Fazer GET /perfil e confirmar que os dados persistidos continuam iguais (não resetam)
        mockMvc.perform(get("/perfil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Gabriel Andrade Editado"))
                .andExpect(jsonPath("$.email").value("gabriel.editado@flowerp.com.br"))
                .andExpect(jsonPath("$.cargo").value("Diretor Comercial"));
    }

    @Test
    @DisplayName("SEGURANCA: Troca de senha com senha atual errada deve ser rejeitada com 400 Bad Request")
    void testTrocaDeSenhaComSenhaAtualIncorreta() throws Exception {
        mockMvc.perform(put("/perfil/senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "senhaAtual": "senhaErrada123",
                                    "novaSenha": "tentativaNovaSenha"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
