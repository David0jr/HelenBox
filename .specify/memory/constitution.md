<!--
======================================================================
HELENBOX PROJECT CONSTITUTION - SPEC-DRIVEN DEVELOPMENT (SDD)
======================================================================
Version: 1.0.0
Ratification Date: 2026-10-26
Status: RATIFIED & ACTIVE
-->

# HelenBox Constitution

Esta Constituição estabelece os princípios fundamentais, regras de governança e padrões de engenharia inegociáveis do projeto **HelenBox**, operando sob a metodologia **Spec-Driven Development (Spec Kit)** com inteligência artificial (**Gemini Pro / Antigravity**).

Todos os planos, tarefas, artefatos de especificação e códigos gerados para o HelenBox devem aderir rigorosamente aos princípios abaixo.

---

## 🏛️ Princípios Fundamentais (Core Principles)

### I. Zero Redundância e Princípio DRY Estrito (Single Source of Truth)
- **Fonte Única de Verdade**: Todo modelo de dados, regra de negócio, tipo/interface, configuração e utilitário deve residir em um único ponto canônico do código.
- **Proibição de Duplicação**: Nenhuma lógica de validação, cálculo ou regra de processamento pode ser duplicada em diferentes camadas ou arquivos. Havendo necessidade de uso comum, deve ser extraída para módulos/serviços compartilhados reutilizáveis.
- **Reaproveitamento Guiado**: Antes de implementar uma nova função ou utilitário, verificar a base de código e especificações existentes para evitar reinvenção ou fragmentação.

### II. Prevenção Ativa de Erros e Qualidade Inegociável
- **Tipagem Estrita e Contratos Claros**: Interfaces e contratos de dados (APIs, schemas, DTOs) devem ser definidos explicitamente antes da implementação do código consumidor.
- **Programação Defensiva e Falha Rápida (Fail-Fast)**: Validação imediata de entradas e parâmetros nas bordas do sistema. Erros devem ser capturados, tratados e registrados com clareza, nunca ignorados silenciosamente.
- **Idempotência e Segurança**: Operações de persistência, mutação de estado e manipulação de arquivos devem ser seguras e idempotentes.

### III. Ciclo Spec-Driven Development (SDD) Obrigatório
O fluxo de desenvolvimento de qualquer funcionalidade deve obedecer à sequência disciplinada do Spec Kit:
1. **Especificação (`/speckit.specify` / `spec.md`)**:
   - Foco estrito no **QUÊ** e **POR QUÊ** (resultado para o usuário, jornadas de valor, cenários de aceite *Given/When/Then*). Independente de stack técnica nesta fase.
   - Divisão em histórias de usuário priorizadas (P1 = MVP viável, P2, P3).
2. **Esclarecimento (`/speckit.clarify`)**:
   - Identificar e eliminar ambiguidades, incertezas e edge cases antes de arquitetar.
3. **Planejamento Técnico (`/speckit.plan` / `plan.md`)**:
   - Definição do **COMO**: stack tecnológica, modelo de dados (`data-model.md`), contratos (`contracts/`), decisões arquiteturais e validação contra esta Constituição.
4. **Decomposição em Tarefas (`/speckit.tasks` / `tasks.md`)**:
   - Tarefas pequenas, atômicas e sequenciais, com IDs estáveis (`T001`, `T002`...), mapeadas para as histórias de usuário e indicando paralelismo seguro.
5. **Implementação e Convergência (`/speckit.implement` & `/speckit.converge`)**:
   - Execução tarefa a tarefa, validando continuamente com testes e verificações de qualidade.

### IV. Arquitetura Modular e Limites Bem Definidos
- **Separação de Preocupações (Separation of Concerns)**:
  - **Domínio/Regras de Negócio**: Agnóstico a frameworks e canais de entrega.
  - **Casos de Uso/Serviços**: Orquestração pura dos fluxos.
  - **Infraestrutura/Adaptadores**: I/O, bancos de dados, integrações externas.
  - **Interface do Usuário / API**: Consumidores finos dos serviços de aplicação.
- **Desacoplamento e Baixa Complexidade**: Funções e componentes devem ter responsabilidade única (SRP), alta coesão e baixo acoplamento.

### V. Testes Automatizados e Gates de Qualidade
- **Verificação Contínua**: Cada funcionalidade implementada deve possuir testes correspondentes para garantir que atende aos critérios de aceitação estipulados no `spec.md`.
- **Regressão Zero**: Novas alterações não podem quebrar fluxos previamente validados.

---

## 📁 Estrutura de Especificações do Projeto

Todas as especificações ativas e históricas do HelenBox são armazenadas no diretório `specs/`, organizadas por número e nome da funcionalidade:

```text
specs/
└── [001-nome-da-funcionalidade]/
    ├── spec.md         # Especificação de requisitos e cenários de aceite
    ├── plan.md         # Plano arquitetural e técnico
    ├── data-model.md   # Modelo de entidades e regras de validação (quando aplicável)
    ├── quickstart.md   # Guia rápido de verificação e uso da funcionalidade
    ├── contracts/      # Contratos de API / Schemas
    └── tasks.md        # Lista ordenada de tarefas de execução
```

---

## ⚡ Governança e Alterações Constitucionais

- Qualquer alteração nesta Constituição requer revisão deliberada e sincronização com os templates em `.specify/templates/`.
- Violações aos princípios de zero redundância e ciclo SDD devem ser bloqueadas na fase de planejamento técnico (`plan.md`).
