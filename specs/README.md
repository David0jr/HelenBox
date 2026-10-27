# Especificações do Projeto HelenBox

Este diretório armazena todos os artefatos de **Spec-Driven Development (SDD)** do HelenBox.

## 📌 Estrutura Padrão de Funcionalidades

Cada nova funcionalidade ou módulo do HelenBox terá sua própria pasta numerada e padronizada:

```text
specs/
└── [###-nome-da-funcionalidade]/
    ├── spec.md         # Especificação de negócio, user stories e cenários Given/When/Then
    ├── plan.md         # Plano técnico, arquitetura e stack escolhida
    ├── data-model.md   # Modelagem de dados e regras de negócio
    ├── quickstart.md   # Guia de validação da feature
    ├── contracts/      # Contratos de interfaces e endpoints
    └── tasks.md        # Lista sequencial de tarefas (T001, T002...)
```

## 🚀 Como Iniciar uma Nova Feature

1. Usar o fluxo `/speckit.specify` ou preencher o modelo baseado em `.specify/templates/spec-template.md`.
2. Esclarecer dúvidas com `/speckit.clarify`.
3. Planejar a arquitetura técnica com `/speckit.plan`.
4. Gerar a lista de tarefas acionáveis com `/speckit.tasks`.
5. Executar a implementação tarefa por tarefa com `/speckit.implement`.
