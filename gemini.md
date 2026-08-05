# ERP Multi-tenant – Sistema Web de Gestão Comercial e Financeira

## Objetivo do Projeto

Criar um sistema web corporativo multi-tenant para gestão comercial e financeira (ERP), com suporte estrito a dois ambientes (Desenvolvimento e Produção) e interface responsiva mobile-first, voltada para vendedores e gestores em campo.

## Papel do Agente

Atue como **Arquiteto de Software Full-Stack Senior** e **Engenheiro de Software Lead**.  
Seu objetivo é gerar:

- Estrutura completa de pastas e arquivos do repositório full-stack.
- Configurações de ambiente (dev/prod) para backend e frontend.
- Código base das entidades, services, controllers e filtros de multi-tenancy.
- Layout base do frontend (mobile-first) e configuração de rotas.
- Scripts SQL de migração e auditoria.
- Arquivos Docker/Docker Compose para dev e prod.

## Stack Tecnológica

### Backend

- Java 17+
- Spring Boot 3.x (Maven, `pom.xml`)
- Spring Data JPA / Hibernate
- Spring Security + JWT (multi-tenancy via `tenant_id` ou schema)
- `spring-boot-starter-validation`
- Banco de dados:
  - Dev: H2 in-memory ou PostgreSQL local via Docker
  - Prod: PostgreSQL gerenciado

### Frontend

- React 19
- Vite
- React Router DOM v6/v7 (SPA com `AppRoutes.jsx`)
- Axios (interceptors para JWT e `X-Tenant-ID`)
- Tailwind CSS (mobile-first, breakpoints `sm:`, `md:`, `lg:`)

### Infra / DevOps

- Docker & Docker Compose
- Perfis Spring: `dev`, `prod`
- Arquivos `.env.development` e `.env.production` no frontend

## Arquitetura e Decisões-Chave

- **Multi-tenancy:**
  - Identificação do tenant via JWT e/ou header `X-Tenant-ID`.
  - Isolamento garantido em todas as consultas (Clientes, Produtos, Vendas, Parcelas).
  - Estratégia: multi-tenancy por linha (`tenant_id`) ou por schema (definir no código gerado).

- **Ambientes:**
  - Backend: `application-dev.yml` e `application-prod.yml`.
  - Frontend: `.env.development` e `.env.production`.
  - Dev: logs DEBUG, CORS para `localhost:5173`, JWT com validade maior.
  - Prod: logs INFO/WARN, CORS restrito, HTTPS obrigatório, secrets via vault.

- **UI/UX Mobile-First:**
  - Layouts pensados primeiro para smartphones/tablets.
  - Alvos de toque ≥ 44px.
  - Tabelas responsivas (scroll horizontal ou visualização em cards em mobile).
  - Navegação via menu Drawer / Bottom Navigation em mobile.

## Estrutura de Pastas Esperada (alta-level)

```text
/
  /backend
    /src/main/java/...
    /src/main/resources
      application.yml
      application-dev.yml
      application-prod.yml
  /frontend
    /src
      /components
      /pages
      /services
      /routes
        AppRoutes.jsx
      main.jsx
    .env.development
    .env.production
    vite.config.js
  /infra
    docker-compose.dev.yml
    docker-compose.prod.yml
    Dockerfile.backend
    Dockerfile.frontend
  /db
    migration.sql
    migration-suporte.sql
  /docs
    README.md
    CLAUDE.md
```

## Módulos e Funcionalidades Principais

1. **Multi-tenancy Integrado**
   - Filtro JWT identificando a empresa/tenant.
   - Isolamento em todas as consultas.

2. **Gestão de Clientes e Produtos**
   - `Cliente`: nome, inscrição, CPF/CNPJ, telefone, e-mail, `observacao`, `tenant_id`.
   - `Produto`: nome, precoCusto, precoVenda, margemLucro, status (ATIVO/INATIVO), `tenant_id`.

3. **Controle Comercial e Vendas (Snapshot)**
   - `Venda`: custoTotal, valorTotal, desconto, lucroLiquido, `tenant_id`.
   - `ItemVenda` (snapshot): nomeProduto, custoNoMomento, precoNoMomento, quantidade, `venda_id`.

