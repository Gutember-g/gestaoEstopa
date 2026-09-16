-- V8__create_usuario_table.sql - Tabela de Usuários e Autenticação

CREATE TABLE tb_usuario (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    nome VARCHAR(150),
    cargo VARCHAR(100),
    tenant_id VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_usuario_username_tenant UNIQUE (username, tenant_id)
);

CREATE INDEX idx_usuario_username_tenant ON tb_usuario(username, tenant_id);

-- Carga Inicial de Usuário Padrão (admin / admin123)
-- Hash BCrypt para a senha 'admin123': $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a
INSERT INTO tb_usuario (username, senha_hash, email, nome, cargo, tenant_id)
VALUES ('admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'gabriel@flowerp.com.br', 'Gabriel Andrade', 'Administrador', 'empresa_demo');
