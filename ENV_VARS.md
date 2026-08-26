# 🔐 Guia de Variáveis de Ambiente (ENV_VARS.md)

Este documento descreve todas as variáveis de ambiente necessárias para a implantação da aplicação em produção no **Vercel** (Frontend), **Render** (Backend) e **Neon** (PostgreSQL).

---

## 🎨 Frontend (Vercel Dashboard -> Environment Variables)

| Nome da Variável | Descrição | Exemplo em Produção | Obrigatório? |
| :--- | :--- | :--- | :---: |
| `VITE_API_URL` | URL completa da API backend no Render (incluindo o sufixo `/api`) | `https://erp-multitenant-backend.onrender.com/api` | **Sim** |

---

## ⚙️ Backend (Render Dashboard -> Environment Variables)

| Nome da Variável | Descrição | Exemplo em Produção | Obrigatório? |
| :--- | :--- | :--- | :---: |
| `SPRING_PROFILES_ACTIVE` | Perfil ativo do Spring Boot | `prod` | **Sim** |
| `PORT` | Porta HTTP do servidor web | `8080` *(ou atribuída dinamicamente pelo Render)* | **Sim** |
| `DATABASE_URL` | URL JDBC de conexão com o PostgreSQL do Neon *(Usar a URL da porta com `-pooler`)* | `jdbc:postgresql://ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` | **Sim** |
| `DB_USER` | Usuário do banco de dados PostgreSQL Neon | `seu_usuario_neon` | **Sim** |
| `DB_PASS` | Senha do banco de dados PostgreSQL Neon | `sua_senha_neon` | **Sim** |
| `DB_POOL_SIZE` | Tamanho máximo do pool de conexões do HikariCP | `10` | Não (Default: 10) |
| `DB_POOL_MIN_IDLE` | Conexões mínimas inativas no pool HikariCP | `2` | Não (Default: 2) |
| `JWT_SECRET_PROD` | Chave secreta de alta entropia para assinatura dos tokens JWT | `secret_key_prod_random_string_min_32_chars_123` | **Sim** |
| `ALLOWED_ORIGINS` | Origem(ns) frontend autorizadas pelo CORS (separadas por vírgula) | `https://seu-projeto.vercel.app` | **Sim** |
| `COOKIE_SAME_SITE` | Política SameSite do Cookie de Refresh Token | `None` | **Sim** *(para requisições cross-site)* |

---

## 🐘 Banco de Dados (Neon Console)

- Ao criar um projeto no **Neon**, obtenha as credenciais na aba **Connection Details**.
- **Dica de Performance / Scalability**: Selecione a opção **Pooled connection** (URL contendo `-pooler` no hostname, ex: `ep-xyz-pooler.us-east-2.aws.neon.tech`).
- Certifique-se de que a string de conexão inclui o parâmetro `sslmode=require`.
