# 🔐 Guia de Variáveis de Ambiente (ENV_VARS.md)

Este documento descreve todas as variáveis de ambiente necessárias para a implantação da aplicação em produção no **Vercel** (Frontend), **Render** (Backend) e **Neon** (PostgreSQL).

---

## 🎨 Frontend (Vercel Dashboard -> Environment Variables)

| Nome da Variável | Descrição | Exemplo em Produção | Obrigatório? |
| :--- | :--- | :--- | :---: |
| `VITE_API_URL` | URL completa da API backend no Render (incluindo o sufixo `/api`) | `https://seu-backend-onrender.com/api` | **Sim** |

---

## ⚙️ Backend (Render Dashboard -> Environment Variables)

| Nome da Variável | Descrição | Exemplo em Produção | Obrigatório? |
| :--- | :--- | :--- | :---: |
| `SPRING_PROFILES_ACTIVE` | Perfil ativo do Spring Boot | `prod` | **Sim** |
| `PORT` | Porta HTTP do servidor web | `8080` *(ou atribuída dinamicamente pelo Render)* | **Sim** |
| `DATABASE_URL` | URL JDBC de conexão com o PostgreSQL do Neon (Pooled Connection com `-pooler`) | `jdbc:postgresql://<host>/<database>?sslmode=require` | **Sim** |
| `DB_USER` | Usuário do banco de dados PostgreSQL Neon | `<seu_usuario>` | **Sim** |
| `DB_PASS` | Senha do banco de dados PostgreSQL Neon | `<sua_senha>` | **Sim** |
| `DB_POOL_SIZE` | Tamanho máximo do pool de conexões do HikariCP | `10` | Não (Default: 10) |
| `DB_POOL_MIN_IDLE` | Conexões mínimas inativas no pool HikariCP | `2` | Não (Default: 2) |
| `JWT_SECRET_PROD` | Chave secreta de alta entropia para assinatura dos tokens JWT | `<sua_chave_secreta_jwt_min_32_chars>` | **Sim** |
| `ALLOWED_ORIGINS` | Origem(ns) frontend autorizadas pelo CORS (separadas por vírgula) | `https://seu-projeto.vercel.app` | **Sim** |
| `COOKIE_SAME_SITE` | Política SameSite do Cookie de Refresh Token | `None` | **Sim** *(para requisições cross-site)* |

---

## 🐘 Banco de Dados (Configuração do Neon)

- **Projeto**: `<nome_do_projeto_neon>`
- **Database**: `erp_prod`
- **Host (Pooled)**: `<ep-xxxx-pooler.region.aws.neon.tech>`
- **SSL Mode**: `sslmode=require`
