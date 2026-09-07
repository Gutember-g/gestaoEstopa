# 📌 Estado do Projeto (PROJECT_STATE.md)

Este documento registra o estado atual da arquitetura, funcionalidades, decisões técnicas e diretrizes de desenvolvimento do projeto **gestaoEstopa**. 

Seu objetivo é dar **contexto aos desenvolvedores e IAs** para evitar regressões e quebras acidentais em funcionalidades existentes, **sem impedir a evolução do código ou a refatoração de partes não sensíveis**.

---

## 1. Visão geral

- **O que o projeto faz**: O **gestaoEstopa** é um sistema ERP SaaS Multi-tenant voltado para a gestão comercial e operacional de empresas de comércio e distribuição de estopas, panos industriais e trapos. O sistema gerencia cadastro de clientes, catálogo de produtos, controle de estoque com baixa automática, lançamento de vendas com geração de parcelas financeiras, módulo financeiro de contas a receber/pagar, emissão/disparo de pedidos (via E-mail e WhatsApp) e dashboards com métricas de desempenho.
- **Stack principal**:
  - **Frontend**: React 18, Vite, Tailwind CSS, Axios, Lucide React, Recharts, React Router v6.
  - **Backend**: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA / Hibernate, Flyway.
  - **Banco de Dados**: H2 (em memória por padrão em Dev) e PostgreSQL no Neon (bancos `erp_dev` e `erp_prod` em nuvem).
  - **Integrações & Libs**: SendGrid (envio de e-mails), Twilio / WhatsApp Business Cloud API (mensagens), Apache POI / iText / PDFBox (relatórios PDF/XLSX/CSV).
  - **Hospedagem & Infra**: Vercel (Frontend), Render (Backend Web Service), Neon (PostgreSQL Cloud Serverless).

---

## 2. Funcionalidades que já funcionam

| Funcionalidade | Status | O que faz | Onde está implementada |
| :--- | :--- | :--- | :--- |
| **Autenticação & Sessão** | **Estável** | Login com credenciais, logout, Silent Refresh via cookie `HttpOnly` e gestão de token JWT estritamente em memória RAM. | [AuthController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/AuthController.java), [authStore.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/services/authStore.js), [api.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/services/api.js) |
| **Isolamento Multi-tenant** | **Estável** | Captura do tenant via cabeçalho `X-Tenant-ID` e isolamento no contexto do thread da requisição (`ThreadLocal`). | [TenantFilter.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/security/TenantFilter.java), [TenantContext.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/config/TenantContext.java) |
| **Gestão de Clientes** | **Estável** | CRUD completo de clientes, filtro por texto/status e exportação em CSV, XLSX e PDF. | [ClienteController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/ClienteController.java), [Clientes.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Clientes.jsx) |
| **Gestão de Produtos & Estoque** | **Estável** | Cadastro de produtos, controle de estoque com baixa automática e alertas de estoque baixo. | [ProdutoController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/ProdutoController.java), [Produtos.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Produtos.jsx) |
| **Lançamento de Vendas** | **Estável** | Registro de vendas multi-item, cálculo automático de totais, atualização imediata do estoque e lançamento de parcelas financeiras. | [VendaController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/VendaController.java), [VendaService.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/service/VendaService.java), [Vendas.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Vendas.jsx) |
| **Módulo Financeiro** | **Estável** | Controle de parcelas a receber/pagar, liquidação/alteração de status (Paga, Pendente, Atrasada) e filtros por período. | [FinanceiroController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/FinanceiroController.java), [Financeiro.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Financeiro.jsx) |
| **Dashboard & Métricas** | **Estável** | Indicadores de faturamento, ticket médio, gráficos de vendas por produto (DonutChart) e funil de conversão (FunnelChart). | [DashboardController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/DashboardController.java), [Dashboard.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Dashboard.jsx) |
| **Emissão & Disparo de Pedidos** | **Em evolução** | Geração de PDFs/XLSX de pedidos e envio de notificações por E-mail (SendGrid) e WhatsApp com histórico de envios. | [VendaEnvioService.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/service/VendaEnvioService.java), [ConfiguracaoEnvioController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/ConfiguracaoEnvioController.java) |
| **Perfil & Configurações** | **Em evolução** | Atualização dos dados da empresa tenant, preferências de integração e troca de senha do usuário. | [PerfilController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/PerfilController.java), [EmpresaController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/EmpresaController.java) |

