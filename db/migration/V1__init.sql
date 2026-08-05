-- V1__init.sql - Estrutura Principal do ERP Multi-tenant

CREATE TABLE tb_cliente (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    inscricao_estadual VARCHAR(30),
    cpf_cnpj VARCHAR(20) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    observacao TEXT,
    tenant_id VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_cliente_tenant ON tb_cliente(tenant_id);

CREATE TABLE tb_produto (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    preco_custo NUMERIC(12, 2) NOT NULL,
    preco_venda NUMERIC(12, 2) NOT NULL,
    margem_lucro NUMERIC(5, 2),
    status VARCHAR(20) DEFAULT 'ATIVO' NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    ultima_movimentacao TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_produto_tenant ON tb_produto(tenant_id);

CREATE TABLE tb_venda (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES tb_cliente(id),
    data_venda TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    custo_total NUMERIC(12, 2) NOT NULL,
    valor_total NUMERIC(12, 2) NOT NULL,
    desconto NUMERIC(12, 2) DEFAULT 0.00,
    lucro_liquido NUMERIC(12, 2) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL
);

CREATE INDEX idx_venda_tenant ON tb_venda(tenant_id);

CREATE TABLE tb_item_venda (
    id BIGSERIAL PRIMARY KEY,
    venda_id BIGINT NOT NULL REFERENCES tb_venda(id) ON DELETE CASCADE,
    nome_produto VARCHAR(150) NOT NULL,
    custo_no_momento NUMERIC(12, 2) NOT NULL,
    preco_no_momento NUMERIC(12, 2) NOT NULL,
    quantidade INT NOT NULL
);

CREATE TABLE tb_parcela (
    id BIGSERIAL PRIMARY KEY,
    venda_id BIGINT NOT NULL REFERENCES tb_venda(id) ON DELETE CASCADE,
    numero_sequencial INT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'PENDENTE' NOT NULL,
    tenant_id VARCHAR(50) NOT NULL
);

CREATE INDEX idx_parcela_tenant_status ON tb_parcela(tenant_id, status);
