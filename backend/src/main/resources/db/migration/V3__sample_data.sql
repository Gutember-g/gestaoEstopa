-- V3__sample_data.sql - Seed data para empresa_demo

INSERT INTO tb_cliente (nome, cpf_cnpj, telefone, email, tenant_id) VALUES
('Distribuidora Silva & Cia', '12.345.678/0001-90', '(11) 98765-4321', 'contato@silva.com', 'empresa_demo'),
('Auto Peças Modelo Ltda', '98.765.432/0001-10', '(11) 97654-3210', 'vendas@modelo.com', 'empresa_demo'),
('Comércio Industrial Souza', '45.678.901/0001-23', '(11) 96543-2109', 'financeiro@souza.com', 'empresa_demo'),
('Mecânica Express Eireli', '34.567.890/0001-45', '(11) 95432-1098', 'atendimento@express.com', 'empresa_demo');

INSERT INTO tb_produto (nome, preco_custo, preco_venda, margem_lucro, status, tenant_id, ultima_movimentacao) VALUES
('Estopa Branca Premium 1kg', 8.50, 15.00, 76.47, 'ATIVO', 'empresa_demo', CURRENT_TIMESTAMP),
('Estopa Colorida Especial 500g', 3.80, 7.50, 97.37, 'ATIVO', 'empresa_demo', CURRENT_TIMESTAMP),
('Retalho de Malha Algodão 5kg', 22.00, 42.00, 90.91, 'ATIVO', 'empresa_demo', CURRENT_TIMESTAMP),
('Pano de Chão Alvejado 10 un', 12.00, 25.00, 108.33, 'ATIVO', 'empresa_demo', DATEADD('DAY', -35, CURRENT_TIMESTAMP));

INSERT INTO tb_venda (cliente_id, data_venda, custo_total, valor_total, desconto, lucro_liquido, tenant_id) VALUES
(2, CURRENT_TIMESTAMP, 2500.00, 6450.00, 0.00, 3950.00, 'empresa_demo'),
(3, CURRENT_TIMESTAMP, 1800.00, 4200.00, 0.00, 2400.00, 'empresa_demo'),
(4, CURRENT_TIMESTAMP, 1200.00, 2800.00, 0.00, 1600.00, 'empresa_demo'),
(5, CURRENT_TIMESTAMP, 500.00, 1100.00, 0.00, 600.00, 'empresa_demo');

INSERT INTO tb_parcela (venda_id, numero_sequencial, valor, data_vencimento, data_pagamento, status, tenant_id) VALUES
(1, 1, 3225.00, DATEADD('DAY', -5, CURRENT_DATE), DATEADD('DAY', -5, CURRENT_DATE), 'PAGA', 'empresa_demo'),
(1, 2, 3225.00, DATEADD('DAY', 25, CURRENT_DATE), NULL, 'PENDENTE', 'empresa_demo'),
(2, 1, 4200.00, DATEADD('DAY', -10, CURRENT_DATE), DATEADD('DAY', -10, CURRENT_DATE), 'PAGA', 'empresa_demo'),
(3, 1, 2800.00, DATEADD('DAY', -2, CURRENT_DATE), NULL, 'PENDENTE', 'empresa_demo'),
(4, 1, 1100.00, CURRENT_DATE, NULL, 'PENDENTE', 'empresa_demo');