---

## 3. Decisões técnicas importantes

1. **Access Token JWT exclusivamente em Memória RAM (`authStore.js`)**:
   - **Por quê**: Armazenar tokens em `localStorage` ou `sessionStorage` expõe o sistema a roubo de sessão via ataques XSS (Cross-Site Scripting). O token JWT fica retido apenas na variável da memória JavaScript da aplicação.
2. **Refresh Token em Cookie `HttpOnly` + `SameSite` com Silent Refresh (`api.js`)**:
   - **Por quê**: O cookie `HttpOnly` é inacessível para scripts maliciosos. Quando o Access Token expira (HTTP 401), o interceptor Axios renova a sessão automaticamente chamando `/auth/refresh` de forma transparente.
3. **Fila de Concorrência para Renovação de Token (`isRefreshing` e `failedQueue`)**:
   - **Por quê**: Se uma tela dispara 5 requisições em paralelo e o token expirou, o interceptor retém 4 requisições em uma fila de promessas enquanto a primeira realiza o refresh. Isso evita múltiplas chamadas simultâneas de refresh que poderiam invalidar a sessão ou causar *race conditions*.
4. **Multi-tenancy via Cabeçalho HTTP `X-Tenant-ID` e `ThreadLocal` (`TenantContext`)**:
   - **Por quê**: Permite identificar o tenant de cada requisição sem a complexidade de alterar esquemas dinâmicos no PostgreSQL. Caso o cabeçalho não seja enviado, é aplicado o valor padrão `empresa_demo` para evitar exceções em requisições de desenvolvimento.
5. **H2 em Memória em Dev e PostgreSQL (Neon) em Prod**:
   - **Por quê**: Permite que desenvolvedores subam o backend e rodem testes sem depender de instâncias externas ou Docker instalados localmente. Em produção, usa-se o PostgreSQL no Neon com SSL obrigatoriamente.
6. **Controle de Migrações exclusivamente por Flyway**:
   - **Por quê**: Garante consistência do modelo de dados entre ambientes (`V1__init.sql` a `V6__clean_sample_data.sql`). O Hibernate está configurado com `ddl-auto: validate` em produção para proibir alterações automáticas imprevistas no schema.

---

## 4. Pontos sensíveis / armadilhas conhecidas

- ⚠️ **Limpeza do `TenantContext` no bloco `finally`**:
  - O `TenantFilter` deve **sempre** executar `TenantContext.clear()` em um bloco `finally`. Em servidores Tomcat, as threads são reaproveitadas entre requisições; esquecer de limpar o `ThreadLocal` causará vazamento de dados de um tenant para outro.
