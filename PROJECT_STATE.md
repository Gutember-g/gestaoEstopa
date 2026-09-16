# 📌 Estado do Projeto (PROJECT_STATE.md)

Este documento registra o estado atual da arquitetura, funcionalidades, decisões técnicas e diretrizes de desenvolvimento do projeto **gestaoEstopa**. 

Seu objetivo é dar **contexto aos desenvolvedores e IAs** para evitar regressões e quebras acidentais em funcionalidades existentes, **sem impedir a evolução do código ou a refatoração de partes não sensíveis**.

---

## 1. Visão geral

- **O que o projeto faz**: O **gestaoEstopa** (FlowERP) é um sistema ERP SaaS Multi-tenant voltado para a gestão comercial e operacional de empresas de comércio e distribuição de estopas, panos industriais e trapos. O sistema gerencia cadastro de clientes, catálogo de produtos, controle de estoque com baixa automática, lançamento de vendas e orçamentos comerciais, geração de parcelas financeiras, módulo financeiro de contas a receber/pagar, emissão/disparo de pedidos (via E-mail e WhatsApp) com bypass de bloqueador de pop-up, central de notificações em tempo real com gestão de preferências, e dashboards analíticos com métricas de faturamento, lucro líquido e gráficos históricos.
- **Stack principal**:
  - **Frontend**: React 18, Vite, Tailwind CSS, Axios, Lucide React, Recharts, React Router v6, TanStack Query (React Query v5).
  - **Backend**: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA / Hibernate, Flyway.
  - **Banco de Dados**: H2 (em memória por padrão em Dev) e PostgreSQL no Neon (bancos `erp_dev` e `erp_prod` em nuvem).
  - **Integrações & Libs**: SendGrid (envio de e-mails), Twilio / WhatsApp Business Cloud API / Z-API (mensagens), Apache POI / iText / PDFBox (relatórios PDF/XLSX/CSV).
  - **Hospedagem & Infra**: Vercel (Frontend), Render (Backend Web Service), Neon (PostgreSQL Cloud Serverless).

---

## 2. Funcionalidades que já funcionam