4. **Controle Financeiro e Parcelas**
   - `Parcela`: venda_id, numeroSequencial, valor, dataVencimento, dataPagamento, status (PENDENTE, PAGO, CANCELADO, ATRASADO), `tenant_id`.

5. **Dashboard e Métricas**
   - `DashboardService` com endpoints para:
     - Faturamento mensal e lucro líquido.
     - Fluxo de caixa (recebido vs pendente).
     - Evolução diária de vendas/lucro.
     - Top clientes.
     - Alertas: parcelas atrasadas/vencendo hoje, produtos sem movimento > 30 dias.

6. **Banco de Dados e Migrações**
   - `migration.sql`: estrutura base das tabelas, suporte a `observacao` e snapshots.
   - `migration-suporte.sql`: tabela `tb_auditoria_suporte` e conta técnica de suporte.

## Regras de Ambiente (Dev vs Prod)

### Backend (Spring Profiles)

- `application-dev.yml`:
  - H2 ou PostgreSQL local.
  - Logs DEBUG.
  - CORS: `http://localhost:5173`.
  - JWT com expiração longa.

- `application-prod.yml`:
  - PostgreSQL via variáveis de ambiente.
  - Logs INFO/WARN.
  - CORS restrito ao domínio oficial.
  - HTTPS obrigatório, secrets via vault.

### Frontend (Vite)

- `.env.development`:
  ```env
  VITE_API_URL=http://localhost:8080/api
  ```
- `.env.production`:
  ```env
  VITE_API_URL=https://api.seudominio.com/api
  ```

## O Que o Agente Deve Gerar (Entrega Esperada)

Por favor, gere a resposta organizada nas seguintes seções:

1. **Estrutura de pastas e arquivos** do repositório full-stack.
2. **Backend:**
   - Configurações de ambiente (`application-dev.yml`, `application-prod.yml`).
   - Filtro de multi-tenancy (ex.: `TenantFilter` ou `HandlerInterceptor`).
   - Entidades JPA: `Cliente`, `Produto`, `Venda`, `ItemVenda`, `Parcela`.
   - `DashboardService` e Controllers REST relacionados.
3. **Frontend:**
   - Configurações de ambiente do Vite (`.env.*`).
   - Instância centralizada do Axios com interceptors.
   - `AppRoutes.jsx` com rotas principais.
   - Layout base mobile-first do Dashboard com cards responsivos.
4. **Scripts SQL:**
   - `migration.sql` (estrutura completa).
   - `migration-suporte.sql` (auditoria e conta de suporte).
5. **Docker / Deploy:**
   - `docker-compose.dev.yml`.
   - `docker-compose.prod.yml`.
   - Dockerfiles de backend e frontend (se necessário).

## Restrições e “Não Fazer”

- Não usar outras stacks (ex.: Node no backend, MongoDB, etc.).
- Não misturar configurações de dev e prod no mesmo arquivo.
- Não gerar código que ignore multi-tenancy em nenhuma query.
- Não criar UI desktop-first; todo layout deve ser mobile-first.
- Não omitir tratamento de erros e validações básicas.

## Critérios de Qualidade / Aceitação

- Código compilável e rodável (backend e frontend).
- Separação clara entre dev e prod em todos os arquivos de configuração.
- Multi-tenancy aplicado de forma consistente em todas as camadas.
- Layout responsivo mobile-first, funcional em telas pequenas.
- Scripts SQL completos, coerentes e prontos para migração.
- Estrutura de pastas clara e sustentável para evolução futura.

## Comandos Úteis (referência)

- Backend (dev):
  ```bash
  cd backend
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
  ```
- Frontend (dev):
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- Docker (dev):
  ```bash
  docker compose -f infra/docker-compose.dev.yml up --build
  ```

## Como o Agente Deve Responder

- Use blocos de código separados por arquivo, com caminho no topo:
  ```md
  ### backend/src/main/resources/application-dev.yml
  ```yaml
  # conteúdo
  ```
  ```
- Mantenha a organização exatamente nas 5 seções de “Entrega Esperada”.
- Não resuma demais; gere o conteúdo real dos arquivos principais.