- ⚠️ **Perda de dados ao reiniciar o backend em Dev**:
  - Por usar `jdbc:h2:mem:erpdb` por padrão no [application-dev.yml](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/resources/application-dev.yml#L3), os dados criados via interface somem ao reiniciar a aplicação. Caso precise manter dados salvos no dev local, mude para H2 em arquivo (`jdbc:h2:file:./data/erpdb`).
- ⚠️ **Suporte a CORS com Credenciais (`allowCredentials: true`)**:
  - Em [SecurityConfig.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/config/SecurityConfig.java#L124), as origens devem ser explicitamente mapeadas (ou usar `allowedOriginPatterns`). O uso de `allowedOrigins("*")` combinado com `allowCredentials(true)` é rejeitado pelos navegadores e bloqueia as chamadas do frontend.
- ⚠️ **Transacionalidade no Lançamento de Vendas (`VendaService.java`)**:
  - A operação de venda realiza múltiplas mutações no banco (baixa de estoque no `ProdutoRepository`, salvamento no `VendaRepository` e geração de itens no `ParcelaRepository`). Todo o método deve permanecer sob `@Transactional` para evitar estoques dessincronizados ou parcelas órfãs em caso de exceção.

---

## 5. Configuração e variáveis de ambiente

Documentação detalhada disponível no arquivo [ENV_VARS.md](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/ENV_VARS.md).

### Frontend (Vercel / Local):
- `VITE_API_URL`: URL base dos endpoints REST (ex: `http://localhost:8080/api` em local ou `https://erp-multitenant-backend-dev.onrender.com/api` em Dev no Render).

### Backend (Render / Local):
- `SPRING_PROFILES_ACTIVE`: Define o perfil ativo (`dev` ou `prod`).
- `DATABASE_URL`: URL de conexão JDBC PostgreSQL (`jdbc:postgresql://.../erp_prod?sslmode=require`).
- `DB_USER` / `DB_PASS`: Credenciais do banco de dados Neon.
- `JWT_SECRET_DEV` / `JWT_SECRET_PROD`: Segredo HMAC-SHA para assinar e validar os tokens JWT.
- `ALLOWED_ORIGINS`: Origens permitidas para requisições CORS (separadas por vírgula).
- `COOKIE_SAME_SITE`: Política do cookie de refresh (`Lax` para dev local HTTP, `None` para prod HTTPS cross-site).
- `SENDGRID_API_KEY` / `TWILIO_*`: Credenciais para serviços externos de notificação (opcionais em dev).

---

## 6. O que NÃO fazer sem avisar

1. 🚫 **Não mover o Access Token JWT para `localStorage` ou `sessionStorage`**:
   - Manter o token apenas na RAM (`authStore.js`) é uma decisão consciente para proteção contra XSS.
2. 🚫 **Não alterar `spring.jpa.hibernate.ddl-auto` para `update` ou `create-drop` em produção**:
   - Mudar esta propriedade no [application-prod.yml](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/resources/application-prod.yml#L18) pode apagar ou corromper a base PostgreSQL de produção no Neon.
3. 🚫 **Não remover a instrução `TenantContext.clear()` do `TenantFilter`**:
   - A remoção causará contaminação de contexto entre chamadas de diferentes clientes/tenants.
4. 🚫 **Não remover a propriedade `withCredentials: true` no cliente Axios ([api.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/services/api.js))**:
   - Sem esta opção, os cookies `HttpOnly` com o Refresh Token não serão enviados nas requisições, quebrando o Silent Refresh.
5. 🚫 **Não alterar ou renomear arquivos de migração Flyway já executados (`db/migration/V1` a `V6`)**:
   - Alterar o conteúdo de scripts SQL antigos modifica o checksum gravado na tabela `flyway_schema_history` e impede o backend de iniciar.

---

## 7. Áreas abertas para mudança

Fora dos pontos sensíveis listados acima, o projeto está totalmente aberto para melhorias e novas implementações:

- ✨ **Interface e UX no Frontend**: Redesign de componentes, melhorias de acessibilidade, novas telas e refinamento de modais.
- ✨ **Relatórios e Analytics**: Criação de novos gráficos, novos exportadores (PDF/Excel) e métricas avançadas no Dashboard.
- ✨ **Regras de Negócio e Funcionalidades**: Adição de novos campos no cadastro de produtos e clientes, suporte a categorias, descontos de vendas e relatórios de comissão.
- ✨ **Integrações de Notificação**: Evolução dos modelos de e-mail e mensagens via WhatsApp no serviço de envios.
- ✨ **Otimização de Consultas**: Refatoração de queries Spring Data JPA e inclusão de índices no banco para ganho de performance.