| Funcionalidade | Status | O que faz | Onde está implementada |
| :--- | :--- | :--- | :--- |
| **Autenticação & Sessão JWT** | **Estável** | Login com credenciais, logout, Silent Refresh via cookie `HttpOnly` e gestão de token JWT estritamente em memória RAM. | [AuthController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/AuthController.java), [authStore.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/services/authStore.js), [api.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/services/api.js) |
| **Isolamento Multi-tenant** | **Estável** | Captura do tenant via cabeçalho `X-Tenant-ID` e isolamento no contexto do thread da requisição (`ThreadLocal`) com fallback para `empresa_demo`. | [TenantFilter.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/security/TenantFilter.java), [TenantContext.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/config/TenantContext.java) |
| **Gestão de Clientes & Histórico** | **Estável** | CRUD completo de clientes, busca inteligente (nome/CPF/CNPJ), histórico de compras e exportação em CSV, XLSX e PDF. | [ClienteController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/ClienteController.java), [Clientes.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Clientes.jsx) |
| **Gestão de Produtos & Estoque** | **Estável** | Cadastro de produtos por SKU, controle de estoque com baixa automática na confirmação de vendas e alertas de estoque baixo / sem movimentação há 30+ dias. | [ProdutoController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/ProdutoController.java), [Produtos.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Produtos.jsx) |
| **Modal Global de Vendas** | **Estável** | Emissão de vendas acionável globalmente a partir de qualquer tela (Dashboard, Vendas, Financeiro, Clientes) em modal flutuante sem navegar de página. | [VendaModal.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/components/VendaModal.jsx), [VendaModalContext.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/context/VendaModalContext.jsx), [Layout.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/components/Layout.jsx) |
| **Duplicação de Vendas** | **Estável** | Permite clonar pedidos a partir do módulo Financeiro (detalhes) ou de Vendas abrindo o modal global preenchido sem sair da tela. | [VendaModalContext.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/context/VendaModalContext.jsx), [Financeiro.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Financeiro.jsx), [Vendas.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Vendas.jsx) |
| **Fluxo Orçamento vs. Venda Confirmada** | **Estável** | Emissão com status `ORCAMENTO` (não gera parcelas no Financeiro nem afeta faturamento do Dashboard, título "ORÇAMENTO DE VENDA") ou `CONFIRMADA`. Botão `[✓ Aprovar Orçamento]` para conversão imediata com baixa de estoque e geração de parcelas. | [V7__add_status_to_venda.sql](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/resources/db/migration/V7__add_status_to_venda.sql), [VendaService.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/service/VendaService.java), [DocumentoGeneratorService.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/service/DocumentoGeneratorService.java), [Vendas.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Vendas.jsx) |
| **Módulo Financeiro & Contas a Receber** | **Estável** | Controle de parcelas a receber/pagar (`StatusParcela`: `PAGA`, `PENDENTE`, `ATRASADA`), liquidação/alteração de status, alteração de vencimento e filtros por período/status. | [FinanceiroController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/FinanceiroController.java), [Financeiro.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Financeiro.jsx) |
| **Dashboard Analítico & KPIs** | **Estável** | Indicadores de faturamento mensal, lucro líquido, caixa recebido/pendente, variação % vs. mês anterior, gráfico histórico de 12 meses, ranking Top 5 clientes/produtos, tabelas de vendas recentes e faturamentos a vencer. | [DashboardController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/DashboardController.java), [DashboardService.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/service/DashboardService.java), [Dashboard.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Dashboard.jsx) |
| **Emissão & Disparo de Pedidos** | **Estável** | Geração dinâmica de PDFs/XLSX de pedidos, envio por E-mail (mailto / SendGrid) e WhatsApp via formato oficial `wa.me` com abertura síncrona de aba (bypass de bloqueio de pop-up) e histórico de envios (`tb_venda_envio_historico`). | [dispatchHelper.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/utils/dispatchHelper.js), [VendaEnvioService.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/service/VendaEnvioService.java), [ConfiguracaoEnvioController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/ConfiguracaoEnvioController.java) |
| **Central de Notificações em Tempo Real** | **Estável** | Dropdown flutuante no cabeçalho com contagem de notificações não lidas, alertas automáticos (cobranças vencidas 🔴, metas 🎯, estoque baixo 📦, novos clientes 👥, vendas pendentes 🛒), marcação em lote/individual como lidas e filtro por preferências ativas em `localStorage`. | [NotificacaoController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/NotificacaoController.java), [NotificationDropdown.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/components/NotificationDropdown.jsx) |
| **Perfil, Empresa & Configurações** | **Estável** | Atualização dos dados cadastrais da empresa tenant, gestão de perfil de usuário (nome, e-mail, avatar, troca de senha), preferências de notificação e teste de integração SMTP/WhatsApp. | [PerfilController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/PerfilController.java), [EmpresaController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/EmpresaController.java), [Configuracoes.jsx](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Configuracoes.jsx) |
| **Health Check & Monitoramento** | **Estável** | Endpoints `/health` e `/api/health` para verificações de integridade por serviços de monitoramento e hospedagem (Render / Vercel). | [HealthController.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/controller/HealthController.java) |
| **Suíte de Testes Automatizados** | **Estável** | Testes unitários e de integração no frontend com React Testing Library e Jest cobrindo componentes, páginas e utilitários. | [Clientes.test.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Clientes.test.js), [Dashboard.test.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Dashboard.test.js), [Financeiro.test.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Financeiro.test.js), [Produtos.test.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Produtos.test.js), [Vendas.test.js](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/frontend/src/pages/Vendas.test.js) |

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
5. **Gerenciamento Global de Modais via Contexto React (`VendaModalContext.jsx`)**:
   - **Por quê**: Evita a duplicação de componentes de modal em várias telas (Dashboard, Financeiro, Clientes, Vendas) e previne redirecionamentos desnecessários para a rota `/vendas` quando o usuário deseja apenas emitir ou duplicar um pedido.
6. **Condicionalidade de Parcelamento por Status (`VendaService.java`)**:
   - **Por quê**: Permite a criação de Orçamentos comerciais sem impactar o fluxo de caixa nem gerar títulos de cobrança indevidos. A geração de parcelas em `tb_parcela` só ocorre quando o status da venda for `CONFIRMADA`.
7. **H2 em Memória em Dev e PostgreSQL (Neon) em Prod**:
   - **Por quê**: Permite que desenvolvedores subam o backend e rodem testes sem depender de instâncias externas ou Docker instalados localmente. Em produção, usa-se o PostgreSQL no Neon com SSL obrigatoriamente.
