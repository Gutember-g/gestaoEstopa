package com.erp.multitenant.config;

import com.erp.multitenant.model.Usuario;
import com.erp.multitenant.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        usuarioRepository.findByUsername("admin").ifPresentOrElse(
                admin -> {
                    // Se a conta admin estiver com o hash inválido antigo, corrige automaticamente
                    if ("$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a".equals(admin.getSenhaHash())) {
                        admin.setSenhaHash(passwordEncoder.encode("admin123"));
                        usuarioRepository.save(admin);
                    }
                },
                () -> {
                    Usuario admin = new Usuario(
                            "admin",
                            passwordEncoder.encode("admin123"),
                            "gabriel@flowerp.com.br",
                            "Gabriel Andrade",
                            "Administrador",
                            "empresa_demo"
                    );
                    usuarioRepository.save(admin);
                }
        );
    }
}
