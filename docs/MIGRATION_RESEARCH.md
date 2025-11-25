# Pesquisa para Migração de Dados

Este documento serve como guia para entendermos a estrutura de dados de sistemas concorrentes. O objetivo é facilitar a criação de uma ferramenta de importação de dados para novas escolas que queiram adotar o XPACE OS.

## 📝 Como Preencher

Para cada sistema concorrente, tente encontrar a opção de **exportar dados**, geralmente para um arquivo Excel ou CSV. Analise as colunas desse arquivo e preencha as seções abaixo.

Se não tiver acesso ao sistema, descreva os campos que você *acredita* que sejam usados com base na sua experiência.

---

## 1. Dados de Alunos

Esta é a entidade mais importante. 

| Campo no XPACE OS | Campo no Concorrente (NextFit) | Campo no Concorrente (SisDança) | Campo no Concorrente (Outro) | Observações |
| :--- | :--- | :--- | :--- | :--- |
| `name` | | | | Nome completo do aluno |
| `email` | | | | E-mail principal |
| `phone` | | | | Telefone de contato |
| `birthDate` | | | | Data de Nascimento |
| `cpf` | | | | CPF do aluno |
| `rg` | | | | RG do aluno |
| `status` | | | | Ativo, Inativo, Prospect? |
| `address.street` | | | | Rua |
| `address.number` | | | | Número |
| `address.complement`| | | | Complemento |
| `address.neighborhood`| | | | Bairro |
| `address.city` | | | | Cidade |
| `address.state` | | | | Estado |
| `address.zip` | | | | CEP |
| `guardian.name` | | | | Nome do Responsável |
| `guardian.cpf` | | | | CPF do Responsável |
| `guardian.email`| | | | E-mail do Responsável |
| `guardian.phone`| | | | Telefone do Responsável |

---

## 2. Dados de Turmas

| Campo no XPACE OS | Campo no Concorrente (NextFit) | Campo no Concorrente (SisDança) | Campo no Concorrente (Outro) | Observações |
| :--- | :--- | :--- | :--- | :--- |
| `name` | | | | Nome da Turma (Ex: Ballet I) |
| `teacherName` | | | | Nome do Professor |
| `dayOfWeek` | | | | Dia da semana (Seg, Ter, Qua) |
| `startTime` | | | | Horário de Início (HH:mm) |
| `endTime` | | | | Horário de Fim (HH:mm) |
| `room` | | | | Sala de aula |

**Associação Aluno-Turma:** Como o sistema de origem indica que um aluno pertence a uma turma? É uma coluna na planilha de alunos? Uma planilha separada? 


---

## 3. Dados de Planos Financeiros

| Campo no XPACE OS | Campo no Concorrente (NextFit) | Campo no Concorrente (SisDança) | Campo no Concorrente (Outro) | Observações |
| :--- | :--- | :--- | :--- | :--- |
| `name` | | | | Nome do Plano (Ex: Plano Mensal) |
| `price` | | | | Preço do Plano (R$) |
| `frequency` | | | | Mensal, Trimestral, Anual? |

**Associação Aluno-Plano:** Como o sistema de origem indica qual plano um aluno contratou e qual a data de vencimento da fatura?

