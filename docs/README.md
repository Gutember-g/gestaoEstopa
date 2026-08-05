# ERP Multi-tenant – Sistema de Gestão Comercial e Financeira

Sistema ERP Corporativo full-stack multi-tenant com foco em usabilidade mobile-first para equipes de campo e gestores.

## Tecnologias

- **Backend**: Java 17+, Spring Boot 3.2, Spring Security + JWT, Spring Data JPA, Flyway, H2 (Dev) e PostgreSQL (Prod).
- **Frontend**: React 19, Vite, TanStack Query v5, Axios, React Router DOM v6, Tailwind CSS (Mobile-First).
- **Infraestrutura**: Docker, Docker Compose (Dev/Prod).

## Execução Local (Dev)

### Backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker Compose
```bash
docker compose -f infra/docker-compose.dev.yml up --build
```
