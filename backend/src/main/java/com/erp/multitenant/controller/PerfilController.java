package com.erp.multitenant.controller;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.dto.AlterarSenhaDTO;
import com.erp.multitenant.dto.PerfilDTO;
import com.erp.multitenant.model.Usuario;
import com.erp.multitenant.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@RestController
@RequestMapping("/perfil")
public class PerfilController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    private PerfilDTO currentPerfil = new PerfilDTO(
            "Gabriel Andrade",
            "gabriel@flowerp.com.br",
            "Administrador",
            "",
            "15/01/2024",
            "Hoje às 19:05",
            "Empresa Demo"
    );

    public PerfilController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<PerfilDTO> getPerfil() {
        return ResponseEntity.ok(currentPerfil);
    }

    @PutMapping
    public ResponseEntity<PerfilDTO> updatePerfil(@RequestBody PerfilDTO dto) {
        this.currentPerfil = new PerfilDTO(
                dto.nome() != null ? dto.nome() : currentPerfil.nome(),
                dto.email() != null ? dto.email() : currentPerfil.email(),
                dto.cargo() != null ? dto.cargo() : currentPerfil.cargo(),
                dto.avatar() != null ? dto.avatar() : currentPerfil.avatar(),
                currentPerfil.dataCriacao(),
                currentPerfil.ultimoAcesso(),
                currentPerfil.tenant()
        );

        String username = resolveCurrentUsername();
        String tenantId = resolveCurrentTenant();

        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsernameAndTenantId(username, tenantId);
        if (usuarioOpt.isEmpty()) {
            usuarioOpt = usuarioRepository.findByUsername(username);
        }

        usuarioOpt.ifPresent(u -> {
            if (dto.nome() != null) u.setNome(dto.nome());
            if (dto.email() != null) u.setEmail(dto.email());
            if (dto.cargo() != null) u.setCargo(dto.cargo());
            usuarioRepository.save(u);
        });

        return ResponseEntity.ok(this.currentPerfil);
    }

    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@RequestBody AlterarSenhaDTO dto) {
        if (dto == null || dto.senhaAtual() == null || dto.novaSenha() == null || dto.novaSenha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual e nova senha são obrigatórias.");
        }

        String username = resolveCurrentUsername();
        String tenantId = resolveCurrentTenant();

        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsernameAndTenantId(username, tenantId);
        if (usuarioOpt.isEmpty()) {
            usuarioOpt = usuarioRepository.findByUsername(username);
        }

        if (usuarioOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado.");
        }

        Usuario usuario = usuarioOpt.get();

        if (!passwordEncoder.matches(dto.senhaAtual(), usuario.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha atual informada está incorreta.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(dto.novaSenha()));
        usuarioRepository.save(usuario);

        return ResponseEntity.noContent().build();
    }

    private String resolveCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "admin";
    }

    private String resolveCurrentTenant() {
        String tenant = TenantContext.getCurrentTenant();
        return (tenant != null && !tenant.isBlank()) ? tenant : "empresa_demo";
    }
}