8. **Controle de Migrações exclusivamente por Flyway**:
   - **Por quê**: Garante consistência do modelo de dados entre ambientes (`V1__init.sql` a `V7__add_status_to_venda.sql`). O Hibernate está configurado com `ddl-auto: validate` em produção para proibir alterações automáticas imprevistas no schema.
9. **Abertura Síncrona de Pop-up do WhatsApp & Formato `wa.me` (`dispatchHelper.js`, `VendaModal.jsx`, `Vendas.jsx`)**:
   - **Por quê**: Navegadores modernos bloqueiam o `window.open` como pop-up se ele for chamado após requisições assíncronas (`await api.post` ou download de PDF). Ao instanciar a nova aba embrionária de forma síncrona no primeiro milissegundo do evento de clique e redirecioná-la via `waWindow.location.href` com o formato padrão `https://wa.me/[numero]?text=[mensagem]`, garante-se o funcionamento contínuo tanto em navegadores Desktop (WhatsApp Web/Desktop) quanto Mobile sem bloqueios de pop-up.

---

## 4. Pontos sensíveis / armadilhas conhecidas

- ⚠️ **Desencadeamento Síncrono de Janelas Pop-up (`window.open`)**:
  - Aberturas de novas abas (como o WhatsApp) devem **sempre** ser iniciadas de forma síncrona no handler direto do evento de clique do usuário (`onClick`), antes de qualquer instrução `await`. Chamadas a `window.open` efetuadas após `await` perdem a autorização do contexto do usuário e são silenciosamente bloqueadas pelo navegador.
- ⚠️ **Limpeza do `TenantContext` no bloco `finally`**:
  - O `TenantFilter` deve **sempre** executar `TenantContext.clear()` em um bloco `finally`. Em servidores Tomcat, as threads são reaproveitadas entre requisições; esquecer de limpar o `ThreadLocal` causará vazamento de dados de um tenant para outro.
- ⚠️ **Invalidação em Cadeia no TanStack Query (`queryClient.invalidateQueries`)**:
  - Ao aprovar ou salvar orçamentos/vendas, é crucial invalidar simultaneamente as chaves `['vendas']`, `['parcelas']` e `['dashboard']` para garantir a atualização em tempo real do faturamento e parcelas sem necessidade de recarregar a página.
- ⚠️ **Perda de dados ao reiniciar o backend em Dev**:
  - Por usar `jdbc:h2:mem:erpdb` por padrão no [application-dev.yml](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/resources/application-dev.yml#L3), os dados criados via interface somem ao reiniciar a aplicação. Caso precise manter dados salvos no dev local, mude para H2 em arquivo (`jdbc:h2:file:./data/erpdb`).
- ⚠️ **Suporte a CORS com Credenciais (`allowCredentials: true`)**:
  - Em [SecurityConfig.java](file:///c:/Users/guter/Documents/GitHub/gestaoEstopa/backend/src/main/java/com/erp/multitenant/config/SecurityConfig.java#L124), as origens devem ser explicitamente mapeadas (ou usar `allowedOriginPatterns`). O uso de `allowedOrigins("*")` combinado com `allowCredentials(true)` é rejeitado pelos navegadores e bloqueia as chamadas do frontend.
- ⚠️ **Transacionalidade no Lançamento de Vendas e Confirmação de Orçamentos (`VendaService.java`)**:
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
5. 🚫 **Não alterar ou renomear arquivos de migração Flyway já executados (`db/migration/V1` a `V7`)**:
   - Alterar o conteúdo de scripts SQL antigos modifica o checksum gravado na tabela `flyway_schema_history` e impede o backend de iniciar.

---

## 7. Áreas abertas para mudança

Fora dos pontos sensíveis listados acima, o projeto está totalmente aberto para melhorias e novas implementações:

- ✨ **Interface e UX no Frontend**: Redesign de componentes, melhorias de acessibilidade, novas telas e refinamento de modais.
- ✨ **Relatórios e Analytics**: Criação de novos gráficos, novos exportadores (PDF/Excel) e métricas avançadas no Dashboard.
- ✨ **Regras de Negócio e Funcionalidades**: Adição de novos campos no cadastro de produtos e clientes, suporte a categorias, descontos de vendas e relatórios de comissão.
- ✨ **Integrações de Notificação**: Evolução dos modelos de e-mail e mensagens via WhatsApp no serviço de envios.
- ✨ **Otimização de Consultas**: Refatoração de queries Spring Data JPA e inclusão de índices no banco para ganho de performance.
