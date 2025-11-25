# ✅ Plano de Batalha: XPACE OS 🚀

Este documento é o nosso mapa para transformar o XPACE OS em um produto completo e vendável. Ele é baseado na visão estratégica, dividida em pilares e fases.

---

## 🎯 Fase 1: Validação (Cliente Zero: Sua Escola)

O objetivo é tornar o sistema 100% funcional para a sua própria escola. Se funcionar para você, o produto está validado.

### Pilar 1: Gestão Invisível (O \"Feijão com Arroz\" Perfeito)
- **[x] Autenticação Completa**
- **[x] Gestão de Alunos (CRUD Completo)**
- **[x] Gestão de Turmas (CRUD Completo)**
- **[x] Lista de Chamada Digital**
- **[x] Financeiro (Simulado com Mock)**

### Pilar 2: Inteligência Artificial como \"Sócio\"
- **[x] Cobrador Empático (Protótipo)**

### Pilar 3: Foco no Nicho Artístico
- **[x] Gestão de Figurinos (Básico)**
- **[x] Módulo de Eventos/Espetáculos (com venda simulada)**
- **[x] Marketplace de Cursos e Produtos (com venda simulada)**

### Pilar 4: Comunidade e Engajamento
- **[x] Mural de Avisos Centralizado**
- **[x] Avaliações de Desenvolvimento do Aluno**
- **[x] Gestão de Documentos (Contratos, Regulamentos)**

### Pilar 5: Gestão e Inteligência Aprimorada
- **[⏸️] Gestão de Professores/Staff (Pausado)**
  - `[x] UI de Listagem e Convite`
  - `[ ] **PENDENTE (DEPLOY):** Criar Cloud Function para processar o convite de novos membros.`
- **[x] Calendário Escolar Unificado**
- **[x] Relatórios e KPIs (Dashboards Visuais)**

---

## 🚀 Fase 2: SaaS B2B (Produto Vendável)

Depois de validar internamente, preparamos o sistema para ser vendido a outras escolas.

- **[x] White Label / Personalização**
- **[x] Onboarding de Novas Escolas**
- **[x] Ferramentas de Migração de Dados**

- **[⏸️] Ativar Pagamentos Reais:**
  - `[ ] **PENDENTE:** Fazer o upgrade do Firebase para o plano Blaze.`
  - `[ ] **PENDENTE (DEPLOY):** Fazer o deploy da Cloud Function de convite de Staff.`
  - `[ ] **PENDENTE:** Fazer o deploy da Cloud Function que se comunica com a Asaas.`
  - `[ ] **PENDENTE:** Substituir o \`asaasMock.ts\` pela chamada real ao \`AsaasServerService.ts\`.`
  - `[ ] **PENDENTE:** Implementar webhooks para que a Asaas notifique o sistema automaticamente quando um pagamento for confirmado.`

---

## 💰 Fase 3: Expansão Contínua

Funcionalidades futuras para solidificar a liderança no nicho.

- **[ ] Aprofundar Inteligência Artificial:**
  - `[ ] Análise preditiva de evasão de alunos.`
  - `[ ] Sugestões automáticas de novas turmas com base na demanda.`
- **[ ] Aplicativo Mobile (React Native):**
  - `[ ] Versão inicial para Alunos e Responsáveis (consultar notas, presenças, agenda e comunicados).`
