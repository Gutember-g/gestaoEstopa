# 🔐 Guia de Variáveis de Ambiente & Ambientes (ENV_VARS.md)

Este documento descreve como os dois ambientes (**Desenvolvimento** e **Produção**) estão estruturados nas plataformas **Vercel** (Frontend), **Render** (Backend) e **Neon** (PostgreSQL).

---

## 🔀 Estrutura de Branches & Ambientes

| Ambiente | Branch Git | Vercel (Frontend) | Render (Backend) | Neon (PostgreSQL) |
| :--- | :--- | :--- | :--- | :--- |
| **Produção** | `main` | Production Environment | Web Service (`prod`) | Database: `erp_prod` |
| **Desenvolvimento** | `Dev` | Preview / Dev Environment | Web Service (`dev`) | Database: `erp_dev` |

---

## 🎨 1. Frontend (Vercel Dashboard)

### Ambiente de Produção (Branch `main`):
- **Environment Variable**: `VITE_API_URL`
- **Valor**: `https://erp-multitenant-backend.onrender.com/api` *(URL do Backend de Produção)*

### Ambiente de Desenvolvimento (Branch `Dev`):
- **Environment Variable**: `VITE_API_URL`
- **Valor**: `https://erp-multitenant-backend-dev.onrender.com/api` *(URL do Backend de Desenvolvimento)*

---

## ⚙️ 2. Backend (Render Dashboard)

### Serviço 1: Backend de Produção (`erp-multitenant-backend`)
- **Branch**: `main`
- **Environment Variables**:
  - `SPRING_PROFILES_ACTIVE`: `prod`
  - `DATABASE_URL`: `jdbc:postgresql://ep-flat-meadow-af0vk2kj-pooler.c-2.us-west-2.aws.neon.tech/erp_prod?sslmode=require`
  - `DB_USER`: `neondb_owner`
  - `DB_PASS`: `npg_hKD1elJ7VyGZ`
  - `JWT_SECRET_PROD`: `8f4a1c9e3b7d5f2a6c8e0b4d9a1f3c7e5b2d8a4c9f1e3b7d5f2a6c8e0b4d9a1f`
  - `ALLOWED_ORIGINS`: `https://seu-frontend.vercel.app`
  - `COOKIE_SAME_SITE`: `None`

### Serviço 2: Backend de Desenvolvimento (`erp-multitenant-backend-dev`)
- **Branch**: `Dev`
- **Environment Variables**:
  - `SPRING_PROFILES_ACTIVE`: `prod` *(ou `dev` se usar banco em memória H2 local)*
  - `DATABASE_URL`: `jdbc:postgresql://ep-flat-meadow-af0vk2kj-pooler.c-2.us-west-2.aws.neon.tech/erp_dev?sslmode=require`
  - `DB_USER`: `neondb_owner`
  - `DB_PASS`: `npg_hKD1elJ7VyGZ`
  - `JWT_SECRET_PROD`: `dev_secret_key_super_segura_para_desenvolvimento_local_123456789`
  - `ALLOWED_ORIGINS`: `https://seu-frontend-dev.vercel.app,http://localhost:5173`
  - `COOKIE_SAME_SITE`: `None`

---

## 🐘 3. Banco de Dados (Neon PostgreSQL)

- **Projeto**: `gestao-estopa` (`billowing-glade-59885269`)
- **Host (Pooled Endpoint)**: `ep-flat-meadow-af0vk2kj-pooler.c-2.us-west-2.aws.neon.tech`
- **Banco de Produção**: `erp_prod`
- **Banco de Desenvolvimento**: `erp_dev`
- **SSL Mode**: `sslmode=require`
