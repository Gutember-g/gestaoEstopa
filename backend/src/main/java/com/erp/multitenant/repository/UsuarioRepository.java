package com.erp.multitenant.repository;

import com.erp.multitenant.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsernameAndTenantId(String username, String tenantId);

    Optional<Usuario> findByUsername(String username);
}
